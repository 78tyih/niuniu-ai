'use strict';
/**
 * 生成「桌面端单文件交互预览」：把 src/ui/index.html + src/ui/app.js 原样内联，
 * 只把 window.nn（Electron 预加载桥）换成浏览器里的桩实现。
 *
 * 目的：Sera 不用装 Electron、不用开 Windows，就能直接点开看 6 个页面 + 主题 + 配色。
 * 这个文件不是产品本体 —— 产品本体是 src/ui/index.html + src/ui/app.js。
 *
 * 跑法：node tools/make-preview.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'index.html'), 'utf8');
const appjs = fs.readFileSync(path.join(ROOT, 'src', 'ui', 'app.js'), 'utf8');
// 策略资产库：内嵌进预览桩，让策略广场页在浏览器里也有真实数据。
const catalogJson = fs.readFileSync(path.join(ROOT, 'strategy-library', 'catalog.json'), 'utf8');

const STUB = `
/* ===== 预览桩：只替换 window.nn 这个桥，业务代码一行没改 ===== */
(function () {
  var KEY = 'niuniu-preview-prefs';
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  var prefs = Object.assign({ theme: '浅色', accent: 'orange', page: 'p-overview' }, load());
  function save(p) {
    prefs = Object.assign(prefs, p);
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) {}
    return prefs;
  }

  var TERMINALS = [
    { id: 'A1B2C3D4E5F6G7H8', path: 'MetaQuotes/Terminal/A1B2C3D4/MQL5', broker: 'IC Markets', eaLive: true },
    { id: 'Z9Y8X7W6V5U4T3S2', path: 'MetaQuotes/Terminal/Z9Y8X7W6/MQL5', broker: 'Exness', eaLive: false }
  ];
  var SNAPSHOT = {
    ok: true,
    snapshot: {
      eaLive: true,
      status: {
        signed: true, trading_allowed: true, symbol: 'EURUSD',
        quote: { bid: 1.08521, ask: 1.08535 },
        // symbol_info：让「AI 一键下单」的手数确定性计算在预览里也能跑通
        symbol_info: { point: 0.00001, digits: 5, tick_size: 0.00001, tick_value: 1.0,
                       volume_min: 0.01, volume_step: 0.01, volume_max: 100, stops_level: 0 },
        account: { login: 12345678, balance: 10000, equity: 10123.45, free_margin: 9800, mode: 'netting' },
        positions: [
          { ticket: 987654, symbol: 'EURUSD', type: 'BUY',  volume: 0.02, price_open: 1.084,  sl: 1.08,  profit: 23.45 },
          { ticket: 987655, symbol: 'XAUUSD', type: 'SELL', volume: 0.01, price_open: 2410.5, sl: 2425,  profit: -8.2 }
        ]
      },
      heart: { server: 'ICMarkets-Demo', epoch: 1 }
    }
  };
  var sentOnce = false;
  var halted = false;

  window.nn = {
    licenseStatus:   async () => ({ ok: true, license: { ok: true, name: '预览用户', id: 'NN1-DEMO', daysLeft: 30, expires: '2026-11-16' } }),
    licenseActivate: async () => ({ ok: false, reason: '预览模式不校验授权' }),
    discover:        async () => ({ ok: true, terminals: TERMINALS }),
    installEA:       async () => ({ ok: true, installed: 'NiuNiuBridge.ex5', isSource: false }),
    rebind:          async () => ({ ok: true, secret: '', epoch: 2 }),
    snapshot:        async () => SNAPSHOT,
    sendCommand:     async () => { sentOnce = false; return { ok: true, id: 'cmd-0001' }; },
    commandStatus:   async () => { if (sentOnce) return { ok: true, stage: 'EXECUTED' }; sentOnce = true; return { ok: true, stage: 'SENT' }; },
    getStrategyCatalog: async () => ({ ok: true, catalog: ${catalogJson} }),
    setHalt:         async (h) => { halted = (h === true); return { ok: true, halted: halted }; },
    haltStatus:      async () => ({ ok: true, halted: halted }),
    aiStatus:        async () => ({ enabled: true, connected: true, credits: 120, creditCny: 0.1, rechargeUrl: 'https://ai.niuniuai.app/recharge' }),
    aiConnect:       async () => ({ connected: true, credits: 120 }),
    aiDisconnect:    async () => ({ enabled: true, connected: false }),
    version:         async () => '1.0.0-preview',
    openExternal:    async (u) => { window.open(u, '_blank', 'noopener'); return true; },
    saveLog:         async () => true,
    onEvent:         () => () => {},
    getPrefs:        async () => prefs,
    setPrefs:        async (p) => save(p),
    getPrefsSync:    () => prefs
  };
})();
`;

let out = html
  // 预览版不需要 CSP（它本身就是内联脚本），产品本体 src/ui/index.html 里 CSP 仍然生效
  .replace(/<meta http-equiv="Content-Security-Policy"[^>]*>/, '')
  .replace('<script src="./app.js"></script>', `<script>${STUB}</script>\n<script>${appjs}</script>`);

if (out.includes('<script src="./app.js"></script>')) {
  console.error('× 内联失败：没找到 app.js 的 script 标签');
  process.exit(1);
}

const banner = '<!-- 自动生成，勿手改。源文件：src/ui/index.html + src/ui/app.js；重新生成：node tools/make-preview.js -->\n';
out = out.replace(/^<!DOCTYPE html>/, '<!DOCTYPE html>\n' + banner);

const target = path.join(ROOT, 'site', '牛牛AI-桌面端交互预览.html');   // site/ 进仓库；dist/ 是打包产物、被 ignore
fs.writeFileSync(target, out, 'utf8');
console.log(`√ 已生成 ${path.relative(ROOT, target)}  (${(out.length / 1024).toFixed(1)} KB)`);
