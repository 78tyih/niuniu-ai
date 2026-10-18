/**
 * 出真实界面截图 —— 把 src/ui/index.html 渲染出来，注入 window.nn 桩实现。
 *
 *   NODE_PATH=/Users/a1234/.workbuddy/binaries/node/workspace/node_modules \
 *     node tools/shots.mjs
 *
 * 产物：docs/shots/*.png
 *
 * 注意：page.reload() 会重跑 addInitScript，把 __nn 重置回桩的默认值；
 * 所以每个状态都要「goto → setMock → 点重新扫描」走一遍完整启动时序。
 */
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';

// ESM 不认 NODE_PATH，必须显式指向托管 workspace 里的 playwright
const WS = '/Users/a1234/.workbuddy/binaries/node/workspace';
const require = createRequire(path.join(WS, 'package.json'));
const { chromium } = require('playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const UI = path.join(HERE, '..', 'src', 'ui', 'index.html');
const OUT = path.join(HERE, '..', 'docs', 'shots');
fs.mkdirSync(OUT, { recursive: true });

const VW = 1920, VH = 1080;

const MOCK = `
window.__nn = {
  license: { ok:false, reason:'未激活' },
  terminals: [],
  snapshot: { eaLive:false },
  started:false,
};
window.nn = {
  version: async () => '1.0.0',
  licenseStatus: async () => ({ ok:true, license: window.__nn.license }),
  licenseActivate: async (k) => {
    if (String(k||'').startsWith('NN1-')) {
      window.__nn.license = { ok:true, id:'NN-2026-0001', name:'示例客户', expires:'2027-10-16', daysLeft:366, seats:1 };
      return window.__nn.license;
    }
    return { ok:false, reason:'密钥签名无效（不是本产品签发的）' };
  },
  discover: async () => ({ ok:true, terminals: window.__nn.terminals }),
  installEA: async () => ({ ok:true, installed:'...\\\\MQL5\\\\Experts\\\\NiuNiuBridge.ex5', signed:true, epoch:1 }),
  rebind: async () => ({ ok:true, epoch:2 }),
  snapshot: async () => ({ ok:true, snapshot: window.__nn.snapshot }),
  sendCommand: async () => ({ ok:true, id:'0mv9demo0000000000000000001' }),
  commandStatus: async () => ({ ok:true, stage:'EXECUTED', receipt:{ message:'已成交' } }),
  onEvent: () => () => {},
  openExternal: async () => true,
  saveLog: async () => true,
};
`;

const CONNECTED = {
  eaLive: true,
  heart: { seq: 4210, epoch: 1, server: 'MetaQuotes-Demo', account: 81234567, trade_allowed: true, connected: true },
  status: {
    v: 1, time: '2026.10.16 11:20:00', symbol: 'XAUUSD',
    quote: { bid: 4218.35, ask: 4218.62, time: 1792039999000 },
    trading_allowed: true, signed: true, epoch: 1,
    account: {
      login: 81234567, balance: 10000.00, equity: 10042.15,
      margin: 320.00, free_margin: 9722.15, currency: 'USD', mode: 'netting',
    },
    positions: [
      { ticket: 8845123, symbol: 'XAUUSD', type: 'BUY', volume: 0.01,
        price_open: 4210.40, sl: 4205.00, tp: 4230.00, profit: 7.95, comment: 'NN1-9f2c7a41' },
      { ticket: 8845199, symbol: 'EURUSD', type: 'SELL', volume: 0.02,
        price_open: 1.08420, sl: 0, tp: 0, profit: -3.10, comment: 'NN1-1b8e0d52' },
    ],
    orders: [],
  },
};

const TERMINALS = [
  { id: 'D0E8209F77C8CF37AD8BF550E51FF075',
    path: 'C:\\Users\\A\\AppData\\Roaming\\MetaQuotes\\Terminal\\D0E8209F77C8CF37AD8BF550E51FF075',
    broker: 'MetaQuotes Software Corp.', eaLive: true },
];

// Playwright 自带的 headless shell 未必装好，按优先级找一个能用的 Chromium
const CANDIDATES = [
  '/Users/a1234/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
];
const EXEC = CANDIDATES.find((p) => fs.existsSync(p));
if (!EXEC) { console.error('找不到可用的 Chromium，先装：npx playwright install chromium'); process.exit(1); }
console.log('浏览器: ' + EXEC);
const browser = await chromium.launch({ executablePath: EXEC });
const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2 });
await page.addInitScript(MOCK);

// 全页
const shot = async (name) => {
  const f = path.join(OUT, name);
  await page.screenshot({ path: f, fullPage: true });
  console.log('  ' + name + '  (' + Math.round(fs.statSync(f).size / 1024) + ' KB)');
};

// 局部：locator.screenshot()，元素自己滚动到位，不受折叠线限制
const shotEl = async (name, sel) => {
  const f = path.join(OUT, name);
  const loc = page.locator(sel).first();
  if (await loc.count() === 0) { console.log('  !! 找不到 ' + sel); return; }
  await loc.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  await loc.screenshot({ path: f });
  console.log('  ' + name + '  (' + Math.round(fs.statSync(f).size / 1024) + ' KB)');
};

const setMock = (license, terminals, snapshot) => page.evaluate(
  ([l, t, s]) => { window.__nn.license = l; window.__nn.terminals = t; window.__nn.snapshot = s; },
  [license, terminals, snapshot]);

// 完整启动时序：加载 → 注入状态 → 刷授权 → 重新扫描（discover + 默认选中 + refresh）
const boot = async (license, terminals, snapshot) => {
  await page.goto('file://' + UI);
  await setMock(license, terminals, snapshot);
  await page.evaluate(() => window.refreshLicense?.());
  await page.click('#rescanBtn');
  await page.waitForTimeout(1300);
};

const OFF = { ok: false, reason: '未激活' };
const ON = { ok: true, id: 'NN-2026-0001', name: '示例客户', expires: '2027-10-16', daysLeft: 366, seats: 1 };

console.log('== 出图 ==');

// 1) 未激活 · 完整界面
await boot(OFF, TERMINALS, CONNECTED);
await shot('01-未授权.png');

// 2) 激活流程（填入密钥后）
await page.fill('#licKey', 'NN1-eyJ2IjoxLCJpIjoiTk4tMjAyNi0wMDAxIn0.demo');
await page.click('#licBtn');
await page.waitForTimeout(700);
await shot('02-已授权.png');

// 3) 已授权 · 完整界面
await setMock(ON, TERMINALS, CONNECTED);
await page.evaluate(() => window.refreshLicense?.());
await page.waitForTimeout(1800);
await shot('03-完整界面.png');

// 4) 授权栏两个状态
await setMock(OFF, TERMINALS, CONNECTED);
await page.evaluate(() => window.refreshLicense?.());
await page.waitForTimeout(600);
await shotEl('04-授权栏-未激活.png', '#licBar');
await setMock(ON, TERMINALS, CONNECTED);
await page.evaluate(() => window.refreshLicense?.());
await page.waitForTimeout(600);
await shotEl('05-授权栏-已激活.png', '#licBar');

// 5) 各卡片
await shotEl('06-终端卡片.png', '.grid > .card:nth-child(1)');
await shotEl('07-账户与行情.png', '.grid > .card:nth-child(2)');
await shotEl('08-持仓卡片.png', '.grid > .card:nth-child(3)');
await shotEl('09-下单卡片.png', '#orderCard');

// 6) 走一次下单，截回执日志
await page.evaluate(() => {
  const b = document.querySelector('#orderBtn');
  if (b && !b.disabled) b.click();
});
await page.waitForTimeout(2600);
await shotEl('10-回执日志.png', '.grid > .card:last-child');
await shot('11-下单后完整界面.png');

await browser.close();
console.log('完成 → ' + OUT);
