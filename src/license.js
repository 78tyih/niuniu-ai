'use strict';
/**
 * 授权密钥校验（离线，Ed25519 非对称签名）
 *
 * 设计要点：
 *   私钥只留在你手里（keys/license-private.pem，绝不能进包、绝不能进 git）
 *   软件里只埋公钥 —— 客户拿到软件也造不出密钥
 *   校验完全离线，不打电话回家，断网也能用
 *
 * 密钥格式： NN1-<payload>.<sig>
 *   payload = base64url(JSON{v,i,n,e,s})   v=版本 i=授权号 n=客户名 e=到期日 s=席位数
 *   sig     = base64url(Ed25519 签名)
 */
const crypto = require('crypto');

// ⚠ 这是公钥，可以随软件公开发布。私钥在 keys/ 下，绝不能进包。
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAWn8agwQC8uFlMMjHmKyRTwAM0UkvTshTO41zt6rkQ6c=
-----END PUBLIC KEY-----`;

const LICENSE_VERSION = 1;

function b64uDecode(s) {
  return Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/**
 * 校验一个密钥。
 * @returns {{ok:boolean, reason?:string, id?:string, name?:string,
 *            expires?:string, seats?:number, daysLeft?:number}}
 */
function verify(key) {
  const raw = String(key || '').trim().replace(/\s+/g, '');
  if (!raw) return { ok: false, reason: '请输入授权密钥' };

  const m = /^NN1-([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(raw);
  if (!m) return { ok: false, reason: '密钥格式不对（应以 NN1- 开头）' };

  const [, payloadB64, sigB64] = m;
  let sig;
  try {
    sig = b64uDecode(sigB64);
  } catch {
    return { ok: false, reason: '密钥含非法字符' };
  }

  // 签名对象必须是 payload 这段 base64url 字符串本身（签发侧签的就是它），
  // 不是它解码后的字节 —— 两边不一致会导致所有密钥都验不过。
  let sigOk = false;
  try {
    sigOk = crypto.verify(null, Buffer.from(payloadB64, 'utf8'),
                          { key: PUBLIC_KEY_PEM, format: 'pem' }, sig);
  } catch { /* 公钥未配置等情况 */ }
  if (!sigOk) return { ok: false, reason: '密钥签名无效（不是本产品签发的）' };

  let info;
  try {
    info = JSON.parse(b64uDecode(payloadB64).toString('utf8'));
  } catch {
    return { ok: false, reason: '密钥内容无法解析' };
  }
  if (info.v !== LICENSE_VERSION) return { ok: false, reason: `密钥版本不匹配（需要 v${LICENSE_VERSION}）` };
  if (!info.e) return { ok: false, reason: '密钥缺少有效期' };

  const exp = new Date(info.e + 'T23:59:59');
  if (Number.isNaN(exp.getTime())) return { ok: false, reason: '密钥有效期格式错误' };
  const daysLeft = Math.ceil((exp.getTime() - Date.now()) / 86400000);
  if (daysLeft < 0) return { ok: false, reason: `授权已于 ${info.e} 到期` };

  return {
    ok: true,
    id: info.i || '—',
    name: info.n || '—',
    expires: info.e,
    seats: info.s || 1,
    daysLeft,
  };
}

module.exports = { verify, LICENSE_VERSION };
