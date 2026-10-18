'use strict';
/**
 * 账本存储：单文件 JSON + 原子写。
 *
 * 为什么不用数据库直接上：P0 阶段量小，一个文件就够，部署到 Zeabur 也不用额外配库。
 * 量起来了再换 Supabase / Postgres —— 接口（balance / applyDelta / append）保持不变即可。
 *
 * 并发：单进程内用一条 Promise 串行队列，保证「读-改-写」不会交错。
 */
const fs = require('fs');
const path = require('path');
const cfg = require('./config');

const FILE = path.join(cfg.DATA_DIR, 'ledger.json');
const EMPTY = { users: {}, ledger: [] };

let chain = Promise.resolve();
function lock(fn) {
  const run = chain.then(fn, fn);
  chain = run.then(() => {}, () => {});
  return run;
}

function readRaw() {
  try {
    if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, 'utf8'));
  } catch (e) {
    console.error('[store] 账本损坏，已备份并重建：' + e.message);
    try { fs.copyFileSync(FILE, FILE + '.broken-' + Date.now()); } catch { /* noop */ }
  }
  return JSON.parse(JSON.stringify(EMPTY));
}

function writeRaw(db) {
  fs.mkdirSync(cfg.DATA_DIR, { recursive: true });
  const tmp = FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db), 'utf8');
  fs.renameSync(tmp, FILE);          // 原子替换，断电也不会写坏
}

function user(db, id) {
  if (!db.users[id]) db.users[id] = { credits: 0, reserved: 0, day: {}, minute: [], inflight: 0, holds: {} };
  if (!db.users[id].holds) db.users[id].holds = {};
  if (db.users[id].inflight === undefined) db.users[id].inflight = 0;
  return db.users[id];
}

module.exports = {
  FILE,

  // 读余额（credits = 可用，reserved = 被预扣冻结中）
  balance(id) {
    return lock(() => {
      const u = user(readRaw(), id);
      return { credits: u.credits, reserved: u.reserved };
    });
  },

  // 订单幂等：同一 orderId 只允许入账一次（支付回调重放 / 乱序不得重复充值）
  seenOrder(orderId) {
    return lock(() => {
      const db = readRaw();
      if (!db.orders) db.orders = {};
      if (db.orders[orderId]) return { ok: false, dup: true };
      db.orders[orderId] = Date.now();
      const keys = Object.keys(db.orders);
      if (keys.length > 5000) {
        keys.slice(0, keys.length - 5000).forEach((k) => delete db.orders[k]);
      }
      writeRaw(db);
      return { ok: true };
    });
  },

  /**
   * 变更余额。delta 为负 = 扣减，为 0 只是记流水。
   * guard：传入 {minCredits} 可做「余额不足则失败」的原子判断。
   */
  applyDelta(id, deltaCredits, entry) {
    return lock(() => {
      const db = readRaw();
      const u = user(db, id);
      if (entry && entry.minCredits !== undefined && u.credits < entry.minCredits) {
        return { ok: false, error: '积分不足', credits: u.credits, reserved: u.reserved };
      }
      u.credits = Math.round((u.credits + deltaCredits) * 1e6) / 1e6;
      if (u.credits < 0) u.credits = 0;
      if (entry && entry.reserveDelta) {
        u.reserved = Math.round((u.reserved + entry.reserveDelta) * 1e6) / 1e6;
        if (u.reserved < 0) u.reserved = 0;
      }
      if (entry) {
        entry.at = new Date().toISOString();
        entry.user = id;
        entry.balance = u.credits;
        db.ledger.push(entry);
        if (db.ledger.length > 20000) db.ledger = db.ledger.slice(-10000);
      }
      writeRaw(db);
      return { ok: true, credits: u.credits, reserved: u.reserved };
    });
  },

  // 限额：分钟级 + 天级。返回 false = 超限
  hit(id) {
    return lock(() => {
      const db = readRaw();
      const u = user(db, id);
      const now = Date.now();
      const day = new Date().toISOString().slice(0, 10);
      u.minute = (u.minute || []).filter((t) => now - t < 60000);
      if (u.day.day !== day) u.day = { day, n: 0 };
      if (u.minute.length >= cfg.RATE_PER_MIN) return { ok: false, error: '请求过于频繁，请稍后再试' };
      if (u.day.n >= cfg.RATE_PER_DAY) return { ok: false, error: '已达到今日用量上限' };
      u.minute.push(now);
      u.day.n += 1;
      writeRaw(db);
      return { ok: true };
    });
  },

  // 在途请求闸门：20 次/分钟防不住「20 个请求同一秒打进来」。
  // 持久化到账本里，崩溃重启后由 resetInflight() 归零，不会永久卡死。
  acquire(id) {
    return lock(() => {
      const db = readRaw();
      const u = user(db, id);
      if (u.inflight >= cfg.MAX_INFLIGHT) return { ok: false, error: '已有请求在处理中，请等它完成' };
      u.inflight += 1;
      writeRaw(db);
      return { ok: true };
    });
  },
  release(id) {
    return lock(() => {
      const db = readRaw();
      const u = user(db, id);
      if (u.inflight > 0) u.inflight -= 1;
      writeRaw(db);
      return { ok: true };
    });
  },
  // 启动时调用：上一次进程崩溃可能留下卡死的在途计数
  resetInflight() {
    return lock(() => {
      const db = readRaw();
      for (const id of Object.keys(db.users)) db.users[id].inflight = 0;
      writeRaw(db);
      return { ok: true };
    });
  },

  // ---- 预扣挂起的持久化（崩溃重启后能找到并退款，而不是永久锁死用户积分） ----
  putHold(userId, holdId, credits) {
    return lock(() => {
      const db = readRaw();
      user(db, userId).holds[holdId] = { credits, at: Date.now() };
      writeRaw(db);
      return { ok: true };
    });
  },
  takeHold(userId, holdId) {
    return lock(() => {
      const db = readRaw();
      const u = user(db, userId);
      const h = u.holds[holdId] || null;
      if (h) { delete u.holds[holdId]; writeRaw(db); }
      return h;
    });
  },
  // 找出超时未结算的预扣（返回后由 billing 退款）
  expiredHolds(ttlMs) {
    return lock(() => {
      const db = readRaw();
      const out = [];
      const now = Date.now();
      for (const [id, u] of Object.entries(db.users)) {
        for (const [hid, h] of Object.entries(u.holds || {})) {
          if (now - h.at > ttlMs) out.push({ userId: id, holdId: hid, credits: h.credits, ageMs: now - h.at });
        }
      }
      return out;
    });
  },

  // 只读快照（给运营看账用）
  dump() {
    return lock(() => readRaw());
  },
};
