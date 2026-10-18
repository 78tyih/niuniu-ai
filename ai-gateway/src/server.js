'use strict';
/**
 * 牛牛 AI 网关服务：鉴权 → 限流 → 预扣 → 调上游 → 结算 → 记账。
 * 零依赖（Node 内置 http + fetch），可直接部署到 Zeabur / 任意容器。
 */
const http = require('http');
const crypto = require('crypto');
const cfg = require('./config');
const store = require('./store');
const billing = require('./billing');
const upstream = require('./upstream');
const pricing = require('./pricing');
const auth = require('./auth');

const MAX_BODY = 256 * 1024;

function json(res, code, obj) {
  const b = Buffer.from(JSON.stringify(obj), 'utf8');
  res.writeHead(code, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': b.length,
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'content-type,authorization,x-admin-secret',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
  });
  res.end(b);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let n = 0; const parts = [];
    req.on('data', (c) => {
      n += c.length;
      if (n > MAX_BODY) { reject(new Error('请求体过大')); req.destroy(); return; }
      parts.push(c);
    });
    req.on('end', () => {
      if (!parts.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(parts).toString('utf8'))); }
      catch (e) { reject(new Error('请求体不是合法 JSON')); }
    });
    req.on('error', reject);
  });
}

const bearer = (req) => {
  const h = String(req.headers.authorization || '');
  return h.startsWith('Bearer ') ? h.slice(7) : '';
};
const safeEqual = (a, b) => {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length && x.length === y.length && crypto.timingSafeEqual(x, y);
};

function cleanMessages(list, maxChars) {
  if (!Array.isArray(list)) return null;
  const out = [];
  let total = 0;
  for (const m of list.slice(-20)) {           // 最多带 20 条历史，防刷
    const role = m && ['system', 'user', 'assistant'].includes(m.role) ? m.role : null;
    if (!role) continue;
    const raw = String(m.content == null ? '' : m.content);
    if (!raw.trim()) continue;
    total += raw.length;                       // 按原始长度算，先判断再截断
    if (total > maxChars) return { tooLong: true };   // 输入硬边界：只封输出不封输入 = 成本上不封顶
    out.push({ role, content: raw.slice(0, 8000) });
  }
  return out.length ? out : { empty: true };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;

  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (p === '/healthz') {
    return json(res, 200, {
      ok: true, mock: cfg.MOCK, upstreams: cfg.UPSTREAMS.length,
      tiers: Object.fromEntries(Object.entries(cfg.TIERS).map(([k, v]) => [k, v.credits])),
      rechargeUrl: cfg.RECHARGE_URL,
    });
  }

  // ---- 管理接口 ----
  if (p.startsWith('/v1/admin/')) {
    if (!cfg.ADMIN_SECRET || !safeEqual(req.headers['x-admin-secret'], cfg.ADMIN_SECRET)) {
      return json(res, 401, { ok: false, error: '管理密钥不对' });
    }
    let body = {};
    try { body = await readBody(req); } catch (e) { return json(res, 400, { ok: false, error: e.message }); }

    if (p === '/v1/admin/topup') {
      const userId = String(body.userId || '');
      const credits = Number(body.credits || 0);
      const orderId = String(body.orderId || '');
      if (!userId || !Number.isFinite(credits) || credits === 0) {
        return json(res, 400, { ok: false, error: '需要 userId 和非零 credits' });
      }
      // 订单幂等：支付回调重放 / 乱序不得重复入账
      if (orderId) {
        const dup = await store.seenOrder(orderId);
        if (!dup.ok) return json(res, 200, { ok: true, dup: true, note: '订单已处理，跳过重复入账' });
      }
      const r = await billing.topup(userId, credits, String(body.note || '') + (orderId ? ' #' + orderId : ''));
      return json(res, 200, { ok: true, userId, credits: r.credits });
    }
    if (p === '/v1/admin/token') {
      const userId = String(body.userId || '');
      if (!userId) return json(res, 400, { ok: false, error: '需要 userId' });
      try {
        return json(res, 200, { ok: true, token: auth.issue(userId, Number(body.days || 30)) });
      } catch (e) { return json(res, 500, { ok: false, error: e.message }); }
    }
    if (p === '/v1/admin/ledger') {
      const db = await store.dump();
      const userId = String(url.searchParams.get('userId') || '');
      const rows = userId ? db.ledger.filter((r) => r.user === userId) : db.ledger.slice(-200);
      const settle = rows.filter((r) => r.type === 'settle');
      const cost = settle.reduce((s, r) => s + (Number(r.costCny) || 0), 0);
      const rev = settle.reduce((s, r) => s + (Number(r.credits) || 0) * -1 * cfg.CREDIT_CNY, 0);
      return json(res, 200, {
        ok: true, rows: rows.slice(-200),
        summary: { calls: settle.length, costCny: Math.round(cost * 1e4) / 1e4, revenueCny: Math.round(rev * 1e4) / 1e4 },
      });
    }
    return json(res, 404, { ok: false, error: '没有这个管理接口' });
  }

  // ---- 业务接口 ----
  const who = auth.verify(bearer(req));
  if (!who.ok) return json(res, 401, { ok: false, error: who.error });

  try {
    if (p === '/v1/credits' && req.method === 'GET') {
      const b = await store.balance(who.userId);
      return json(res, 200, { ok: true, ...b, creditCny: cfg.CREDIT_CNY, rechargeUrl: cfg.RECHARGE_URL });
    }

    if (p === '/v1/chat' && req.method === 'POST') {
      let body;
      try { body = await readBody(req); } catch (e) { return json(res, 400, { ok: false, error: e.message }); }

      const userId = who.userId ?? String(body.userId || 'demo');
      const tier = ['fast', 'deep'].includes(body.tier) ? body.tier : 'fast';
      // 输入校验放在限流/扣费之前：格式错、超长这种廉价检查不该消耗用户积分
      const messages = cleanMessages(body.messages, cfg.TIERS[tier].maxInputChars);
      if (!messages || messages.empty) return json(res, 400, { ok: false, error: 'messages 为空或格式不对' });
      if (messages.tooLong) {
        return json(res, 413, { ok: false, error: `输入过长（${tier} 档上限 ${cfg.TIERS[tier].maxInputChars} 字符），请精简后重试` });
      }

      const gate = await store.acquire(userId);
      if (!gate.ok) return json(res, 429, { ok: false, error: gate.error });

      try {
        const rate = await store.hit(userId);
        if (!rate.ok) return json(res, 429, { ok: false, error: rate.error });

        const model = cfg.TIERS[tier].model;
        if (!pricing.sellPrice(model)) {
          return json(res, 503, { ok: false, error: '模型 ' + model + ' 未配置售价，请联系管理员' });
        }
        // 预扣 = 按「输入上限 + 输出上限」估的保守最大值；结算按实际 token 多退少补
        const hold = await billing.reserve(userId, pricing.estimateCredits(tier), { tier, model });
        if (!hold.ok) {
          return json(res, 402, { ok: false, error: '积分不足，请先充值', credits: hold.credits, rechargeUrl: cfg.RECHARGE_URL });
        }

        const full = [{ role: 'system', content: cfg.SYSTEM_PROMPT }, ...messages];
        try {
          const r = await upstream.chat(full, tier);
          const actual = pricing.creditsFor(model, r.usage?.prompt_tokens, r.usage?.completion_tokens);
          const st = await billing.settle(hold.holdId, {
            credits: actual, tier, model, upstream: r.upstream, upstreamModel: r.model,
            usage: r.usage, costCny: r.costCny, userId,
          });
          return json(res, 200, {
            ok: true, reply: r.text, tier, model, charged: st.charged, refunded: st.refunded,
            balance: st.credits, usage: r.usage, upstream: r.upstream, upstreamModel: r.model,
          });
        } catch (e) {
          // 上游失败 / 超时：全额退，绝不白扣积分
          const st = await billing.refund(hold.holdId, e.message, userId);
          console.error(`[chat] 失败已退款 user=${userId} reason=${e.message}`);
          return json(res, 502, { ok: false, error: 'AI 服务暂时不可用，本次不扣积分', balance: st.credits });
        }
      } finally {
        await store.release(userId);
      }
    }

    return json(res, 404, { ok: false, error: '没有这个接口' });
  } catch (e) {
    console.error('[server] ' + e.stack);
    return json(res, 500, { ok: false, error: '服务端异常' });
  }
});

if (require.main === module) {
  if (!cfg.SERVER_SECRET && !cfg.NO_AUTH) {
    console.error('缺少 SERVER_SECRET。生成一个：');
    console.error('  export SERVER_SECRET=' + crypto.randomBytes(24).toString('hex'));
    process.exit(1);
  }
  if (!cfg.UPSTREAMS.length && !cfg.MOCK) {
    console.warn('⚠ 没配上游且没开 UPSTREAM_MOCK，将走 mock（不会真的调模型）');
  }
  server.listen(cfg.PORT, async () => {
    await store.resetInflight();     // 上次崩溃可能留下卡死的在途计数
    const n = await billing.sweepExpired();   // 悬挂预扣全部退款，别锁死用户积分
    if (n) console.warn(`  启动清扫：${n} 笔悬挂预扣已退款`);
    console.log(`牛牛 AI 网关 → http://localhost:${cfg.PORT}`);
    console.log(`  档位: fast=${cfg.TIERS.fast.credits}分(输入≤${cfg.TIERS.fast.maxInputChars}字)  deep=${cfg.TIERS.deep.credits}分(输入≤${cfg.TIERS.deep.maxInputChars}字)  (1 积分 = ¥${cfg.CREDIT_CNY})`);
    console.log(`  并发: 每用户同时在途 ≤${cfg.MAX_INFLIGHT}  ·  限流 ${cfg.RATE_PER_MIN}/分 ${cfg.RATE_PER_DAY}/天`);
    console.log(`  上游: ${cfg.UPSTREAMS.length ? cfg.UPSTREAMS.map((u) => u.name).join(', ') : 'mock'}`);
    console.log(`  账本: ${store.FILE}`);
  });
}

module.exports = server;
