/**
 * AI 积分条端到端检查：真起网关（mock 上游）+ 真渲染 src/ui/index.html，
 * 用真实 fetch 打到网关，验证「连接 → 显示余额 → 充值按钮可用」这条链路。
 *
 *   node tools/ai-ui-check.mjs
 * 产物：docs/shots/12-AI积分条.png
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { spawn } from 'child_process';

const WS = '/Users/a1234/.workbuddy/binaries/node/workspace';
const require2 = createRequire(path.join(WS, 'package.json'));
const { chromium } = require2('playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..');
const UI = path.join(ROOT, 'src', 'ui', 'index.html');
const NODE = process.execPath;
const PORT = 18900 + (Date.now() % 400);  // 随机端口，避免孤儿进程占着旧端口
const BASE = 'http://127.0.0.1:' + PORT;

// Chromium 不允许 file:// 页面发跨源请求（Electron 里可以），所以在本地起个静态服务托管 UI
const http = await import('http');
const fs2 = await import('fs');
const UI_DIR = path.join(ROOT, 'src', 'ui');
const UI_PORT = PORT + 1;
// /gw/* 同源反代到网关：绕开 Chromium 对跨源的限制，让测试只验证 UI 逻辑本身
const uiSrv = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname.startsWith('/gw/')) {
    const proxy = http.request(
      { host: '127.0.0.1', port: PORT, path: u.pathname.slice(3) + u.search, method: req.method, headers: req.headers },
      (pr) => { res.writeHead(pr.statusCode || 502, pr.headers); pr.pipe(res); });
    req.pipe(proxy);
    return;
  }
  const f = path.join(UI_DIR, (u.pathname || '/index.html').replace(/^\//, '') || 'index.html');
  fs2.readFile(f, (e, d) => {
    if (e) { res.writeHead(404); res.end('nf'); return; }
    res.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : 'text/html' });
    res.end(d);
  });
});
await new Promise((r) => uiSrv.listen(UI_PORT, r));

const srv = spawn(NODE, [path.join(ROOT, 'ai-gateway', 'src', 'server.js')], {
  env: {
    ...process.env,
    PORT: String(PORT),
    SERVER_SECRET: 'uitest-secret-0123456789',
    ADMIN_SECRET: 'uitest-admin',
    UPSTREAM_MOCK: '1',
    DATA_DIR: path.join(ROOT, '.build', 'ai-ui-data'),
    RECHARGE_URL: 'https://niuniuai.app/credits',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});
srv.stdout.on('data', (d) => process.stdout.write('[gw] ' + d));
srv.stderr.on('data', (d) => process.stderr.write('[gw!] ' + d));

const waitUp = async () => {
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(BASE + '/healthz'); if (r.ok) return true; } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('网关没起来');
};

// 客户端侧的 window.nn 实现（与 src/main.js 的 aiStatus/aiConnect 行为一致）
const MOCK = (base, token) => `
window.nn = {
  version: async () => '1.0.0',
  licenseStatus: async () => ({ ok:true, license:{ ok:true, id:'NN-2026-0001', name:'示例客户', expires:'2026-10-31', daysLeft:15, seats:1 } }),
  licenseActivate: async () => ({ ok:true }),
  discover: async () => ({ ok:true, terminals: [] }),
  installEA: async () => ({ ok:true }),
  rebind: async () => ({ ok:true }),
  snapshot: async () => ({ ok:true, snapshot:{ eaLive:false } }),
  sendCommand: async () => ({ ok:true, id:'x' }),
  commandStatus: async () => ({ ok:true, stage:'SENT' }),
  aiStatus: async () => {
    const t = window.__tok;
    if (!t) return { enabled:true, connected:false, error:'未连接 AI 服务（不影响交易功能）' };
    const r = await fetch('${base}/v1/credits', { headers:{ authorization:'Bearer '+t } });
    const j = await r.json().catch(()=>({}));
    if (r.ok && j.ok) return { enabled:true, connected:true, credits:j.credits, creditCny:j.creditCny, rechargeUrl:j.rechargeUrl };
    return { enabled:true, connected:false, error: j.error || ('AI 服务返回 '+r.status) };
  },
  aiConnect: async (tok) => { window.__tok = String(tok||'').trim(); return window.nn.aiStatus(); },
  aiDisconnect: async () => { window.__tok=''; return window.nn.aiStatus(); },
  openExternal: async () => true,
  saveLog: async () => true,
  onEvent: () => () => {},
};
window.__tok = ${JSON.stringify(token || '')};
`;

let fail = 0;
const check = (name, cond, extra = '') => {
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond ? '' : ' — ' + extra));
  if (!cond) fail++;
};

try {
  await waitUp();
  console.log('== AI 积分条端到端 ==');

  // 开户 + 充值
  const mint = await fetch(BASE + '/v1/admin/token', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-secret': 'uitest-admin' },
    body: JSON.stringify({ userId: 'u1', days: 30 }),
  });
  const raw = await mint.text();
  if (mint.status !== 200) throw new Error(`开户失败 ${mint.status}: ${raw.slice(0, 200)}`);
  const { token } = JSON.parse(raw);
  await fetch(BASE + '/v1/admin/topup', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-admin-secret': 'uitest-admin' },
    body: JSON.stringify({ userId: 'u1', credits: 287, note: 'UI 检查' }),
  });
  console.log('  已开户并充值 287 积分');

  const CAND = [
    '/Users/a1234/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].find((p) => fs.existsSync(p));
  // 沙箱里 Chromium 会继承 HTTP_PROXY，把 127.0.0.1 也走代理 → 本地网关请求被拦成 404
  const browser = await chromium.launch({
    executablePath: CAND,
    args: ['--no-proxy-server', '--proxy-bypass-list=*'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });

  // 1) 未连接：应显示输入框，不显示充值按钮
  await page.addInitScript(MOCK(`http://127.0.0.1:${UI_PORT}/gw`, ''));
  await page.goto(`http://127.0.0.1:${UI_PORT}/index.html`);
  await page.waitForTimeout(1200);
  let vis = await page.locator('#aiBar').isVisible();
  check('未连接时 AI 条可见', vis);
  const txt0 = await page.locator('#aiText').textContent();
  check('未连接提示正确', /未连接 AI 服务/.test(txt0), txt0);
  check('未连接时不显示充值按钮', !(await page.locator('#aiTopupBtn').isVisible()));

  // 2) 连上真网关
  await page.fill('#aiToken', token);
  await page.click('#aiBtn');
  await page.waitForTimeout(1500);
  const txt1 = await page.locator('#aiText').textContent();
  check('连接后显示真实余额', /余额 287 积分/.test(txt1), txt1);
  check('连接后显示充值按钮', await page.locator('#aiTopupBtn').isVisible());
  check('充值按钮可用', !(await page.locator('#aiTopupBtn').isDisabled()));

  // 3) 真调一次 /v1/chat，验证扣费与退款逻辑在真实 HTTP 下也对
  const before = await (await fetch(BASE + '/v1/credits', { headers: { authorization: 'Bearer ' + token } })).json();
  const chat = await fetch(BASE + '/v1/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: 'Bearer ' + token },
    body: JSON.stringify({ tier: 'fast', messages: [{ role: 'user', content: '我现在持仓怎么样' }] }),
  });
  const cj = await chat.json();
  check('HTTP 下单成功并扣 1 分', chat.status === 200 && cj.charged === 1 && cj.balance === before.credits - 1,
    JSON.stringify(cj));
  const after = await (await fetch(BASE + '/v1/credits', { headers: { authorization: 'Bearer ' + token } })).json();
  check('余额已同步扣减', after.credits === 286, String(after.credits));

  // 4) 断开
  await page.click('#aiOffBtn');
  await page.waitForTimeout(900);
  check('断开后回到未连接态', /未连接 AI 服务/.test(await page.locator('#aiText').textContent()));

  // 出一张图，给教程用
  await page.fill('#aiToken', token);
  await page.click('#aiBtn');
  await page.waitForTimeout(1500);
  const out = path.join(ROOT, 'docs', 'shots', '12-AI积分条.png');
  await page.locator('#aiBar').screenshot({ path: out });
  console.log('  出图 → ' + out);

  await browser.close();
} catch (e) {
  console.error('✗ ' + e.message);
  fail++;
} finally {
  srv.kill();
  try { uiSrv.close(); } catch { /* noop */ }
}
for (const sig of ['exit', 'SIGINT', 'SIGTERM']) {
  process.on(sig, () => { try { srv.kill(); } catch { /* noop */ } });
}

console.log(fail ? `\n失败 ${fail} 项` : '\n全部通过');
process.exit(fail ? 1 : 0);
