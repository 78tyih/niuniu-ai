'use strict';
/**
 * 生态链路校验：只验「能验的那一层」，不假装验了别的层。
 *
 * 分三组：
 *   A 组 · 协议层（纯逻辑，require 真 protocol.js）
 *   B 组 · 桥进程层（真起 src/bridge/index.js 子进程，走 stdio JSON-lines）
 *   C 组 · 主进程层（真 require src/main.js + 真 preload，走真 IPC）
 *
 * 跑法：env -u ELECTRON_RUN_AS_NODE ./node_modules/.bin/electron tools/verify-ecosystem.js
 * 退出码 0 = 全通过，1 = 有失败。
 *
 * 刻意不做的事：不连真 MT5、不动真实 userData（用 mkdtemp 隔离）、不改任何业务代码。
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');

// 校验环境（沙箱）里 Chromium 自己的沙箱起不来，只在校验脚本里关。
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.disableHardwareAcceleration();

const ROOT = path.join(__dirname, '..');
const protocol = require(path.join(ROOT, 'src', 'bridge', 'protocol.js'));

const results = [];
const ok = (name, cond, detail) =>
  results.push({ name, pass: !!cond, detail: detail === undefined ? '' : String(detail) });
// 依赖被 .gitignore 排除的测试数据（test/vectors.json）—— 新克隆的仓库里没有它。
// 那不算失败，算「这一条没法验」，必须显式标出来，不能假装通过。
const skip = (name, why) => results.push({ name, pass: true, skipped: true, detail: why });

// ==================================================================
// A 组 · 协议层
// ==================================================================
function groupA() {
  const SECRET = 'a'.repeat(64);

  // A01 下单命令字段完整
  const c1 = protocol.buildCommand({
    type: 'ORDER_MARKET', account: '12345678', accountServer: 'ICMarkets-Demo', epoch: 3,
    payload: { symbol: 'EURUSD', side: 'BUY', volume_lots: 0.02, sl_points: 400, tp_points: 800, max_deviation_points: 20, tag: 'manual' },
    secret: SECRET,
  });
  ok('A01 下单 payload 字段完整（9 字段）',
    ['symbol', 'side', 'volume_lots', 'sl_points', 'tp_points', 'max_deviation_points', 'ticket', 'comment']
      .every((k) => Object.prototype.hasOwnProperty.call(c1.payload, k)),
    JSON.stringify(Object.keys(c1.payload)));

  // A02 平仓命令的 ticket 必须原样进入 payload（历史上这一字段被静默丢弃）
  const c2 = protocol.buildCommand({
    type: 'POSITION_CLOSE', account: '12345678', accountServer: 'ICMarkets-Demo', epoch: 3,
    payload: { ticket: 987654 }, secret: SECRET,
  });
  ok('A02 平仓 ticket 进入 payload', c2.payload.ticket === 987654, `ticket=${c2.payload.ticket}`);
  ok('A03 平仓 ticket 序列化进 JSON', /"ticket":987654/.test(JSON.stringify(c2)), JSON.stringify(c2.payload));

  // A04 UI 用 tag、EA 读 comment —— 必须归一，不能静默丢失
  ok('A04 tag 归一到 comment', c1.payload.comment === 'manual', `comment="${c1.payload.comment}"`);

  // A05 canonical 仍是 10 段（新增字段不得进签名，否则旧 .ex5 全部拒签）
  const can = protocol.canonical(c1);
  ok('A05 canonical 仍是 10 段', can.split('|').length === 10, can);

  // A06 canonical 不包含 ticket / comment（签名面不扩大）
  ok('A06 canonical 不含新增字段', !can.includes('987654') && !can.includes('manual'), can);

  // A07 签名向量回归：与 test/vectors.json 对拍，确认本次改动没有动签名算法。
  // 这是「加字段会不会让旧 .ex5 全部拒签」的唯一硬证据 —— 不能靠推理。
  const vecPath = path.join(ROOT, 'test', 'vectors.json');
  if (!fs.existsSync(vecPath)) {
    // 该文件含测试用 secret，被 .gitignore 排除。没有它就无法对拍历史签名，
    // 但不能因此判失败 —— 会把「没数据」伪装成「签名错了」。
    skip('A07 签名向量回归（对拍 vectors.json）',
      'test/vectors.json 不存在（已被 .gitignore 排除）。本地生成：node test/gen_vectors.js');
  } else {
    try {
      const vec = JSON.parse(fs.readFileSync(vecPath, 'utf8'));
      const list = Array.isArray(vec?.commands) ? vec.commands : [];
      let matched = 0, checked = 0;
      for (const cmd of list) {
        if (!cmd || !cmd.sig) continue;
        checked++;
        if (protocol.sign(vec.secret, cmd) === cmd.sig) matched++;
      }
      ok('A07 签名向量回归（对拍 vectors.json）', checked > 0 && matched === checked, `${matched}/${checked}`);
    } catch (e) {
      ok('A07 签名向量回归（对拍 vectors.json）', false, 'vectors.json 解析失败: ' + e.message);
    }
  }

  // A08 缺失 ticket 时退化为 0（EA 会明确报错，而不是悄悄平错仓）
  const c3 = protocol.buildCommand({ type: 'POSITION_CLOSE', payload: {}, secret: SECRET });
  ok('A08 平仓缺 ticket 退化为 0（可诊断）', c3.payload.ticket === 0, `ticket=${c3.payload.ticket}`);
}

// ==================================================================
// B 组 · 桥进程层（真子进程）
// ==================================================================
function startBridge() {
  const { spawn } = require('child_process');
  // 桥是纯 Node 脚本；用 Electron 二进制跑时必须显式置 ELECTRON_RUN_AS_NODE=1，
  // 否则启动的是 GUI 进程，stdin/stdout 协议根本不会建立。
  const env = { ...process.env };
  env.ELECTRON_RUN_AS_NODE = '1';
  const p = spawn(process.execPath, [path.join(ROOT, 'src', 'bridge', 'index.js')], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
  });
  let buf = '';
  const waiters = new Map();
  const all = [];
  let seq = 0;
  p.stdout.on('data', (c) => {
    buf += c.toString('utf8');
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      let m; try { m = JSON.parse(line); } catch { continue; }
      all.push(line);                       // 全量出站消息，用于扫 secret
      if (m.id && waiters.has(m.id)) { const r = waiters.get(m.id); waiters.delete(m.id); r(m); }
    }
  });
  const bridgeErr = [];
  p.stderr.on('data', (c) => bridgeErr.push(c.toString('utf8')));
  const call = (method, params = {}) => new Promise((resolve) => {
    const id = ++seq;
    waiters.set(id, resolve);
    p.stdin.write(JSON.stringify({ id, method, params }) + '\n');
    setTimeout(() => { if (waiters.has(id)) { waiters.delete(id); resolve({ timeout: true }); } }, 8000);
  });
  return { proc: p, call, allOut: () => all, errOut: () => bridgeErr.join('') };
}

async function groupB() {
  // 假终端目录：路径必须含 MetaQuotes（主进程 sanitize 要求），其余随意
  const tmpTerm = fs.mkdtempSync(path.join(os.tmpdir(), 'MetaQuotes-Terminal-'));
  const filesDir = path.join(tmpTerm, 'MQL5', 'Files');
  fs.mkdirSync(filesDir, { recursive: true });

  const b = startBridge();
  await new Promise((r) => setTimeout(r, 400));

  const ping = await b.call('ping');
  ok('B01 桥进程存活', ping && ping.ok === true, JSON.stringify(ping));

  await b.call('setSecret', { secret: 'b'.repeat(64), epoch: 1 });

  // B02 rebind 的密钥由主进程下发，桥必须照抄且不得回传
  const newSecret = 'c'.repeat(64);
  const rb = await b.call('rebind', { terminalPath: tmpTerm, secret: newSecret, epoch: 7 });
  ok('B02 rebind 返回值不含 secret',
    rb && !('timeout' in rb) && !('secret' in rb),
    JSON.stringify(rb) + (rb?.timeout ? ' stderr=' + b.errOut().slice(-200) : ''));
  ok('B03 rebind 回传 epoch', rb && rb.epoch === 7, JSON.stringify(rb));
  const secFile = path.join(filesDir, 'niuniu', 'secret.json');
  let written = null;
  try { written = JSON.parse(fs.readFileSync(secFile, 'utf8')); } catch { /* noop */ }
  ok('B04 rebind 把主进程密钥写进 secret.json', written && written.secret === newSecret && written.epoch === 7,
    written ? `epoch=${written.epoch}` : '文件不存在');

  // B05 桥进程全生命周期的出站消息里不得出现任何 secret
  const leaked = b.allOut().filter((l) => l.includes(newSecret) || l.includes('b'.repeat(64)));
  ok('B05 桥出站消息零密钥泄漏', leaked.length === 0, `泄漏 ${leaked.length} 条`);

  // B06 sendCommand 不传 epoch 时，桥必须用自己的当前代次（rebind 后 = 7）
  // 这是「epoch 被默认成 1 导致 rebind 后全部拒单」那个 bug 的回归断言
  await b.call('setSecret', { secret: newSecret, epoch: 7 });
  const sc = await b.call('sendCommand', {
    terminalPath: tmpTerm, type: 'ORDER_MARKET',
    payload: { symbol: 'EURUSD', side: 'BUY', volume_lots: 0.01, sl_points: 300, tp_points: 600, tag: 'eco-test' },
  });
  ok('B06 命令已写出', sc && sc.ok === true && !!sc.id, JSON.stringify(sc).slice(0, 160));
  let cmdFile = null;
  try {
    const inbox = path.join(filesDir, 'niuniu', 'inbox');
    cmdFile = fs.readdirSync(inbox).filter((f) => f.startsWith('cmd_'))[0];
  } catch { /* noop */ }
  let cmdObj = null;
  if (cmdFile) {
    try { cmdObj = JSON.parse(fs.readFileSync(path.join(filesDir, 'niuniu', 'inbox', cmdFile), 'utf8')); } catch { /* noop */ }
  }
  ok('B07 命令文件 session_epoch = 桥当前代次 7（不是 1）',
    cmdObj && cmdObj.session_epoch === 7, cmdObj ? `epoch=${cmdObj.session_epoch}` : '读不到命令文件');

  // B08 平仓命令的 ticket 必须真的落盘（UI → 协议 → 文件 全链路）
  const sc2 = await b.call('sendCommand', {
    terminalPath: tmpTerm, type: 'POSITION_CLOSE', payload: { ticket: 987654 },
  });
  let closeObj = null;
  try {
    const inbox = path.join(filesDir, 'niuniu', 'inbox');
    const f = fs.readdirSync(inbox).filter((x) => x.startsWith('cmd_')).map((x) => ({
      x, j: JSON.parse(fs.readFileSync(path.join(inbox, x), 'utf8')),
    })).find((o) => o.j.type === 'POSITION_CLOSE');
    closeObj = f && f.j;
  } catch { /* noop */ }
  ok('B08 平仓命令落盘带 ticket', closeObj && closeObj.payload.ticket === 987654,
    closeObj ? JSON.stringify(closeObj.payload) : `sc2=${JSON.stringify(sc2).slice(0, 120)}`);

  b.proc.kill();
  try { fs.rmSync(tmpTerm, { recursive: true, force: true }); } catch { /* noop */ }
}

// ==================================================================
// C 组 · 主进程层（真 main.js + 真 preload + 真 IPC）
// ==================================================================
function issueLicense() {
  const priv = fs.readFileSync(path.join(ROOT, 'keys', 'license-private.pem'), 'utf8');
  const b64u = (x) => Buffer.from(x).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const exp = new Date(); exp.setDate(exp.getDate() + 30);
  const info = { v: 1, i: 'NN-ECO-TEST', n: '生态校验', e: exp.toISOString().slice(0, 10), s: 1 };
  const payload = b64u(JSON.stringify(info));
  const sig = b64u(crypto.sign(null, Buffer.from(payload, 'utf8'), crypto.createPrivateKey(priv)));
  return `NN1-${payload}.${sig}`;
}

(async () => {
  groupA();
  await groupB();

  // 隔离 userData：不碰用户真实配置
  const tmpUser = fs.mkdtempSync(path.join(os.tmpdir(), 'nn-eco-user-'));
  app.setPath('userData', tmpUser);
  try {
    fs.writeFileSync(path.join(tmpUser, 'license.json'),
      JSON.stringify({ key: issueLicense(), activated_at: new Date().toISOString() }), 'utf8');
  } catch (e) {
    ok('C00 测试授权可签发', false, e.message);
  }

  // 真主进程：注册 IPC 白名单 + 启动真桥 + 开窗口
  require(path.join(ROOT, 'src', 'main.js'));
  await app.whenReady();
  await new Promise((r) => setTimeout(r, 800));

  // 自己的测试窗口：真 preload，空白页，靠 executeJavaScript 走真 IPC
  const blank = path.join(tmpUser, 'blank.html');
  fs.writeFileSync(blank, '<!doctype html><meta charset="utf-8"><title>t</title><body></body>', 'utf8');
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: path.join(ROOT, 'src', 'preload.js'),
      nodeIntegration: false, contextIsolation: true, sandbox: true,
    },
  });
  await win.loadFile(blank);
  const ev = (js) => win.webContents.executeJavaScript(js);

  // 假终端（含 MetaQuotes 才过 sanitize）
  const tmpTerm = fs.mkdtempSync(path.join(os.tmpdir(), 'MetaQuotes-Terminal-'));

  ok('C01 授权已激活（前置条件）',
    (await ev(`window.nn.licenseStatus().then(r => r.license.ok)`)) === true);

  ok('C02 初始未停用', (await ev(`window.nn.haltStatus().then(r => r.halted)`)) === false);

  // 打开停用闸门 → 交易命令必须被主进程拦下
  await ev(`window.nn.setHalt(true)`);
  const haltedNow = await ev(`window.nn.haltStatus().then(r => r.halted)`);
  ok('C03 setHalt(true) 生效', haltedNow === true);
  const blocked = await ev(`window.nn.sendCommand({
    terminalPath: ${JSON.stringify(tmpTerm)}, type: 'ORDER_MARKET',
    payload: { symbol: 'EURUSD', side: 'BUY', volume_lots: 0.01, sl_points: 300, tp_points: 600 }
  }).then(r => JSON.stringify(r))`);
  ok('C04 停用状态下单被主进程拦下',
    /已全局停用/.test(blocked) && /"ok":false/.test(blocked), blocked.slice(0, 160));
  const blockedClose = await ev(`window.nn.sendCommand({
    terminalPath: ${JSON.stringify(tmpTerm)}, type: 'POSITION_CLOSE', payload: { ticket: 111 }
  }).then(r => JSON.stringify(r))`);
  ok('C05 停用状态平仓也被拦下', /已全局停用/.test(blockedClose), blockedClose.slice(0, 160));

  // 停用期间只读命令必须放行，否则用户看不到真实持仓
  const sync = await ev(`window.nn.sendCommand({
    terminalPath: ${JSON.stringify(tmpTerm)}, type: 'SYNC_STATE'
  }).then(r => JSON.stringify(r))`);
  ok('C06 停用期间 SYNC_STATE 放行（只读）', !/已全局停用/.test(sync), sync.slice(0, 160));

  // 停用状态必须持久化（重启后不能悄悄恢复）
  ok('C07 停用状态落盘', fs.existsSync(path.join(tmpUser, 'halt.json')) &&
    JSON.parse(fs.readFileSync(path.join(tmpUser, 'halt.json'), 'utf8')).halted === true);

  // 解除停用 → 命令放行
  await ev(`window.nn.setHalt(false)`);
  const after = await ev(`window.nn.sendCommand({
    terminalPath: ${JSON.stringify(tmpTerm)}, type: 'ORDER_MARKET',
    payload: { symbol: 'EURUSD', side: 'BUY', volume_lots: 0.01, sl_points: 300, tp_points: 600 }
  }).then(r => JSON.stringify(r))`);
  ok('C08 解除停用后下单放行', !/已全局停用/.test(after), after.slice(0, 160));

  // rebind：主进程生成密钥，返回值不得含 secret
  const rb = await ev(`window.nn.rebind(${JSON.stringify(tmpTerm)}).then(r => JSON.stringify(r))`);
  ok('C09 rebind 返回值不含 secret', !/secret/.test(rb), rb.slice(0, 200));
  const secretFile = path.join(tmpUser, 'bridge-secret.json');
  let persisted = null;
  try { persisted = JSON.parse(fs.readFileSync(secretFile, 'utf8')); } catch { /* noop */ }
  ok('C10 新密钥已持久化到主进程侧', persisted && typeof persisted.secret === 'string' && persisted.epoch >= 2,
    persisted ? `epoch=${persisted.epoch}` : '文件不存在');

  // epoch 递增后，UI 不传 epoch 的命令必须带上新代次
  const cmdAfter = await ev(`window.nn.sendCommand({
    terminalPath: ${JSON.stringify(tmpTerm)}, type: 'ORDER_MARKET',
    payload: { symbol: 'EURUSD', side: 'BUY', volume_lots: 0.01, sl_points: 300, tp_points: 600 }
  }).then(r => JSON.stringify(r))`);
  let latest = null;
  try {
    const inbox = path.join(tmpTerm, 'MQL5', 'Files', 'niuniu', 'inbox');
    const fs2 = fs.readdirSync(inbox).filter((f) => f.startsWith('cmd_'));
    const objs = fs2.map((f) => JSON.parse(fs.readFileSync(path.join(inbox, f), 'utf8')));
    latest = objs.sort((a, b) => b.issued_at_ms - a.issued_at_ms)[0];
  } catch { /* noop */ }
  ok('C11 rebind 后命令带新代次（不是恒为 1）',
    latest && latest.session_epoch === persisted?.epoch,
    latest ? `epoch=${latest.session_epoch} (期望 ${persisted?.epoch})` : `cmdAfter=${cmdAfter.slice(0, 120)}`);

  try { fs.rmSync(tmpTerm, { recursive: true, force: true }); } catch { /* noop */ }

  // ---------- 输出 ----------
  const fail = results.filter((r) => !r.pass);
  const skipped = results.filter((r) => r.skipped);
  console.log('\n=== 牛牛 AI · 生态链路校验（协议 / 桥 / 主进程）===');
  results.forEach((r) => console.log(
    `${r.skipped ? 'SKIP' : (r.pass ? 'PASS' : 'FAIL')}  ${r.name}${r.pass || !r.detail ? '' : '  → ' + r.detail}`));
  console.log(`\n共 ${results.length} 项，通过 ${results.length - fail.length - skipped.length}，` +
              `失败 ${fail.length}，跳过 ${skipped.length}`);
  try { fs.rmSync(tmpUser, { recursive: true, force: true }); } catch { /* noop */ }
  app.quit(fail.length ? 1 : 0);
})().catch((e) => {
  console.error('校验脚本自身异常:', e);
  app.exit(2);
});
