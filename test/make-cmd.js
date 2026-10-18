#!/usr/bin/env node
'use strict';
/**
 * 生成一条签名命令（供 verify-loop.sh 调用）
 *
 * 用法：
 *   node test/make-cmd.js --type ORDER_MARKET --secret <hex> \
 *        --account 123456 --server BrokerDemo --epoch 1 \
 *        --payload '{"symbol":"EURUSD","side":"BUY","volume_lots":0.01}'
 *
 * 输出到 stdout 一行 JSON，调用方负责投递到 inbox/cmd_<id>.json
 */
const protocol = require('../src/bridge/protocol.js');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : def;
}

const cmd = protocol.buildCommand({
  type: arg('type', 'SYNC_STATE'),
  account: arg('account', ''),
  accountServer: arg('server', ''),
  epoch: Number(arg('epoch', '1')),
  secret: arg('secret', ''),
  ttlMs: Number(arg('ttl', '30000')),
  payload: JSON.parse(arg('payload', '{}')),
  issuedAtMs: arg('issuedAt') ? Number(arg('issuedAt')) : undefined,
});

// 允许注入 issued_at_ms：回测/测试器里本机时间与模拟时间不一致时必须覆盖
if (arg('issuedAt')) cmd.issued_at_ms = Number(arg('issuedAt'));
if (arg('secret')) cmd.sig = protocol.sign(arg('secret'), cmd);

process.stdout.write(JSON.stringify(cmd));
