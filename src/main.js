'use strict';
/**
 * 牛牛 AI · Electron 主进程
 *
 * 安全边界（三层，都做，不是二选一）：
 *   渲染进程  → nodeIntegration:false + contextIsolation:true + sandbox:true
 *   主进程    → 参数校验、来源校验、生命周期管理
 *   桥进程    → utilityProcess，持有密钥与文件 IPC；渲染进程零直接访问
 *
 * 桥不暴露 localhost HTTP：本机任何进程和浏览器都能打本地端口，没必要增加这个面。
 * 这里用 utilityProcess 的 stdio JSON-lines。
 */
const { app, BrowserWindow, ipcMain, dialog, shell, nativeTheme } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const license = require('./license');

const isDev = !app.isPackaged;
let win = null;
let bridge = null;
let seq = 0;
const pending = new Map();

// ---------- 授权 ----------
// 离线校验：软件里只埋公钥，客户造不出密钥。
// 未激活 = 不能下单（但能装 EA、能看行情，方便排查环境问题）。
const LICENSE_PATH = path.join(app.getPath('userData'), 'license.json');
let licenseState = { ok: false, reason: '未激活' };

function loadLicense() {
  try {
    if (fs.existsSync(LICENSE_PATH)) {
      const j = JSON.parse(fs.readFileSync(LICENSE_PATH, 'utf8'));
      if (j && j.key) licenseState = license.verify(j.key);
    }
  } catch (e) {
    licenseState = { ok: false, reason: '授权文件损坏：' + e.message };
  }
}
function activateLicense(key) {
  const r = license.verify(key);
  if (!r.ok) { licenseState = r; return r; }
  fs.mkdirSync(path.dirname(LICENSE_PATH), { recursive: true });
  fs.writeFileSync(LICENSE_PATH, JSON.stringify({ key, activated_at: new Date().toISOString(), info: r }), 'utf8');
  licenseState = r;
  return r;
}
loadLicense();

// ---------- 安装期随机密钥（每实例不同，绝不硬编码共享密钥） ----------
// 同时持久化 epoch（绑定代次）：重启后必须沿用，否则与 EA 侧 secret.json 不一致 → 全部拒单
const SECRET_PATH = path.join(app.getPath('userData'), 'bridge-secret.json');
function loadOrCreateSecret() {
  try {
    if (fs.existsSync(SECRET_PATH)) {
      const j = JSON.parse(fs.readFileSync(SECRET_PATH, 'utf8'));
      if (j && typeof j.secret === 'string' && j.secret) {
        return { secret: j.secret, epoch: Number(j.epoch) || 1 };
      }
    }
  } catch { /* 继续生成 */ }
  const s = { secret: crypto.randomBytes(32).toString('hex'), epoch: 1 };
  fs.mkdirSync(path.dirname(SECRET_PATH), { recursive: true });
  fs.writeFileSync(SECRET_PATH, JSON.stringify(s), { mode: 0o600 });
  return s;
}
function persistSecret(s) {
  fs.mkdirSync(path.dirname(SECRET_PATH), { recursive: true });
  fs.writeFileSync(SECRET_PATH, JSON.stringify(s), { mode: 0o600 });
}

// ---------- AI 网关（积分） ----------
// 模型 Key 只在服务端，客户端只持有一枚「用户令牌」。
// 没配服务地址 / 没连上时，界面整条不显示 —— 与其放个点了没反应的按钮，不如不放。
const AI_URL = (process.env.NN_AI_URL || 'https://ai.niuniuai.app').replace(/\/$/, '');
const AI_PATH = path.join(app.getPath('userData'), 'ai.json');
const AI_ENABLED = /^https:\/\//.test(AI_URL);          // 只允许 https
let aiState = { enabled: AI_ENABLED, connected: false, credits: null, rechargeUrl: null, error: null };

function loadAIToken() {
  try {
    if (fs.existsSync(AI_PATH)) {
      const j = JSON.parse(fs.readFileSync(AI_PATH, 'utf8'));
      aiState.token = String(j?.token || '');
    }
  } catch { /* 令牌损坏就当没连 */ }
}
async function refreshAI() {
  const base = { enabled: AI_ENABLED, connected: false, credits: null, rechargeUrl: null, error: null };
  aiState = { ...base, token: aiState.token };
  if (!AI_ENABLED) { aiState.error = '未配置 AI 服务地址'; return aiState; }
  if (!aiState.token) return aiState;
  try {
    const r = await fetch(AI_URL + '/v1/credits', {
      headers: { authorization: 'Bearer ' + aiState.token },
      signal: AbortSignal.timeout(8000),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok && j.ok) {
      aiState.connected = true;
      aiState.credits = j.credits ?? 0;
      aiState.creditCny = j.creditCny ?? 0.1;
      aiState.rechargeUrl = /^https:\/\//.test(String(j.rechargeUrl || '')) ? j.rechargeUrl : null;
    } else {
      aiState.error = j.error || ('AI 服务返回 ' + r.status);
    }
  } catch (e) {
    aiState.error = '连不上 AI 服务：' + e.message;
  }
  return aiState;
}
async function connectAI(token) {
  aiState.token = String(token || '').trim();
  const r = await refreshAI();
  if (r.connected) {
    fs.mkdirSync(path.dirname(AI_PATH), { recursive: true });
    fs.writeFileSync(AI_PATH, JSON.stringify({ token: aiState.token, at: new Date().toISOString() }), 'utf8');
  } else {
    try { fs.rmSync(AI_PATH, { force: true }); } catch { /* noop */ }
  }
  return r;
}
function disconnectAI() {
  aiState.token = '';
  try { fs.rmSync(AI_PATH, { force: true }); } catch { /* noop */ }
  return refreshAI();
}
loadAIToken();

// ---------- 界面偏好（主题 / 配色 / 上次所在页） ----------
// 只存三个白名单字符串，不碰密钥、不碰授权、不碰任何业务状态。
const PREFS_PATH = path.join(app.getPath('userData'), 'prefs.json');
const THEMES = ['浅色', '深色', '自动'];
const ACCENTS = ['orange', 'blue', 'green', 'purple'];
const PAGES = ['p-overview', 'p-terminal', 'p-trade', 'p-strategy', 'p-ai', 'p-settings'];
const DEFAULT_PREFS = { theme: '浅色', accent: 'orange', page: 'p-overview' };

function loadPrefs() {
  try {
    if (fs.existsSync(PREFS_PATH)) {
      const j = JSON.parse(fs.readFileSync(PREFS_PATH, 'utf8'));
      return {
        theme:  THEMES.includes(j?.theme) ? j.theme : DEFAULT_PREFS.theme,
        accent: ACCENTS.includes(j?.accent) ? j.accent : DEFAULT_PREFS.accent,
        page:   PAGES.includes(j?.page) ? j.page : DEFAULT_PREFS.page,
      };
    }
  } catch { /* 文件损坏就用默认，偏好不是关键状态 */ }
  return { ...DEFAULT_PREFS };
}
function savePrefs(p) {
  const next = {
    theme:  THEMES.includes(p?.theme) ? p.theme : DEFAULT_PREFS.theme,
    accent: ACCENTS.includes(p?.accent) ? p.accent : DEFAULT_PREFS.accent,
    page:   PAGES.includes(p?.page) ? p.page : DEFAULT_PREFS.page,
  };
  try {
    fs.mkdirSync(path.dirname(PREFS_PATH), { recursive: true });
    fs.writeFileSync(PREFS_PATH, JSON.stringify(next), 'utf8');
  } catch { /* 写不进去也不影响交易功能 */ }
  return next;
}

// ---------- 全局停用闸门（真闸门，不是界面开关） ----------
// 历史 bug：渲染层的「一键停用」只改了一个 DOM 变量，主进程与 EA 完全不知道，
// 于是出现了「界面显示已停用、命令照样发出去」的假安全感。
// 闸门必须落在主进程：渲染进程改不动它，绕过 UI 直接调 IPC 也过不去。
// 持久化：用户按下停用是一次明确意图，重启后应保持停用，而不是悄悄恢复。
const HALT_PATH = path.join(app.getPath('userData'), 'halt.json');
let halted = false;

function loadHalt() {
  try {
    if (fs.existsSync(HALT_PATH)) {
      halted = JSON.parse(fs.readFileSync(HALT_PATH, 'utf8')).halted === true;
    }
  } catch { halted = false; }
}
function setHalt(next) {
  halted = next === true;
  try {
    fs.mkdirSync(path.dirname(HALT_PATH), { recursive: true });
    fs.writeFileSync(HALT_PATH, JSON.stringify({ halted, at: new Date().toISOString() }), 'utf8');
  } catch { /* 写不进去也不影响：内存里的闸门已经生效 */ }
  return halted;
}
loadHalt();

// ---------- 桥进程 ----------
// ⚠ 这里刻意用 child_process.fork 而不是 utilityProcess.fork。
// 实测 Electron 33：utilityProcess.fork 的 stdio[0] 只接受 'ignore'，
// 传 'pipe' 直接抛 "stdin value other than ignore is not supported" ——
// 也就是说桥进程根本起不来，整条交易链是死的（UI 会因为拿不到心跳而显示离线）。
// 桥是纯 Node 脚本、不监听任何端口，用 child_process.fork 不削弱任何安全边界：
// 渲染进程依旧零直接访问，密钥依旧只在主进程与桥进程之间流转。
function startBridge() {
  const { spawn } = require('child_process');
  const env = { ...process.env };
  env.ELECTRON_RUN_AS_NODE = '1';       // 用 Electron 二进制跑纯 Node 脚本必须显式置位
  bridge = spawn(process.execPath, [path.join(__dirname, 'bridge', 'index.js')], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
  });

  let buf = '';
  bridge.stdout.on('data', (c) => {
    buf += c.toString('utf8');
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      let msg;
      try { msg = JSON.parse(line); } catch { continue; }

      if (msg.id && pending.has(msg.id)) {
        const { resolve } = pending.get(msg.id);
        pending.delete(msg.id);
        resolve(msg);
      } else {
        // 无请求 id = 桥主动推送（回执等）
        if (win && !win.isDestroyed()) win.webContents.send('bridge:event', msg);
      }
    }
  });
  bridge.stderr.on('data', (c) => process.stderr.write(`[bridge] ${c}`));
  bridge.on('exit', (code) => {
    console.error('[main] bridge exited', code);
    bridge = null;
  });
  bridge.on('error', (e) => {
    console.error('[main] bridge 启动失败:', e.message);
    bridge = null;
  });

  call('setSecret', loadOrCreateSecret());
}

function call(method, params = {}) {
  return new Promise((resolve, reject) => {
    if (!bridge) return reject(new Error('桥进程未启动'));
    const id = ++seq;
    pending.set(id, { resolve, reject });
    bridge.stdin.write(JSON.stringify({ id, method, params }) + '\n');
    setTimeout(() => {
      if (pending.has(id)) { pending.delete(id); reject(new Error('桥响应超时')); }
    }, 15000);
  });
}

// ---------- IPC 白名单（只暴露业务方法，不暴露任意路径/任意命令） ----------
const ALLOWED = {
  licenseStatus: () => ({ ok: true, license: licenseState }),
  licenseActivate: (p) => activateLicense(String(p?.key || '')),
  discover:      () => call('discover'),
  installEA:     (p) => call('installEA', { terminalPath: String(p?.terminalPath || '') }),
  // 重新绑定：换账户 / 重新授权后调用。会换密钥 + epoch 自增，旧命令全部作废。
  // 密钥在这里生成后下发给桥，桥只写文件、不再回传 —— 密钥永不流向渲染进程。
  rebind: async (p) => {
    const cur = loadOrCreateSecret();
    const next = {
      secret: crypto.randomBytes(32).toString('hex'),
      epoch: (Number(cur.epoch) || 1) + 1,
    };
    const r = await call('rebind', {
      terminalPath: String(p?.terminalPath || ''),
      secret: next.secret,
      epoch: next.epoch,
    });
    if (r && r.ok) {
      persistSecret(next);
      await call('setSecret', next);          // 让桥进程也换成新代次的密钥
      return { ok: true, epoch: next.epoch }; // 只回 epoch
    }
    return r;
  },
  setHalt: (p) => ({ ok: true, halted: setHalt(p?.halted === true) }),
  haltStatus: () => ({ ok: true, halted }),
  snapshot:      (p) => call('snapshot', { terminalPath: String(p?.terminalPath || '') }),
  sendCommand:   (p) => call('sendCommand', sanitizeCommand(p)),
  commandStatus: (p) => call('commandStatus', { commandId: String(p?.commandId || '') }),
  aiStatus:      () => refreshAI(),
  aiConnect:     (p) => connectAI(String(p?.token || '')),
  aiDisconnect:  () => disconnectAI(),
};

/**
 * 主进程侧二次校验。桌面端校验通过不能替代 EA 校验，但可以拦掉明显错误的请求。
 */
function sanitizeCommand(p) {
  // 授权闸门：未激活一律不放行交易命令。
  // 放在主进程而不是渲染进程 —— 渲染层改不动它。
  if (!licenseState.ok) throw new Error('未授权：请先输入授权密钥后再交易');

  const type = String(p?.type || '');
  const allowedTypes = ['ORDER_MARKET', 'ORDER_PENDING', 'ORDER_CANCEL',
                        'ORDER_MODIFY', 'POSITION_CLOSE', 'POSITION_MODIFY', 'SYNC_STATE'];
  if (!allowedTypes.includes(type)) throw new Error(`不允许的操作类型: ${type}`);

  // 全局停用闸门：只拦会改变敞口的操作。
  // SYNC_STATE 是对账用的只读命令，停用期间必须还能刷新，否则用户看不到真实持仓。
  if (halted && type !== 'SYNC_STATE') {
    throw new Error('已全局停用：不接受新的交易指令（已发出的命令仍会完成）');
  }

  const terminalPath = String(p?.terminalPath || '');
  if (!terminalPath.includes('MetaQuotes')) throw new Error('terminalPath 非法');

  const payload = p?.payload || {};
  if (payload.volume_lots !== undefined) {
    const v = Number(payload.volume_lots);
    if (!Number.isFinite(v) || v <= 0 || v > 1000) throw new Error('手数非法');
  }
  return {
    terminalPath,
    type,
    payload,
    account: p.account ?? '',
    accountServer: p.accountServer ?? '',
    // ⚠ epoch 不能默认成 1。rebind 之后真实代次 ≥2，写死 1 会让 EA 侧判
    // 「绑定代次已失效」从而拒掉每一条命令（表现为下单永远失败）。
    // 渲染层不传就留空，由桥进程填自己的当前代次。
    epoch: Number.isFinite(Number(p.epoch)) && Number(p.epoch) >= 1 ? Number(p.epoch) : undefined,
    ttlMs: Number(p.ttlMs ?? 30000),
  };
}

for (const [name, fn] of Object.entries(ALLOWED)) {
  ipcMain.handle(`bridge:${name}`, async (_e, params) => {
    try { return await fn(params); }
    catch (e) { return { ok: false, error: e.message }; }
  });
}

ipcMain.handle('app:version', () => app.getVersion());
// 界面偏好：只收三个白名单值，越界一律回落默认，不落任意内容到磁盘
ipcMain.handle('app:getPrefs', () => loadPrefs());
ipcMain.handle('app:setPrefs', (_e, p) => savePrefs(p));
// 同步读取一次：让主题在首帧之前就生效，否则深色用户启动会闪一下白屏。
// 只读三个白名单字符串，不接收参数，不构成新的攻击面。
ipcMain.on('app:getPrefsSync', (e) => { e.returnValue = loadPrefs(); });
ipcMain.handle('app:openExternal', async (_e, url) => {
  const u = String(url || '');
  if (!/^https:\/\//.test(u)) return false;      // 只允许 https
  await shell.openExternal(u);
  return true;
});
ipcMain.handle('app:saveLog', async (_e, text) => {
  const r = await dialog.showSaveDialog(win, {
    title: '导出日志', defaultPath: 'niuniu-ai-log.txt',
    filters: [{ name: 'Text', extensions: ['txt'] }],
  });
  if (r.canceled) return false;
  fs.writeFileSync(r.filePath, String(text || ''), 'utf8');
  return true;
});

// ---------- 窗口 ----------
function createWindow() {
  // 窗口底色跟着主题走，避免深色用户启动瞬间闪一下白屏
  const p = loadPrefs();
  const darkBg = p.theme === '深色' || (p.theme === '自动' && nativeTheme.shouldUseDarkColors);

  win = new BrowserWindow({
    width: 1280, height: 860, minWidth: 1080, minHeight: 700,
    title: '牛牛 AI',
    backgroundColor: darkBg ? '#0B1220' : '#F5F6F8',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));   // 禁止任意新窗口
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) e.preventDefault();                // 禁止外部导航
  });

  win.loadFile(path.join(__dirname, 'ui', 'index.html'));
  if (isDev) win.webContents.openDevTools({ mode: 'detach' });
}

app.whenReady().then(() => { startBridge(); createWindow(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { try { bridge && bridge.kill(); } catch { /* noop */ } });
