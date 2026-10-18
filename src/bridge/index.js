'use strict';
/**
 * 牛牛 AI · 本地桥（独立进程，stdio JSON-lines）
 *
 * 职责：MT5 实例发现 / EA 安装 / 文件 IPC 收发 / 回执轮询 / 命令状态机
 * 不做的事：不监听任何端口（不暴露 localhost HTTP），不碰渲染进程
 *
 * 与 EA 的分工：
 *   桥负责生成 id、签名、写命令、收回执、UI 呈现
 *   EA 负责鉴权、账户校验、执行前风控、下单、写回执
 *   两端都各自校验，桌面端校验通过不能替代 EA 校验
 */
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const protocol = require('./protocol');

const BRIDGE_DIR = 'niuniu';          // EA 侧 InpBridgeDir 必须一致
const POLL_MS = 500;

const state = {
  secret: null,
  epoch: 1,              // 绑定代次：与 EA secret.json 里的 epoch 必须一致
  watchers: new Map(),   // terminalPath -> { timer, known:Set }
  commands: new Map(),   // id -> { cmd, terminal, stage, sentAt }
};

// ---------- 基础工具 ----------
function log(...a) { process.stderr.write(`[bridge] ${a.join(' ')}\n`); }

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

/** 原子发布：同目录写 .tmp 后 rename。Windows 同卷 rename 是原子的。 */
function writeAtomic(file, content) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, content, 'utf8');
  try {
    fs.renameSync(tmp, file);           // 同卷原子
  } catch (e) {
    // 目标已存在时 rename 在 Windows 上会失败，改用覆盖写
    fs.copyFileSync(tmp, file);
    fs.unlinkSync(tmp);
  }
}

function readJsonIfFresh(file, maxAgeMs) {
  try {
    const st = fs.statSync(file);
    if (maxAgeMs && Date.now() - st.mtimeMs > maxAgeMs) return { stale: true, data: null };
    return { stale: false, data: JSON.parse(fs.readFileSync(file, 'utf8')) };
  } catch {
    return { stale: true, data: null };
  }
}

// ---------- MT5 实例发现 ----------
function metaQuotesRoot() {
  return path.join(os.homedir(), 'AppData', 'Roaming', 'MetaQuotes', 'Terminal');
}

/**
 * 枚举所有 MT5 终端实例。
 * 每个终端实例有自己独立的 MQL5\Files 沙箱 —— 多实例隔离靠这个天然实现，
 * 不要用 FILE_COMMON（那是所有终端共享的，会串线）。
 */
async function discoverTerminals() {
  const root = metaQuotesRoot();
  let entries = [];
  try { entries = await fsp.readdir(root, { withFileTypes: true }); } catch { return []; }

  const out = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    const termPath = path.join(root, e.name);
    const filesDir = path.join(termPath, 'MQL5', 'Files');
    if (!fs.existsSync(filesDir)) continue;

    const bridgeDir = path.join(filesDir, BRIDGE_DIR);
    const heart = readJsonIfFresh(path.join(bridgeDir, 'heart.json'), 15000);
    const originFile = path.join(termPath, 'origin.txt');
    let broker = '';
    try { broker = fs.readFileSync(originFile, 'utf8').trim().slice(0, 120); } catch { /* 可选 */ }

    out.push({
      id: e.name,
      path: termPath,
      filesDir,
      bridgeDir,
      broker,
      // 只有 EA 心跳是真的递增，才认为这个终端是「活的」——
      // 目录存在只能说明装过 MT5，不能说明 EA 在跑
      eaLive: !heart.stale && !!heart.data,
      heart: heart.data,
    });
  }
  return out;
}

// ---------- EA 安装 ----------
async function installEA(terminalPath) {
  const expertsDir = path.join(terminalPath, 'MQL5', 'Experts');
  const filesDir = path.join(terminalPath, 'MQL5', 'Files');
  if (!fs.existsSync(expertsDir)) return { ok: false, error: '终端目录不存在' };

  const candidates = [
    path.join(__dirname, '..', '..', 'ea', 'NiuNiuBridge.ex5'),
    path.join(__dirname, '..', '..', 'ea', 'NiuNiuBridge.mq5'),
  ];
  const src = candidates.find((p) => fs.existsSync(p));
  if (!src) return { ok: false, error: '找不到 NiuNiuBridge.ex5 / .mq5' };

  const dst = path.join(expertsDir, path.basename(src));
  fs.copyFileSync(src, dst);

  for (const d of ['inbox', 'outbox', 'archive', 'quarantine']) {
    fs.mkdirSync(path.join(filesDir, BRIDGE_DIR, d), { recursive: true });
  }

  // 密钥下发：EA 自己生成不了随机的、与本机一致的密钥，必须由桥写入。
  // 没有这一步，EA 侧 g_secret_ok=false，会拒绝一切交易命令（fail-closed）。
  const bridgeDir = path.join(filesDir, BRIDGE_DIR);
  const secret = state.secret;
  if (!secret) {
    return { ok: false, error: '桥尚未持有密钥，请先 setSecret', installed: dst };
  }
  writeSecret(path.join(bridgeDir, 'secret.json'), secret, state.epoch);

  log('EA installed ->', dst, '(secret.json 已写入)');
  return { ok: true, installed: dst, isSource: src.endsWith('.mq5'), signed: true, epoch: state.epoch };
}

function writeSecret(file, secret, epoch) {
  writeAtomic(file, JSON.stringify({ secret, epoch, written_at_ms: Date.now() }));
}

/**
 * 重新绑定：换账户 / 重新授权后调用。
 * epoch 自增 → 旧代次的命令全部失效（EA 会比对 session_epoch）。
 * 同时换一把新密钥，旧密钥签的命令也一并作废。
 *
 * ⚠ 密钥方向与返回值：密钥由主进程生成并下发（params.secret / params.epoch），
 * 桥只负责写进 EA 的 secret.json。**返回值里绝不能带 secret** ——
 * 桥的返回值会被主进程原样转发给渲染进程，带 secret 就等于把密钥送进渲染层，
 * 与「密钥只存在于主进程与桥进程」的设计直接冲突。
 * params 缺失时桥仍可自行生成（保证旧调用方不炸），但主路径一定由主进程下发。
 */
async function rebind(terminalPath, secret, epoch) {
  const filesDir = path.join(terminalPath, 'MQL5', 'Files');
  const bridgeDir = path.join(filesDir, BRIDGE_DIR);
  // 必须先建目录：EA 从来没装过时 niuniu/ 不存在，直接写会 ENOENT 崩掉整条调用。
  // 用户第一次点「重新绑定」就撞上这个，属于必然触发而不是边缘情况。
  fs.mkdirSync(bridgeDir, { recursive: true });
  state.epoch = Number.isFinite(Number(epoch)) && Number(epoch) >= 1
    ? Number(epoch)
    : (state.epoch || 1) + 1;
  state.secret = (typeof secret === 'string' && secret) ? secret : crypto.randomBytes(32).toString('hex');
  writeSecret(path.join(bridgeDir, 'secret.json'), state.secret, state.epoch);
  log('rebound, new epoch =', state.epoch, '(secret from:', secret ? 'main' : 'bridge', ')');
  return { ok: true, epoch: state.epoch };
}

// ---------- 命令收发 ----------
async function sendCommand({ terminalPath, type, payload, account, accountServer, epoch, ttlMs }) {
  const inbox = path.join(terminalPath, 'MQL5', 'Files', BRIDGE_DIR, 'inbox');
  fs.mkdirSync(inbox, { recursive: true });

  const cmd = protocol.buildCommand({
    type, account, accountServer,
    epoch: epoch ?? state.epoch,     // 不传就用当前代次，避免与 EA 侧 secret.json 不一致
    payload,
    secret: state.secret, ttlMs: ttlMs ?? 30000,
  });

  // 同目录 .tmp → rename，EA 只认正式文件名
  const finalPath = path.join(inbox, `cmd_${cmd.id}.json`);
  writeAtomic(finalPath, JSON.stringify(cmd));

  state.commands.set(cmd.id, {
    cmd, terminalPath, stage: 'SENT', sentAt: Date.now(),
    receiptPath: path.join(terminalPath, 'MQL5', 'Files', BRIDGE_DIR, 'outbox', `rcpt_${cmd.id}.json`),
  });

  log('command sent', cmd.id, type);
  return { id: cmd.id, command: cmd };
}

/** 轮询回执；返回终态或当前态。不做自动重放。 */
function pollReceipts() {
  for (const [id, rec] of state.commands) {
    if (protocol.TERMINAL_STAGES.has(rec.stage)) continue;
    const r = readJsonIfFresh(rec.receiptPath, 0);
    if (r.stale || !r.data) {
      // 超时未收到任何回执 = 结果未知，标记 RECONCILING
      // 明确规则：禁止自动重放，宁可让用户看到「待核对」
      if (Date.now() - rec.sentAt > (rec.cmd.ttl_ms + 30000)) {
        rec.stage = 'RECONCILING';
        send({ type: 'receipt', id, stage: 'RECONCILING', message: '结果未知，需人工核对，已禁止自动重放' });
      }
      continue;
    }
    rec.stage = r.data.stage || 'UNKNOWN';
    rec.receipt = r.data;
    send({ type: 'receipt', id, ...r.data });
  }
}

// ---------- 状态快照 ----------
function snapshot(terminalPath) {
  const base = path.join(terminalPath, 'MQL5', 'Files', BRIDGE_DIR);
  const heart = readJsonIfFresh(path.join(base, 'heart.json'), 15000);
  const status = readJsonIfFresh(path.join(base, 'status.json'), 15000);
  return {
    terminalPath,
    eaLive: !heart.stale && !!heart.data,
    heart: heart.data,
    status: status.data,
    statusAgeMs: status.data ? undefined : null,
  };
}

// ---------- 主循环 ----------
let pollTimer = null;
function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    try { pollReceipts(); } catch (e) { log('poll error', e.message); }
  }, POLL_MS);
}

// stdio JSON-lines 协议（不监听端口，无 HTTP 面）
let buf = '';
process.stdin.on('data', (chunk) => {
  buf += chunk.toString('utf8');
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    // 错误响应必须带 id：主进程靠 id 匹配 pending，无 id 的响应会让请求挂到 15 秒超时，
    // 表现为「点了没反应」，而不是「报错了」。
    let reqId = null;
    try { reqId = JSON.parse(line).id; } catch { /* 坏 JSON 由 handle 处理 */ }
    handle(line).catch((e) => send({ id: reqId, type: 'error', message: e.message }));
  }
});

async function handle(line) {
  let req;
  try { req = JSON.parse(line); } catch { return send({ type: 'error', message: 'bad json' }); }
  const { id, method, params = {} } = req;

  switch (method) {
    case 'ping':
      return send({ id, type: 'result', ok: true, version: protocol.PROTOCOL_VERSION });

    case 'setSecret':
      state.secret = params.secret || null;
      // epoch 由主进程持久化后回传：app 重启后不能退回 1，否则与 EA 侧不一致而全部拒单
      if (Number.isFinite(params.epoch) && params.epoch >= 1) state.epoch = params.epoch;
      return send({ id, type: 'result', ok: true, epoch: state.epoch });

    case 'rebind': {
      const r = await rebind(params.terminalPath, params.secret, params.epoch);
      // 只回 ok + epoch。secret 一律不出现在桥的任何出站消息里。
      return send({ id, type: 'result', ok: r.ok, epoch: r.epoch });
    }

    case 'discover': {
      const list = await discoverTerminals();
      return send({ id, type: 'result', ok: true, terminals: list });
    }

    case 'installEA': {
      const r = await installEA(params.terminalPath);
      return send({ id, type: 'result', ...r });
    }

    case 'snapshot':
      return send({ id, type: 'result', ok: true, snapshot: snapshot(params.terminalPath) });

    case 'sendCommand': {
      const r = await sendCommand(params);
      startPolling();
      // ⚠ id 必须放在展开之后。r 里也有一个 id（命令 ULID），
      // 写 `{ id, ...r }` 会把请求 id 覆盖成命令 id，主进程的 pending 永远匹配不上，
      // 每次下单都要等 15 秒超时 —— 表现为「点了没反应」，而不是报错。
      return send({ type: 'result', ok: true, ...r, id });
    }

    case 'commandStatus': {
      const rec = state.commands.get(params.commandId);
      return send({ id, type: 'result', ok: !!rec, stage: rec?.stage ?? null, receipt: rec?.receipt ?? null });
    }

    default:
      return send({ id, type: 'error', message: `unknown method: ${method}` });
  }
}

log('bridge ready, protocol v' + protocol.PROTOCOL_VERSION);
