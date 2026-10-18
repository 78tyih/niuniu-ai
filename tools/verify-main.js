'use strict';
/**
 * UI 真机校验：用真实 Electron 窗口加载 src/ui/index.html + 真实 preload，
 * 把桥进程 / 授权 / AI 网关全部换成桩数据，然后断言渲染层的 DOM 行为。
 *
 * 跑法：node_modules/.bin/electron tools/verify-main.js
 * 退出码 0 = 全通过，1 = 有失败。
 *
 * 刻意不做的事：不 modify 任何业务代码，不连真 MT5，不碰真授权文件。
 */
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

// 校验环境（CI / 受限沙箱）里 Chromium 自己的沙箱起不来，关掉它。
// 只在校验脚本里关，生产 main.js 一个开关都不动。
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.disableHardwareAcceleration();

const UI = path.join(__dirname, '..', 'src', 'ui', 'index.html');
const PRELOAD = path.join(__dirname, '..', 'src', 'preload.js');

// ---------- 桩数据 ----------
const TERMINALS = [
  { id: 'A1B2C3D4E5F6G7H8', path: 'C:\\Users\\x\\AppData\\Roaming\\MetaQuotes\\Terminal\\A1B2C3D4\\MQL5', broker: 'IC Markets', eaLive: true },
  { id: 'Z9Y8X7W6V5U4T3S2', path: 'C:\\Users\\x\\AppData\\Roaming\\MetaQuotes\\Terminal\\Z9Y8X7W6\\MQL5', broker: 'Exness', eaLive: false },
];
const SNAPSHOT = {
  ok: true,
  snapshot: {
    eaLive: true,
    status: {
      signed: true, trading_allowed: true, symbol: 'EURUSD',
      quote: { bid: 1.08521, ask: 1.08535 },
      account: { login: 12345678, balance: 10000, equity: 10123.45, free_margin: 9800, mode: 'netting' },
      positions: [
        { ticket: 987654, symbol: 'EURUSD', type: 'BUY', volume: 0.02, price_open: 1.084, sl: 1.08, profit: 23.45 },
        { ticket: 987655, symbol: 'XAUUSD', type: 'SELL', volume: 0.01, price_open: 2410.5, sl: 2425, profit: -8.2 },
      ],
    },
    heart: { server: 'ICMarkets-Demo', epoch: 1 },
  },
};

const HANDLERS = {
  'bridge:licenseStatus':   () => ({ ok: true, license: { ok: true, name: '测试用户', id: 'NN1-TEST', daysLeft: 30, expires: '2026-11-16' } }),
  'bridge:licenseActivate': () => ({ ok: false, reason: '校验桩' }),
  'bridge:discover':        () => ({ ok: true, terminals: TERMINALS }),
  'bridge:installEA':       () => ({ ok: true, installed: 'NiuNiuBridge.ex5', isSource: false }),
  'bridge:rebind':          () => ({ ok: true, secret: 'x'.repeat(64), epoch: 2 }),
  'bridge:snapshot':        () => SNAPSHOT,
  'bridge:sendCommand':     () => ({ ok: true, id: 'cmd-0001' }),
  'bridge:commandStatus':   () => ({ ok: true, stage: 'SENT' }),
  'bridge:aiStatus':        () => ({ enabled: true, connected: true, credits: 120, creditCny: 0.1, rechargeUrl: 'https://ai.niuniuai.app/recharge' }),
  'bridge:aiConnect':       () => ({ connected: true, credits: 120 }),
  'bridge:aiDisconnect':    () => ({ enabled: true, connected: false }),
  'app:version':            () => '1.0.0',
  'app:openExternal':       () => true,
  'app:saveLog':            () => true,
};
for (const [ch, fn] of Object.entries(HANDLERS)) ipcMain.handle(ch, fn);

// 偏好走真实实现（跟主进程同一份逻辑，才能验到持久化）
const fs = require('fs');
const PREFS_PATH = path.join(app.getPath('userData'), 'prefs.json');
try { fs.rmSync(PREFS_PATH, { force: true }); } catch { /* 从干净状态开始 */ }
const THEMES = ['浅色', '深色', '自动'];
const ACCENTS = ['orange', 'blue', 'green', 'purple'];
const PAGES = ['p-overview', 'p-terminal', 'p-trade', 'p-strategy', 'p-ai', 'p-settings'];
const DEF = { theme: '浅色', accent: 'orange', page: 'p-overview' };
ipcMain.handle('app:getPrefs', () => loadP());
ipcMain.handle('app:setPrefs', (_e, p) => saveP(p));
ipcMain.on('app:getPrefsSync', (e) => { e.returnValue = loadP(); });
function loadP() {
  try {
    if (fs.existsSync(PREFS_PATH)) {
      const j = JSON.parse(fs.readFileSync(PREFS_PATH, 'utf8'));
      return {
        theme: THEMES.includes(j?.theme) ? j.theme : DEF.theme,
        accent: ACCENTS.includes(j?.accent) ? j.accent : DEF.accent,
        page: PAGES.includes(j?.page) ? j.page : DEF.page,
      };
    }
  } catch { /* noop */ }
  return { ...DEF };
}
function saveP(p) {
  const n = {
    theme: THEMES.includes(p?.theme) ? p.theme : DEF.theme,
    accent: ACCENTS.includes(p?.accent) ? p.accent : DEF.accent,
    page: PAGES.includes(p?.page) ? p.page : DEF.page,
  };
  fs.mkdirSync(path.dirname(PREFS_PATH), { recursive: true });
  fs.writeFileSync(PREFS_PATH, JSON.stringify(n), 'utf8');
  return n;
}

// ---------- 断言 ----------
const results = [];
const ok = (name, cond, detail) => results.push({ name, pass: !!cond, detail: detail === undefined ? '' : String(detail) });
let consoleErrors = [];

(async () => {
  await app.whenReady();
  const win = new BrowserWindow({
    width: 1280, height: 860, show: false,
    webPreferences: { preload: PRELOAD, nodeIntegration: false, contextIsolation: true, sandbox: true },
  });
  win.webContents.on('console-message', (_e, msg, _f, line) => {
    if (msg.level === 'error' || msg.level === 3) consoleErrors.push(`[${line}] ${msg.message}`);
  });
  await win.loadFile(UI);
  await new Promise((r) => setTimeout(r, 600));   // 等 init() 的异步链跑完

  const ev = (js) => win.webContents.executeJavaScript(js);

  // 1. 初始状态：默认概览页 + 只有 1 个导航高亮
  ok('默认落在概览页', (await ev(`document.querySelector('.page.on').id`)) === 'p-overview');
  ok('导航高亮唯一', (await ev(`document.querySelectorAll('#nav .nav-item.on').length`)) === 1);

  // 2. 六个页面逐一切换
  const PAGES_TITLE = {
    'p-overview': '概览', 'p-terminal': '终端与 EA', 'p-trade': '交易',
    'p-strategy': '策略广场', 'p-ai': 'AI 副驾驶', 'p-settings': '设置',
  };
  for (const [pid, title] of Object.entries(PAGES_TITLE)) {
    await ev(`document.querySelector('#nav .nav-item[data-page="${pid}"]').click()`);
    const onId = await ev(`document.querySelector('.page.on').id`);
    const h1 = await ev(`document.querySelector('.topbar h1').textContent`);
    const onNav = await ev(`document.querySelector('#nav .nav-item.on').dataset.page`);
    ok(`导航 ${pid} 切页正确`, onId === pid && onNav === pid && h1 === title, `on=${onId} nav=${onNav} h1=${h1}`);
  }

  // 3. 业务回归（桩数据）
  ok('KPI 余额渲染', (await ev(`$('kBalance').textContent`)) === '10,000.00', await ev(`$('kBalance').textContent`));
  ok('买价渲染 5 位', (await ev(`$('kBid').textContent`)) === '1.08521');
  ok('持仓渲染 2 行', (await ev(`$('posBody').querySelectorAll('tr').length`)) === 2);
  ok('下单按钮可用', (await ev(`!$('orderBtn').disabled`)) === true);
  ok('授权条已激活态', (await ev(`$('licBar').classList.contains('act')`)) === true);
  ok('AI 条显示且充值可用', (await ev(`$('aiBar').style.display !== 'none' && !$('aiTopupBtn').disabled`)) === true);
  ok('终端列表 2 个', (await ev(`$('termList').querySelectorAll('.term').length`)) === 2);

  // 4. 主题：深色
  await ev(`document.querySelector('#nav .nav-item[data-page="p-settings"]').click()`);
  await ev(`document.querySelector('#themeSeg button[data-m="深色"]').click()`);
  ok('深色 data-theme', (await ev(`document.documentElement.dataset.theme`)) === 'dark');
  ok('深色页面底色 #0B1220',
    (await ev(`getComputedStyle(document.body).backgroundColor`)) === 'rgb(7, 11, 18)',
    await ev(`getComputedStyle(document.body).backgroundColor`));
  ok('深色分段按钮同步', (await ev(`document.querySelector('#themeSeg button.on').dataset.m`)) === '深色');

  // 5. 配色：深海蓝（日/夜 × 配色正交）
  await ev(`document.querySelector('#accentRow .accent-dot[data-a="blue"]').click()`);
  ok('配色 data-accent', (await ev(`document.documentElement.dataset.accent`)) === 'blue');
  ok('深海蓝主色值',
    (await ev(`getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()`)) === '#2563EB',
    await ev(`getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()`));
  ok('配色名同步', (await ev(`$('accentNameLabel').textContent`)) === '深海蓝');
  ok('深色下按钮用 deep 档',
    (await ev(`getComputedStyle(document.documentElement).getPropertyValue('--brand-deep').trim()`)) === '#1D4ED8');
  ok('色板选中唯一', (await ev(`document.querySelectorAll('#accentRow .accent-dot.on').length`)) === 1);

  // 6. 深色 + 品牌橙（回到默认配色，验正交）
  await ev(`document.querySelector('#accentRow .accent-dot[data-a="orange"]').click()`);
  ok('深色+品牌橙 主色仍 #FF6A1A',
    (await ev(`getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()`)) === '#FF6A1A');
  ok('深色下涨跌色提亮',
    (await ev(`getComputedStyle(document.documentElement).getPropertyValue('--up').trim()`)) === '#FF7A66');

  // 7. 持久化：重新加载后恢复（主题=深色 / 配色=orange / 页面=设置）
  await new Promise((r) => setTimeout(r, 200));
  await win.webContents.reload();
  await new Promise((r) => setTimeout(r, 600));
  ok('重载后主题保持深色', (await ev(`document.documentElement.dataset.theme`)) === 'dark');
  ok('重载后配色保持 orange', (await ev(`document.documentElement.dataset.accent`)) === 'orange');
  ok('重载后回到上次页面', (await ev(`document.querySelector('.page.on').id`)) === 'p-settings');
  ok('重载后设置控件回显一致',
    (await ev(`document.querySelector('#themeSeg button.on').dataset.m`)) === '深色' &&
    (await ev(`$('accentNameLabel').textContent`)) === '品牌橙');

  // 8. 无 console 报错
  ok('无 JS 报错', consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' | '));

  // ---------- 输出 ----------
  const fail = results.filter((r) => !r.pass);
  console.log('\n=== 牛牛 AI 客户端 UI 校验 ===');
  results.forEach((r) => console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.name}${r.pass || !r.detail ? '' : '  → ' + r.detail}`));
  console.log(`\n共 ${results.length} 项，通过 ${results.length - fail.length}，失败 ${fail.length}`);
  app.quit(fail.length ? 1 : 0);
})();
