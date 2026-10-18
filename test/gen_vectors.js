'use strict';
/**
 * 生成协议一致性测试向量：覆盖 0 / 整数 / 小数 / 负值 / 空 payload / 中文备注 /
 * 备注里夹带 "symbol" 这种注入串 / 大 epoch / 多品种。
 * 输出 JSON 给 test/ea_sim.py 做 EA 侧验签回归。
 */
const fs = require('fs');
const path = require('path');
const protocol = require('../src/bridge/protocol.js');

const SECRET = 'k]9f2-7d4a1c8e5b3f6a0d9c2e5b8a1f4d7e0c';

const cases = [
  { type: 'ORDER_MARKET', account: '1001', accountServer: 'BrokerA-Demo', epoch: 1,
    payload: { symbol: 'XAUUSD', side: 'BUY', volume_lots: 0.10, sl_points: 0, tp_points: 0, comment: '' } },
  { type: 'ORDER_MARKET', account: '1001', accountServer: 'BrokerA-Demo', epoch: 1,
    payload: { symbol: 'EURUSD', side: 'SELL', volume_lots: 1, sl_points: 500, tp_points: 1000, comment: '' } },
  { type: 'ORDER_MARKET', account: '1002', accountServer: 'BrokerB-Live', epoch: 7,
    payload: { symbol: 'US30Cash', side: 'BUY', volume_lots: 0.01, sl_points: 2500.5, tp_points: 0, comment: 'nn' } },
  { type: 'ORDER_MARKET', account: '1002', accountServer: 'BrokerB-Live', epoch: 999999,
    payload: { symbol: 'BTCUSD', side: 'SELL', volume_lots: 0, sl_points: 0, tp_points: 0, comment: '' } },
  { type: 'ORDER_MARKET', account: '1003', accountServer: '', epoch: 1,
    payload: { symbol: 'USDJPY', side: 'BUY', volume_lots: 12.5, sl_points: -0.5, tp_points: 0, comment: '' } },
  { type: 'POSITION_CLOSE', account: '1001', accountServer: 'BrokerA-Demo', epoch: 1,
    payload: { symbol: '', side: '', volume_lots: 0, sl_points: 0, tp_points: 0, comment: '', ticket: '8845123' } },
  { type: 'SYNC_STATE', account: '', accountServer: '', epoch: 3, payload: {} },
  { type: 'ORDER_MARKET', account: '1001', accountServer: 'BrokerA-Demo', epoch: 1,
    // 注入用例：备注里塞一个和字段名一样的串，验证 PayloadSub 局部解析没被绕过
    payload: { symbol: 'XAUUSD', side: 'BUY', volume_lots: 0.10, sl_points: 0, tp_points: 0,
               comment: '看 "symbol" 和 "volume_lots" 这两个词不该影响签名' } },
  { type: 'ORDER_MARKET', account: '1001', accountServer: '券商-中文服务器', epoch: 2,
    payload: { symbol: 'XAUUSDm', side: 'BUY', volume_lots: 0.03, sl_points: 0, tp_points: 0, comment: '黄金短线' } },
  { type: 'ORDER_MARKET', account: '1001', accountServer: 'BrokerA-Demo', epoch: 1,
    payload: { symbol: 'XAGUSD', side: 'SELL', volume_lots: 100, sl_points: 1e15 + 1, tp_points: 0, comment: '' } },
];

const commands = [];
const canonicals = [];
for (const c of cases) {
  const cmd = protocol.buildCommand({ ...c, secret: SECRET, ttlMs: 30000 });
  commands.push(cmd);
  canonicals.push(protocol.canonical(cmd));
}

const out = { secret: SECRET, commands, canonicals };
const dest = path.join(__dirname, 'vectors.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 2));
console.log('向量已生成:', dest, `(${commands.length} 条)`);
for (const c of canonicals) console.log('  canonical:', c);
