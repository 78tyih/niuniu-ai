'use strict';
/**
 * 牛牛 AI · MT5 桥协议 v1
 * 命令  : inbox/cmd_<ULID>.json   （写 .tmp 后 rename 转正）
 * 回执  : outbox/rcpt_<id>.json   （两阶段）
 * 心跳  : heart.json              （带递增 seq，桥靠 seq 变化判断 EA 存活）
 * 状态  : status.json
 *
 * 单位约定（务必遵守，混用会出事故）：
 *   sl_points / tp_points / max_deviation_points = 该 symbol 的 _Point 整数倍
 *   point = symbol 最小报价单位，不是 pip
 *   手数 = 手（lots），由 EA 按 SYMBOL_VOLUME_STEP 对齐
 */
const crypto = require('crypto');

const PROTOCOL_VERSION = 1;

/** ULID 风格 id：时间前缀 + 随机后缀。EA 侧取末 8 位做 comment 短码，故随机后缀必须够长。 */
function newCommandId() {
  const ts = Date.now().toString(36).padStart(9, '0');
  const rand = crypto.randomBytes(10).toString('hex'); // 20 hex chars
  return `${ts}${rand}`;
}

/**
 * canonical 数值格式化 —— 必须与 MQL5 侧 NNFmtNum() 逐字节一致。
 * 规则：定点 8 位 → 去掉尾随 0 → 去掉尾随小数点；0 与 -0 统一为 "0"；
 *      |v| >= 1e15 走整数路径（避免 JS toFixed 退化成科学计数法）。
 * 混用规则 = 签名永远不匹配 = EA 拒掉所有命令，改这里必须同步改 EA。
 */
function fmtNum(v) {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v);
  if (n === 0) return '0';
  if (Math.abs(n) >= 1e15) return String(Math.trunc(n));
  let s = n.toFixed(8);
  if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
  if (s === '-0') s = '0';
  return s;
}

/**
 * 规范化字段串：双端必须逐字节一致，否则签名不匹配。
 * 字段集与顺序 = EA 侧 PumpInbox() 里的 canonical，改一边必须改另一边。
 * payload 内的键由 EA 的 PayloadSub() 局部解析（避免 comment 里出现同名键被误匹配）。
 */
function canonical(cmd) {
  const p = cmd.payload || {};
  return [
    String(cmd.id ?? ''),
    String(cmd.type ?? ''),
    String(cmd.account ?? ''),
    String(cmd.account_server ?? ''),
    fmtNum(cmd.session_epoch),
    String(p.symbol ?? ''),
    String(p.side ?? ''),
    fmtNum(p.volume_lots),
    fmtNum(p.sl_points),
    fmtNum(p.tp_points),
  ].join('|');
}

function sign(secret, cmd) {
  return crypto.createHmac('sha256', secret).update(canonical(cmd), 'utf8').digest('hex');
}

/**
 * 构造一条命令。
 * 注意：TTL 限制的是「允许开始提交的时间」，不是「成交期限」。
 * 请求已发给券商后，过期不等于撤单，也不等于没有成交。
 *
 * ⚠ payload 字段集 = EA 侧 PumpInbox() 实际会去读的字段集，两边必须一一对应。
 * 历史上这里只有 7 个字段，缺 ticket，而 UI 的平仓请求传的正是 ticket
 * —— 结果是「平仓按钮按下去永远返回『持仓不存在: 0』」。
 * 新增字段不进 canonical（签名只签 10 段），因此不需要重编译 EA。
 */
function buildCommand({ type, account, accountServer, epoch, payload, secret, ttlMs = 30000 }) {
  const id = newCommandId();
  const p = payload || {};
  // canonical 覆盖的字段必须全部存在（缺失会让 EA 侧算出 "0" 而这里算出 ""，签名直接不匹配）
  const cmd = {
    v: PROTOCOL_VERSION,
    id,
    type,
    account: String(account ?? ''),
    account_server: accountServer ?? '',
    session_epoch: epoch ?? 1,
    issued_at_ms: Date.now(),
    ttl_ms: ttlMs,
    payload: {
      symbol: String(p.symbol ?? ''),
      side: String(p.side ?? ''),
      volume_lots: Number(p.volume_lots ?? 0),
      sl_points: Number(p.sl_points ?? 0),
      tp_points: Number(p.tp_points ?? 0),
      max_deviation_points: Number(p.max_deviation_points ?? 20),
      // POSITION_CLOSE 的定位字段。EA 侧 JsonStr(psub,"ticket") 读它；
      // 缺失时 StringToInteger("") = 0 → PositionSelectByTicket(0) 必然失败。
      ticket: Number(p.ticket ?? 0),
      // UI 历史上用 tag，EA 侧读的是 comment。这里做一次归一，避免 tag 静默丢失。
      comment: String(p.comment ?? p.tag ?? ''),
    },
  };
  cmd.sig = secret ? sign(secret, cmd) : '';
  return cmd;
}

function verifyReceipt(raw) {
  try {
    const r = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return r && r.id ? r : null;
  } catch {
    return null;
  }
}

/** 终态：收到后桥可以停止轮询该命令 */
const TERMINAL_STAGES = new Set(['EXECUTED', 'REJECTED', 'EXPIRED']);
/** 不确定态：禁止自动重放，只能人工核对 */
const UNCERTAIN_STAGES = new Set(['RECONCILING']);

module.exports = {
  PROTOCOL_VERSION,
  newCommandId,
  fmtNum,
  canonical,
  sign,
  buildCommand,
  verifyReceipt,
  TERMINAL_STAGES,
  UNCERTAIN_STAGES,
};
