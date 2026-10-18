'use strict';
/**
 * 模拟充值闭环：客户下单 → ZPay 支付 → 回调验签 → 网关入账 → 客户调用扣费。
 * 用 mock 上游，不联网，产出可复现的闭环证据。
 *
 *   node test/recharge-loop.js
 */
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const assert = require('assert');

const TMP = path.join(__dirname, '..', 'data-loop');
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });

process.env.DATA_DIR = TMP;
process.env.SERVER_SECRET = 'loop-secret-0123456789';
process.env.ADMIN_SECRET = 'loop-admin';
process.env.UPSTREAM_MOCK = '1';
process.env.SYSTEM_PROMPT = 'sys';

const server = require('../src/server');
const auth = require('../src/auth');
const cfg = require('../src/config');

const PORT = 18788;
const BASE = 'http://127.0.0.1:' + PORT;
const ADMIN = { 'x-admin-secret': 'loop-admin' };

// 模拟「支付服务端」：签回调 + 验签
const PAY_SECRET = 'zpay-webhook-secret-demo';
const sign = (payload) => crypto.createHmac('sha256', PAY_SECRET).update(payload).digest('hex');
const verify = (payload, sig) => {
  const expect = sign(payload);
  const a = Buffer.from(expect), b = Buffer.from(sig);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

// 模拟「牛牛 AI 后端」：收到支付回调 → 验签 → 调网关入账（带 orderId 幂等）
async function handlePaymentCallback(orderId, userId, amountCny, sig, payload) {
  if (!verify(payload, sig)) return { ok: false, error: '验签失败，疑似伪造回调' };
  const credits = Math.round(amountCny / cfg.CREDIT_CNY);
  const r = await fetch(BASE + '/v1/admin/topup', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...ADMIN },
    body: JSON.stringify({ userId, credits, orderId, note: 'ZPay 支付到账 ¥' + amountCny }),
  });
  return { ok: true, body: await r.json() };
}

const post = (p, body, headers = {}) => fetch(BASE + p, {
  method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body || {}),
}).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));
const creditsOf = async (token) =>
  (await fetch(BASE + '/v1/credits', { headers: { authorization: 'Bearer ' + token } }).then((r) => r.json())).credits;

(async () => {
  await new Promise((r) => server.listen(PORT, r));
  console.log('== 充值闭环模拟（mock 上游，不联网）==\n');

  // 1. 客户注册，后端发 token
  const userId = 'customer-0001';
  const token = auth.issue(userId, 30);
  console.log('① 客户注册 → 后端签发访问令牌');
  console.log(`   用户 ${userId} · token ${token.slice(0, 18)}…\n`);

  // 2. 客户下单 ¥100
  const orderId = 'ZP' + Date.now();
  const amountCny = 100;
  console.log('② 客户下单 ¥' + amountCny + ' → 订单号 ' + orderId);

  // 3. ZPay 支付成功回调（带签名）
  const payload = JSON.stringify({ orderId, userId, amountCny, status: 'paid' });
  const sig = sign(payload);
  console.log('③ ZPay 支付成功 → 回调（HMAC-SHA256 签名）');

  // 4. 后端验签 + 入账
  const cb = await handlePaymentCallback(orderId, userId, amountCny, sig, payload);
  assert.ok(cb.ok, '回调验签应通过');
  console.log('④ 后端验签通过 → 网关入账 ' + amountCny / cfg.CREDIT_CNY + ' 积分\n');

  // 5. 客户查余额
  let bal = await creditsOf(token);
  assert.strictEqual(bal, amountCny / cfg.CREDIT_CNY);
  console.log('⑤ 客户查余额 = ' + bal + ' 积分（¥' + amountCny + ' 到账）\n');

  // 6. 回调重放 → 幂等拦截
  const dup = await handlePaymentCallback(orderId, userId, amountCny, sig, payload);
  assert.strictEqual(dup.body.dup, true, '重复回调应被幂等拦截');
  bal = await creditsOf(token);
  assert.strictEqual(bal, amountCny / cfg.CREDIT_CNY, '重放不得重复入账');
  console.log('⑥ 回调重放 → 幂等拦截，余额不变（仍是 ' + bal + '）\n');

  // 7. 伪造签名回调 → 拒绝
  const fake = await handlePaymentCallback('ZPfake', userId, 999, 'deadbeef', payload);
  assert.strictEqual(fake.ok, false, '伪造签名应被拒');
  console.log('⑦ 伪造签名回调 → 拒绝，不入账\n');

  // 8. 客户调用 AI（deep），按 token 扣费
  const chat = await post('/v1/chat', { messages: [{ role: 'user', content: '帮我分析下今天 BTC 的持仓' }], tier: 'deep' }, { authorization: 'Bearer ' + token });
  assert.strictEqual(chat.status, 200);
  console.log('⑧ 客户发起 AI 调用（deep）');
  console.log('   扣 ' + chat.body.charged + ' 分 · 退 ' + chat.body.refunded + ' 分（预扣多退）');
  console.log('   我方模型 ' + chat.body.model + ' · 上游 ' + chat.body.upstream + ' · 上游模型 ' + chat.body.upstreamModel + '\n');

  // 9. 最终余额核对
  bal = await creditsOf(token);
  const expect = amountCny / cfg.CREDIT_CNY - chat.body.charged;
  assert.strictEqual(bal, expect);
  console.log('⑨ 最终余额 = ' + bal + ' 分（= 到账 ' + amountCny / cfg.CREDIT_CNY + ' − 调用 ' + chat.body.charged + '）✓\n');

  console.log('闭环成立：充钱 → 到账 → 能调用 → 按 token 扣费 → 余额一致');
  server.close();
  fs.rmSync(TMP, { recursive: true, force: true });
})().catch((e) => {
  console.error('\n✗ 失败：' + (e && e.message));
  try { server.close(); } catch { /* noop */ }
  process.exit(1);
});
