'use strict';
/**
 * 积分计费：预扣 → 结算（多退）→ 失败全额退。
 *
 * 为什么是「按档预扣 + 按档结算」而不是按 token 折算：
 *   客户看得懂（快问 1 分、深度 6 分），成本可控（max_tokens 封顶），争议少。
 *   token 用量照样记进流水，用来算真实成本和发现异常，但不拿来跟客户算账。
 */
const crypto = require('crypto');
const store = require('./store');
const cfg = require('./config');

const holds = new Map();   // holdId -> {userId, credits, at}（进程内缓存；持久层在 store.holds）

function holdId() { return 'h_' + crypto.randomBytes(8).toString('hex'); }

async function reserve(userId, credits, meta = {}) {
  const r = await store.applyDelta(userId, -credits, {
    type: 'reserve', credits: -credits, reserveDelta: credits,
    minCredits: credits, tier: meta.tier, ref: meta.ref,
  });
  if (!r.ok) return { ok: false, error: r.error, credits: r.credits };
  const id = holdId();
  holds.set(id, { userId, credits, at: Date.now() });
  await store.putHold(userId, id, credits);   // 落盘：进程崩溃后也能被 sweep 退款
  return { ok: true, holdId: id, credits: r.credits, reserved: r.reserved };
}

async function settle(holdId, meta = {}) {
  const h = holds.get(holdId) || (await store.takeHold(meta.userId, holdId));
  if (!h) return { ok: false, error: '预扣记录不存在或已结算' };
  holds.delete(holdId);
  await store.takeHold(h.userId, holdId);

  const actual = Math.min(Number(meta.credits ?? h.credits), h.credits);
  const back = Math.round((h.credits - actual) * 1e6) / 1e6;

  const r = await store.applyDelta(h.userId, back, {
    type: 'settle', credits: -actual, reserveDelta: -h.credits,
    tier: meta.tier, model: meta.model, upstream: meta.upstream, upstreamModel: meta.upstreamModel,
    usage: meta.usage, costCny: meta.costCny,
    margin: marginOf(actual, meta.costCny),
  });

  // 毛利跌破告警线：记一条，供运营看板捞
  const m = marginOf(actual, meta.costCny);
  if (m !== null && (1 - m) > cfg.MARGIN_WARN) {
    console.warn(`[billing] 毛利告警 user=${h.userId} 收${actual}分 成本¥${meta.costCny} 占比${(1 - m).toFixed(2)}`);
  }
  return { ok: true, charged: actual, refunded: back, credits: r.credits };
}

async function refund(holdId, reason, userIdHint) {
  let h = holds.get(holdId);
  if (h) { holds.delete(holdId); await store.takeHold(h.userId, holdId); }
  else if (userIdHint) h = await store.takeHold(userIdHint, holdId);
  if (!h) return { ok: false, error: '预扣记录不存在或已退还' };
  const r = await store.applyDelta(h.userId, h.credits, {
    type: 'refund', credits: h.credits, reserveDelta: -h.credits, reason: String(reason || ''),
  });
  return { ok: true, refunded: h.credits, credits: r.credits };
}

// 充值（支付回调 / 管理员手工）
async function topup(userId, credits, note = '') {
  return store.applyDelta(userId, credits, { type: 'topup', credits, note });
}

// 启动时清扫：超时未结算的预扣一律退款（崩溃 / 重启 / 上游卡死都不该锁死用户积分）
async function sweepExpired() {
  const list = await store.expiredHolds(cfg.HOLD_TTL_MS);
  for (const it of list) {
    const r = await refund(it.holdId, '悬挂预扣自动退款（' + Math.round(it.ageMs / 1000) + 's）', it.userId);
    if (r.ok) console.warn(`[billing] 悬挂预扣已退款 user=${it.userId} ${it.credits}分`);
  }
  return list.length;
}

// 毛利 = 1 - 成本/收入；actual=0 时不算
function marginOf(actualCredits, costCny) {
  if (!actualCredits || costCny === undefined || costCny === null) return null;
  const revenue = actualCredits * cfg.CREDIT_CNY;
  if (revenue <= 0) return null;
  return Math.round((1 - costCny / revenue) * 1e4) / 1e4;
}

module.exports = { reserve, settle, refund, topup, sweepExpired, marginOf };
