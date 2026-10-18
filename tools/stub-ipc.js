'use strict';
/** 给校验 / 截图用的桥桩数据 + IPC 注册（不连真 MT5、不碰真授权文件）。 */
const fs = require('fs');
const path = require('path');

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

const THEMES = ['浅色', '深色', '自动'];
const ACCENTS = ['orange', 'blue', 'green', 'purple'];
const PAGES = ['p-overview', 'p-terminal', 'p-trade', 'p-strategy', 'p-ai', 'p-settings'];
const DEFAULT_PREFS = { theme: '浅色', accent: 'orange', page: 'p-overview' };

function normalize(p) {
  return {
    theme: THEMES.includes(p?.theme) ? p.theme : DEFAULT_PREFS.theme,
    accent: ACCENTS.includes(p?.accent) ? p.accent : DEFAULT_PREFS.accent,
    page: PAGES.includes(p?.page) ? p.page : DEFAULT_PREFS.page,
  };
}

/**
 * 注册全部桩 IPC。偏好用真实文件读写（复用与主进程一致的归一化逻辑），
 * 这样截图/校验跑出来的就是用户在真客户端里会看到的那一套。
 */
function register(ipcMain, userDataPath) {
  const PREFS_PATH = path.join(userDataPath, 'prefs.json');

  const HANDLERS = {
    'bridge:licenseStatus':   () => ({ ok: true, license: { ok: true, name: '测试用户', id: 'NN1-TEST', daysLeft: 30, expires: '2026-11-16' } }),
    'bridge:licenseActivate': () => ({ ok: false, reason: '桩：预览不校验授权' }),
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

  const load = () => {
    try {
      if (fs.existsSync(PREFS_PATH)) return normalize(JSON.parse(fs.readFileSync(PREFS_PATH, 'utf8')));
    } catch { /* 文件坏了就用默认 */ }
    return { ...DEFAULT_PREFS };
  };
  const save = (p) => {
    const n = normalize(p);
    fs.mkdirSync(path.dirname(PREFS_PATH), { recursive: true });
    fs.writeFileSync(PREFS_PATH, JSON.stringify(n), 'utf8');
    return n;
  };
  ipcMain.handle('app:getPrefs', () => load());
  ipcMain.handle('app:setPrefs', (_e, p) => save(p));
  ipcMain.on('app:getPrefsSync', (e) => { e.returnValue = load(); });

  return { PREFS_PATH, reset: () => { try { fs.rmSync(PREFS_PATH, { force: true }); } catch { /* noop */ } }, save };
}

module.exports = { TERMINALS, SNAPSHOT, register, normalize, DEFAULT_PREFS };
