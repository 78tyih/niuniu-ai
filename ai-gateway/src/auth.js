'use strict';
/**
 * 用户 token：nk1.<base64url(payload)>.<HMAC-SHA256>
 * payload = {u: userId, e: 到期时间戳(ms)}
 *
 * 为什么不用 Supabase JWT：P0 想零依赖跑起来。等接进 niuniuai.app 的账号体系，
 * 把 verify() 换成 Supabase 校验即可，其它代码一行不用动。
 */
const crypto = require('crypto');
const cfg = require('./config');

const b64u = (b) => Buffer.from(b).toString('base64url');

function sign(payloadB64) {
  return crypto.createHmac('sha256', cfg.SERVER_SECRET).update(payloadB64).digest('base64url');
}

function issue(userId, days = 30) {
  if (!cfg.SERVER_SECRET) throw new Error('缺少 SERVER_SECRET');
  const payload = b64u(JSON.stringify({ u: String(userId), e: Date.now() + days * 86400000 }));
  return `nk1.${payload}.${sign(payload)}`;
}

function verify(token) {
  if (cfg.NO_AUTH) return { ok: true, userId: null, dev: true };
  if (!cfg.SERVER_SECRET) return { ok: false, error: '服务端未配置 SERVER_SECRET' };
  const m = /^nk1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(String(token || ''));
  if (!m) return { ok: false, error: 'token 格式不对' };
  const [, payloadB64, sig] = m;
  const want = sign(payloadB64);
  const a = Buffer.from(sig), b = Buffer.from(want);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { ok: false, error: 'token 签名无效' };
  let p;
  try { p = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')); }
  catch { return { ok: false, error: 'token 载荷损坏' }; }
  if (!p.e || p.e < Date.now()) return { ok: false, error: 'token 已过期' };
  return { ok: true, userId: String(p.u) };
}

module.exports = { issue, verify };
