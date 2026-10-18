#!/usr/bin/env node
'use strict';
/**
 * 授权密钥工具
 *
 * 初始化（只做一次，生成密钥对）：
 *   node tools/keygen.js --init
 *   → 私钥写入 keys/license-private.pem（已 gitignore，绝不能外泄）
 *   → 公钥打印出来，粘进 src/license.js 的 PUBLIC_KEY_PEM
 *
 * 签发一个客户密钥：
 *   node tools/keygen.js --name "深圳市某某科技有限公司" --months 12 [--seats 1] [--id NN-2026-0001]
 *   → 打印 NN1-xxxx.yyyy
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const KEY_DIR = path.join(ROOT, 'keys');
const PRIV = path.join(KEY_DIR, 'license-private.pem');

function arg(k, d) {
  const i = process.argv.indexOf('--' + k);
  return i >= 0 ? process.argv[i + 1] : d;
}
const b64u = (b) => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function init() {
  fs.mkdirSync(KEY_DIR, { recursive: true });
  if (fs.existsSync(PRIV)) {
    console.error('私钥已存在，不会覆盖：' + PRIV);
    console.error('（覆盖会让所有已发出的密钥失效。确认要重来请先手动移走该文件。）');
    process.exit(1);
  }
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
  fs.writeFileSync(PRIV, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  fs.writeFileSync(path.join(KEY_DIR, 'license-public.pem'),
    publicKey.export({ type: 'spki', format: 'pem' }));

  console.log('✅ 密钥对已生成');
  console.log('   私钥：' + PRIV + '   ← 绝不外泄，绝不能进发布包');
  console.log('   公钥：' + path.join(KEY_DIR, 'license-public.pem'));
  console.log();
  console.log('把下面这整段（含首尾行）粘进 src/license.js 的 PUBLIC_KEY_PEM：');
  console.log();
  console.log(publicKey.export({ type: 'spki', format: 'pem' }));
}

function issue() {
  if (!fs.existsSync(PRIV)) {
    console.error('没有私钥，先跑：node tools/keygen.js --init');
    process.exit(1);
  }
  const name = arg('name', '未具名客户');
  const months = Number(arg('months', '12'));
  const seats = Number(arg('seats', '1'));
  const id = arg('id', 'NN-' + new Date().getFullYear() + '-' + String(Date.now()).slice(-4));

  // --days 优先：按天签发（试用 / 短期），--months 支持小数（0.5 = 半个月）也走这条
  const daysArg = arg('days', null);
  const exp = new Date();
  let spanTxt;
  if (daysArg !== null) {
    exp.setDate(exp.getDate() + Number(daysArg));
    spanTxt = Number(daysArg) + ' 天';
  } else {
    exp.setMonth(exp.getMonth() + Math.trunc(months));
    exp.setDate(exp.getDate() + Math.round((months - Math.trunc(months)) * 30));
    spanTxt = months + ' 个月';
  }
  const expires = exp.toISOString().slice(0, 10);

  const info = { v: 1, i: id, n: name, e: expires, s: seats };
  const payload = b64u(JSON.stringify(info));
  const priv = crypto.createPrivateKey(fs.readFileSync(PRIV, 'utf8'));
  const sig = b64u(crypto.sign(null, Buffer.from(payload, 'utf8'), priv));

  const key = `NN1-${payload}.${sig}`;
  console.log('授权号   : ' + id);
  console.log('客户名称 : ' + name);
  console.log('到期日   : ' + expires + '（' + spanTxt + '）');
  console.log('席位数   : ' + seats);
  console.log();
  console.log('密钥（发给客户）：');
  console.log();
  console.log('  ' + key);
  console.log();
  return key;
}

if (process.argv.includes('--init')) init();
else issue();
