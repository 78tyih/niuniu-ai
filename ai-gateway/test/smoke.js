'use strict';
/**
 * 冒烟测试：不联网，跑 mock 上游，验证「按 token 计费」在各种情况下都对。
 *
 *   node test/smoke.js
 *
 * 断言：
 *   1) 充值后余额正确
 *   2) 快问按 token 扣（luna mock = 2 分）、深度按 token 扣（sol mock = 98 分）
 *   3) 上游失败 → 全额退款，余额不变
 *   4) 积分不足 → 402，且一分不扣
 *   5) token 伪造 / 过期 → 401
 *   6) 每分钟限流生效
 *   7) 流水里记了成本，能算出毛利
 *   8) 退款有独立流水（对账可查）
 *   9) 用户之间余额隔离
 *   10) 非法 messages → 400
 *   11) 输入超长 → 413 且不扣分
 */
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const TMP = path.join(__dirname, '..', 'data-test');
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });

process.env.DATA_DIR = TMP;
process.env.SERVER_SECRET = 'test-secret-0123456789';
process.env.ADMIN_SECRET = 'test-admin';
process.env.UPSTREAM_MOCK = '1';
process.env.RATE_PER_MIN = '3';
process.env.RATE_PER_DAY = '50';
process.env.SYSTEM_PROMPT = 'sys';

const server = require('../src/server');
const auth = require('../src/auth');

const PORT = 18787;
const BASE = 'http://127.0.0.1:' + PORT;
const ADMIN = { 'x-admin-secret': 'test-admin' };

const call = async (p, init = {}) => {
  const r = await fetch(BASE + p, init);
  return { status: r.status, body: await r.json().catch(() => ({})) };
};
const post = (p, body, headers = {}) => call(p, {
  method: 'POST',
  headers: { 'content-type': 'application/json', ...headers },
  body: JSON.stringify(body || {}),
});
const chat = (token, content, tier = 'fast') =>
  post('/v1/chat', { messages: [{ role: 'user', content }], tier }, { authorization: 'Bearer ' + token });

let pass = 0;
const ok = (name) => { pass++; console.log('  ✓ ' + name); };

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  console.log('== 冒烟测试（按 token 计费 · mock 上游）==');

  // 0) 健康检查 & 无 token 拒绝
  let r = await call('/healthz');
  assert.strictEqual(r.status, 200); ok('健康检查 200');
  r = await post('/v1/chat', { messages: [{ role: 'user', content: 'hi' }] });
  assert.strictEqual(r.status, 401); ok('不带 token → 401');

  // 5) 伪造 token
  r = await post('/v1/chat', { messages: [{ role: 'user', content: 'hi' }] },
    { authorization: 'Bearer nk1.eyJ1IjoiYSJ9.forged' });
  assert.strictEqual(r.status, 401); ok('伪造 token → 401');

  // 建用户
  const t1 = auth.issue('u1', 1);
  const t2 = auth.issue('u2', 1);

  // 4) 零积分下单
  r = await chat(t1, '你好');
  assert.strictEqual(r.status, 402); ok('零积分 → 402 且未扣');

  // 1) 充值（1 积分 = 1 厘，充值 10000 分 = 10 元）
  r = await post('/v1/admin/topup', { userId: 'u1', credits: 10000, note: '测试充值' }, ADMIN);
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.credits, 10000); ok('充值 10000 → 余额 10000');

  // 2) 快问按 token 扣（fast 档 luna，mock prompt=2200/completion=520）
  r = await chat(t1, '我现在持仓怎么样');
  assert.strictEqual(r.status, 200);
  assert.ok(r.body.reply && r.body.charged === 2 && r.body.balance === 9998,
    '快问应扣 2 分，实际 ' + JSON.stringify(r.body));
  ok('快问按 token 扣 2 分 · 余额 9998 · 有回复');

  // 深度按 token 扣（deep 档 sol，mock prompt=2200/completion=2400）
  r = await chat(t1, '帮我深度分析一下', 'deep');
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.charged, 98, '深度应扣 98 分，实际 ' + JSON.stringify(r.body));
  assert.strictEqual(r.body.balance, 9900); ok('深度按 token 扣 98 分 · 余额 9900');

  assert.strictEqual((await call('/v1/credits', { headers: { authorization: 'Bearer ' + t1 } })).body.credits, 9900);
  ok('余额查询 = 9900');

  // 3) 上游失败退款（用另一个用户，避开限流计数）
  const t3 = auth.issue('u3', 1);
  await post('/v1/admin/topup', { userId: 'u3', credits: 500 }, ADMIN);
  r = await chat(t3, 'FAIL 请触发上游错误');
  assert.strictEqual(r.status, 502, '上游失败应返回 502，实际 ' + r.status);
  assert.strictEqual(r.body.balance, 500, '失败必须全额退，实际余额 ' + r.body.balance);
  ok('上游失败 → 502 且全额退款（余额仍 500）');

  // 6) 限流（RATE_PER_MIN=3，u1 已用 3 次：402那次 + 快问 + 深度）
  r = await chat(t1, '第四次应该被限流');
  assert.strictEqual(r.status, 429); ok('超过每分钟上限 → 429');

  // 7) 流水与成本
  const led = await call('/v1/admin/ledger?userId=u1', { headers: ADMIN });
  assert.strictEqual(led.status, 200);
  const settle = led.body.rows.filter((x) => x.type === 'settle');
  assert.strictEqual(settle.length, 2, '应有 2 条结算');
  assert.ok(settle.every((x) => typeof x.costCny === 'number' && x.margin !== null), '结算要记成本和毛利');
  assert.ok(led.body.summary.revenueCny > led.body.summary.costCny, '收入应大于成本');
  ok(`流水记录成本与毛利（收 ¥${led.body.summary.revenueCny} / 成本 ¥${led.body.summary.costCny}）`);

  // 8) 退款流水存在（退款记在 u3 名下，查全量流水）
  const ledAll = await call('/v1/admin/ledger', { headers: ADMIN });
  const refunds = ledAll.body.rows.filter((x) => x.type === 'refund' && x.user === 'u3');
  assert.strictEqual(refunds.length, 1, '应有一条 u3 的退款流水');
  assert.strictEqual(refunds[0].credits, 3, '退款应为预扣的 3 分');
  ok('退款有独立流水（对账可查）');

  // 9) 用户隔离
  r = await chat(t2, '另一个用户');
  assert.strictEqual(r.status, 402); ok('用户之间余额隔离（u2 仍为 0）');

  // 10) 非法 messages
  r = await post('/v1/chat', { messages: 'not-an-array' }, { authorization: 'Bearer ' + t1 });
  assert.strictEqual(r.status, 400); ok('非法 messages → 400');

  // 11) 输入超长 → 413（不扣积分）
  const before = (await call('/v1/credits', { headers: { authorization: 'Bearer ' + t2 } })).body.credits;
  r = await post('/v1/chat', { messages: [{ role: 'user', content: '长'.repeat(50000) }] },
    { authorization: 'Bearer ' + t2 });
  assert.strictEqual(r.status, 413, '超长输入应 413，实际 ' + r.status);
  const after = (await call('/v1/credits', { headers: { authorization: 'Bearer ' + t2 } })).body.credits;
  assert.strictEqual(after, before, '超长输入不得扣分');
  ok('输入超长 → 413 且不扣分');

  server.close();
  fs.rmSync(TMP, { recursive: true, force: true });
  console.log(`\n全部通过：${pass} 项`);
})().catch((e) => {
  console.error('\n✗ 失败：' + (e && e.message));
  try { server.close(); } catch { /* noop */ }
  process.exit(1);
});
