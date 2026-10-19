'use strict';
/* 牛牛 AI · 渲染层。只调用 preload 暴露的白名单方法，拿不到密钥、拿不到任意文件路径。 */

const $ = (id) => document.getElementById(id);
const state = {
  terminals: [],
  selected: null,
  snapshot: null,
  halted: false,
  lastCmd: null,
  logLines: [],
  catalog: null,          // 策略资产库 catalog.json
  stratFilter: 'all',     // 当前策略筛选
  pendingSuggestion: null, // AI 下单建议（二次确认前暂存）
  pendingLots: null,       // 系统算出的手数（二次确认前暂存）
};

function log(msg, tag, isHtml) {
  const t = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  const plain = String(msg).replace(/<[^>]*>/g, '');           // 导出用纯文本
  state.logLines.push(`[${t}] ${tag ? tag + ' ' : ''}${plain}`);
  if (state.logLines.length > 400) state.logLines.shift();
  const box = $('logBox');
  if (box.childNodes.length > 400) box.removeChild(box.firstChild);
  const row = document.createElement('div');
  row.textContent = `[${t}] ${tag ? tag + ' ' : ''}`;
  if (isHtml) { const sp = document.createElement('span'); sp.innerHTML = String(msg); row.appendChild(sp); }
  else row.appendChild(document.createTextNode(plain));
  box.appendChild(row);
  box.scrollTop = box.scrollHeight;
}

const fmt = (n, d = 2) => (n === null || n === undefined || Number.isNaN(Number(n)))
  ? '—' : Number(n).toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });

// ---------- 外观：主题 / 配色（存在主进程，不落 localStorage） ----------
// 主题与配色是正交的两件事：主题管明暗，配色管主色。四个配色 × 日/夜都成立。
const MODES = ['浅色', '深色', '自动'];
const ACCENTS = { orange: '品牌橙', blue: '深海蓝', green: '翡翠绿', purple: '紫罗兰' };
const prefs = { theme: '浅色', accent: 'orange', page: 'p-overview' };
let sysMq = null;

function resolveTheme(mode) {
  if (mode !== '自动') return mode === '深色' ? 'dark' : 'light';
  try { return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  catch { return 'light'; }
}
function paintTheme() {
  document.documentElement.setAttribute('data-theme', resolveTheme(prefs.theme));
  document.querySelectorAll('#themeSeg button').forEach((b) => {
    b.classList.toggle('on', b.dataset.m === prefs.theme);
  });
}
function paintAccent() {
  const a = ACCENTS[prefs.accent] ? prefs.accent : 'orange';
  document.documentElement.setAttribute('data-accent', a);
  document.querySelectorAll('#accentRow .accent-dot').forEach((b) => {
    b.classList.toggle('on', b.dataset.a === a);
  });
  const lbl = $('accentNameLabel');
  if (lbl) lbl.textContent = ACCENTS[a];
}
// 只在「跟随系统」时挂监听，切走就摘掉，避免多个监听器叠加
function watchSystem() {
  if (sysMq) { try { sysMq.removeEventListener('change', paintTheme); } catch { /* noop */ } sysMq = null; }
  if (prefs.theme !== '自动') return;
  try {
    sysMq = window.matchMedia('(prefers-color-scheme: dark)');
    sysMq.addEventListener('change', paintTheme);
  } catch { /* noop */ }
}
function savePrefs() {
  try { window.nn.setPrefs({ theme: prefs.theme, accent: prefs.accent, page: prefs.page }); }
  catch { /* 存不下不影响交易 */ }
}
function loadPrefs() {
  let p = null;
  try { p = window.nn.getPrefsSync(); } catch { /* 老版本 preload 没有这个接口 */ }
  if (p && typeof p === 'object') {
    if (MODES.includes(p.theme)) prefs.theme = p.theme;
    if (ACCENTS[p.accent]) prefs.accent = p.accent;
    if (PAGE_META[p.page]) prefs.page = p.page;
  }
  paintTheme(); paintAccent(); watchSystem();
}

// ---------- 侧边栏导航（一级菜单，页面为二级） ----------
const PAGE_META = {
  'p-overview':  ['概览', '账户与持仓总览'],
  'p-terminal':  ['终端与 EA', '扫描本机 MT5 实例，安装桥接 EA 并绑定密钥'],
  'p-trade':     ['交易', '人工下单与回执跟踪'],
  'p-strategy':  ['策略广场', '策略方挂牌 · 业绩可查 · 一键跟单'],
  'p-ai':        ['AI 副驾驶', '连接 AI 网关后按用量扣积分'],
  'p-settings':  ['设置', '外观与配色，选择后立即生效并记住'],
};
function go(pageId) {
  if (!PAGE_META[pageId]) return;
  prefs.page = pageId;
  document.querySelectorAll('.page').forEach((p) => p.classList.toggle('on', p.id === pageId));
  document.querySelectorAll('#nav .nav-item').forEach((b) => {
    b.classList.toggle('on', b.dataset.page === pageId);
  });
  const t = document.querySelector('.topbar h1');
  // 副标题固定为产品定位，不跟随页面 —— 页内已有说明，避免同一句话出现两遍
  if (t) t.textContent = PAGE_META[pageId][0];
  const pages = document.querySelector('.pages');
  if (pages) pages.scrollTop = 0;
  savePrefs();
}

// 首帧前先把主题刷上，避免深色用户看到白屏闪一下
loadPrefs();
document.querySelectorAll('#nav .nav-item').forEach((b) => {
  b.addEventListener('click', () => go(b.dataset.page));
});
document.querySelectorAll('#themeSeg button').forEach((b) => {
  b.addEventListener('click', () => {
    if (!MODES.includes(b.dataset.m)) return;
    prefs.theme = b.dataset.m;
    paintTheme(); watchSystem(); savePrefs();
    log(`外观已切换：${prefs.theme}`);
  });
});
document.querySelectorAll('#accentRow .accent-dot').forEach((b) => {
  b.addEventListener('click', () => {
    if (!ACCENTS[b.dataset.a]) return;
    prefs.accent = b.dataset.a;
    paintAccent(); savePrefs();
    log(`配色已切换：${ACCENTS[prefs.accent]}`);
  });
});

// ---------- 终端发现 ----------
async function discover() {
  $('termList').innerHTML = '<div class="empty">正在扫描…</div>';
  const r = await window.nn.discover();
  if (!r || !r.ok) { log('扫描失败', '⚠'); return; }

  state.terminals = r.terminals || [];
  if (!state.terminals.length) {
    $('termList').innerHTML =
      '<div class="empty">未检测到 MT5 终端。<br>请先安装券商官方 MT5 并登录（建议模拟账户）。</div>';
    log('未检测到 MT5 终端');
    return;
  }

  $('termList').innerHTML = '';
  state.terminals.forEach((t) => {
    const el = document.createElement('div');
    el.className = 'term' + (state.selected === t.path ? ' sel' : '');
    el.innerHTML = `
      <div>
        <div class="br">${escapeHtml(t.broker || 'MT5 终端')}</div>
        <div class="id">${escapeHtml(t.id.slice(0, 16))}…</div>
      </div>
      <div class="st ${t.eaLive ? 'live' : ''}">${t.eaLive ? 'EA 在线' : 'EA 未运行'}</div>`;
    el.onclick = () => selectTerminal(t);
    $('termList').appendChild(el);
  });

  // 默认选中第一个「活的」终端
  const live = state.terminals.find((t) => t.eaLive) || state.terminals[0];
  selectTerminal(live);
  log(`发现 ${state.terminals.length} 个终端实例`);
}

function selectTerminal(t) {
  state.selected = t.path;
  document.querySelectorAll('.term').forEach((el, i) => {
    el.classList.toggle('sel', state.terminals[i]?.path === t.path);
  });
  $('installBtn').disabled = false;
  $('rebindBtn').disabled = false;
  $('installNote').textContent = t.eaLive
    ? 'EA 已在线。若更换了 EA 版本，可重新安装后在 MT5 中重新挂载。'
    : 'EA 未运行。请点击「安装桥接 EA」，然后在 MT5 导航器中把它拖到图表并勾选「允许算法交易」。';
  refresh();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- 安装 EA ----------
$('installBtn').onclick = async () => {
  if (!state.selected) return;
  const r = await window.nn.installEA(state.selected);
  if (r?.ok) {
    log(`EA 已安装：${r.installed}`, '✓');
    $('installNote').textContent = r.isSource
      ? '⚠ 安装的是源码 .mq5 —— 请在 MT5 的 MetaEditor 中编译生成 .ex5 后再挂载。'
      : '已安装编译产物 .ex5。在 MT5 导航器 → EA 交易 → NiuNiuBridge 拖到图表，勾选「允许算法交易」。';
    $('s2').classList.add('on');
  } else {
    log(`安装失败：${r?.error}`, '⚠');
  }
  await discover();
};

$('rescanBtn').onclick = discover;

// ---------- 状态刷新 ----------
async function refresh() {
  if (!state.selected) return;
  const r = await window.nn.snapshot(state.selected);
  if (!r?.ok) return;
  state.snapshot = r.snapshot;
  render();
}

function render() {
  const s = state.snapshot;
  const live = !!(s && s.eaLive);
  $('dotTerm').className = 'dot ' + (live ? 'live' : 'dead');
  $('dotAcct').className = 'dot ' + (live ? 'live' : 'dead');

  if (!s || !s.status) {
    $('acctMeta').textContent = live ? 'EA 在线，等待状态快照…' : '未连接：EA 未运行';
    $('orderBtn').disabled = true;
    return;
  }

  const st = s.status;
  const acct = st.account || {};
  $('kBalance').textContent = fmt(acct.balance);
  $('kEquity').textContent = fmt(acct.equity);
  $('kFree').textContent = fmt(acct.free_margin);
  $('kSymbol').textContent = st.symbol || '—';
  $('kBid').textContent = st.quote ? Number(st.quote.bid).toFixed(5) : '—';
  $('kAsk').textContent = st.quote ? Number(st.quote.ask).toFixed(5) : '—';

  const modeTxt = acct.mode === 'netting' ? '净额' : acct.mode === 'hedging' ? '对冲' : '—';
  $('acctMeta').textContent =
    `账户 ${acct.login} @ ${s.heart?.server || '—'} · ${modeTxt}模式 · 交易许可 ${st.trading_allowed ? '开' : '关'}`;

  // 签名状态：false 表示 EA 没拿到密钥，会拒绝一切交易命令（fail-closed）。
  // 必须让用户看见原因，否则只会看到"下单被拒"却不知道为什么。
  const signed = st.signed !== false;
  $('sigBadge').textContent = signed ? '签名校验已启用' : '未启用签名 · 交易命令将被拒绝';
  $('sigBadge').className = 'badge ' + (signed ? 'ok' : 'bad');
  $('sigHint').style.display = signed ? 'none' : 'block';

  // 持仓
  const pos = st.positions || [];
  $('posBody').innerHTML = pos.length ? pos.map((p) => `
    <tr>
      <td>${p.ticket}</td>
      <td>${escapeHtml(p.symbol)}</td>
      <td class="${p.type === 'BUY' ? 'buy' : 'sell'}">${p.type}</td>
      <td>${fmt(p.volume, 2)}</td>
      <td>${Number(p.price_open).toFixed(5)}</td>
      <td>${p.sl ? Number(p.sl).toFixed(5) : '—'}</td>
      <td class="${p.profit >= 0 ? 'buy' : 'sell'}">${fmt(p.profit)}</td>
      <td><button class="ghost" data-close="${p.ticket}">平仓</button></td>
    </tr>`).join('')
    : '<tr><td colspan="8" style="color:var(--muted);text-align:center;padding:18px">暂无持仓</td></tr>';

  document.querySelectorAll('[data-close]').forEach((b) => {
    b.onclick = () => closePosition(b.dataset.close);
  });

  // 票据
  $('tAcc').textContent = acct.login ?? '—';
  $('tSrv').textContent = s.heart?.server || '—';
  $('tSym').textContent = st.symbol || '—';
  updateTicket();

  const canTrade = live && st.trading_allowed && signed && licOk && !state.halted;
  $('orderBtn').disabled = !canTrade;
  $('orderBtn').textContent = state.halted ? '已停用'
    : !licOk ? '未授权 · 请先激活'
    : '确认下单（模拟盘）';
  if (live) $('s3').classList.add('on');
}

function updateTicket() {
  const side = $('fSide').value;
  const lots = $('fLots').value;
  $('tSide').textContent = `${side} · ${lots} 手`;
  $('tSl').textContent = `${$('fSl').value} 点 / ${$('fTp').value} 点`;

  const warns = [];
  if (state.snapshot?.status?.account?.mode === 'netting') {
    warns.push('净额账户：平仓使用 PositionClose，不会发反向单（反向单在净额模式等于减仓或反手）。');
  }
  if (!state.snapshot?.status?.trading_allowed) warns.push('终端当前禁止交易。');
  $('tWarn').textContent = warns.join(' ');
}
['fSide', 'fLots', 'fSl', 'fTp', 'fDev'].forEach((id) => {
  $(id).addEventListener('input', updateTicket);
});

// ---------- 下单 ----------
$('orderBtn').onclick = async () => {
  if (state.halted) return log('已停用，拒绝下单', '⚠');
  if (!licOk) return log('未授权：请先激活授权密钥', '⚠');
  const st = state.snapshot?.status;
  if (!st) return;

  const r = await window.nn.sendCommand({
    terminalPath: state.selected,
    type: 'ORDER_MARKET',
    account: st.account?.login,
    accountServer: state.snapshot.heart?.server,
    epoch: state.snapshot.heart?.epoch ?? 1,
    payload: {
      symbol: st.symbol,
      side: $('fSide').value,
      volume_lots: Number($('fLots').value),
      sl_points: Number($('fSl').value),
      tp_points: Number($('fTp').value),
      max_deviation_points: Number($('fDev').value),
      tag: 'manual',
    },
  });

  if (!r?.ok) return log(`下单失败：${r?.error}`, '⚠');
  state.lastCmd = r.id;
  log(`命令已发送 ${r.id} · ${$('fSide').value} ${$('fLots').value} 手`, '→');
  watchCommand(r.id);
};

async function closePosition(ticket) {
  if (state.halted) return log('已停用，拒绝平仓', '⚠');
  const st = state.snapshot?.status;
  const r = await window.nn.sendCommand({
    terminalPath: state.selected,
    type: 'POSITION_CLOSE',
    account: st?.account?.login,
    accountServer: state.snapshot?.heart?.server,
    epoch: state.snapshot?.heart?.epoch ?? 1,
    payload: { ticket: String(ticket) },
  });
  if (!r?.ok) return log(`平仓失败：${r?.error}`, '⚠');
  log(`平仓命令已发送 ${r.id} · 单号 ${ticket}`, '→');
  watchCommand(r.id);
}

// ---------- 回执跟踪 ----------
const watching = new Map();
function watchCommand(id) {
  if (watching.has(id)) return;
  const timer = setInterval(async () => {
    const r = await window.nn.commandStatus(id);
    if (!r?.ok) return;
    const stage = r.stage;
    if (stage && stage !== 'SENT') {
      const badge =
        stage === 'EXECUTED' ? ['b-exec', '已成交'] :
        stage === 'REJECTED' ? ['b-rej', '已拒绝'] :
        stage === 'EXPIRED'  ? ['b-exp', '已过期'] :
        stage === 'RECONCILING' ? ['b-rec', '待核对'] :
        ['b-sent', stage];
      log(`回执 ${id.slice(-10)} → <span class="badge ${badge[0]}">${badge[1]}</span> ${r.receipt?.message || ''}`, null, true);
      if (stage === 'RECONCILING') {
        log('⚠ 结果未知，已禁止自动重放。请在 MT5 中人工核对后再决定，切勿重复提交。', '⚠');
      }
      if (['EXECUTED', 'REJECTED', 'EXPIRED', 'RECONCILING'].includes(stage)) {
        clearInterval(timer); watching.delete(id); refresh();
      }
    }
  }, 800);
  watching.set(id, timer);
}

// ---------- 重新绑定（换账户） ----------
// 换账户后必须走这一步：会换掉密钥并把 epoch 自增，旧代次的命令全部作废。
$('rebindBtn').onclick = async () => {
  if (!state.selected) return log('请先选择终端', '⚠');
  if (!confirm('重新绑定会更换密钥并让所有旧命令失效。\n请确认 MT5 已登录你要用的账户，然后重启一次 EA。\n\n继续？')) return;
  const r = await window.nn.rebind(state.selected);
  if (r?.ok) {
    log(`已重新绑定 · 代次 epoch=${r.epoch}`, '✓');
    log('⚠ 请在 MT5 中重启一次 EA（右键图表 → EA 交易 → 属性 / 或移除后重新拖入），让 EA 重新读取密钥。', '⚠');
    refresh();
  } else {
    log(`重新绑定失败：${r?.error || '未知错误'}`, '✗');
  }
};

// ---------- 一键停用（真闸门在主进程，这里只发意图并以返回值回显） ----------
// 历史 bug：这里只改 state.halted，主进程完全不知道，形成「界面说停了、命令照发」的假象。
$('haltBtn').onclick = async () => {
  const want = !state.halted;
  const r = await window.nn.setHalt(want);
  if (!r?.ok) return log(`停用开关失效：${r?.error || '未知错误'}`, '✗');
  state.halted = r.halted === true;          // 以主进程为准，不信任本地猜测
  paintHalt();
  log(state.halted
    ? '全局停用已生效（主进程闸门）：不再接受新的交易指令，已发出的命令仍会完成'
    : '已恢复运行（主进程闸门已解除）');
  render();
};

function paintHalt() {
  $('haltBtn').className = state.halted ? '' : 'off';
  $('haltBtn').textContent = state.halted ? '⛔ 已停用 · 点击恢复' : '运行中 · 点击停用';
  $('orderCard').classList.toggle('off', state.halted);
}

// ---------- 桥主动事件 ----------
window.nn.onEvent((msg) => {
  if (msg.type === 'receipt') {
    const map = {
      EXECUTED: ['b-exec', '已成交'], REJECTED: ['b-rej', '已拒绝'],
      EXPIRED: ['b-exp', '已过期'], RECONCILING: ['b-rec', '待核对'],
      ACCEPTED: ['b-sent', '已受理'],
    };
    const b = map[msg.stage] || ['b-sent', msg.stage];
    log(`回执 ${String(msg.id).slice(-10)} → <span class="badge ${b[0]}">${b[1]}</span> ${msg.message || ''}`, null, true);
  }
});

// ---------- 授权 ----------
let licOk = false;
async function refreshLicense() {
  const r = await window.nn.licenseStatus();
  const L = r?.license || {};
  licOk = !!L.ok;
  const bar = $('licBar');
  bar.classList.toggle('act', licOk);
  bar.classList.toggle('no', !licOk);
  $('licText').textContent = licOk
    ? `已激活 · ${L.name} · ${L.id} · 剩余 ${L.daysLeft} 天（${L.expires} 到期）`
    : `未激活 —— ${L.reason || '请输入授权密钥'}。未激活可以看行情、装 EA，但不能下单。`;
  $('licForm').style.display = licOk ? 'none' : 'flex';
  render();
}
$('licBtn').onclick = async () => {
  const key = $('licKey').value.trim();
  if (!key) return log('请先粘贴授权密钥', '⚠');
  const r = await window.nn.licenseActivate(key);
  if (r?.ok) {
    log(`授权已激活 · ${r.name} · ${r.id} · 剩余 ${r.daysLeft} 天`, '✓');
    $('licKey').value = '';
  } else {
    log(`激活失败：${r?.reason || '未知原因'}`, '✗');
  }
  await refreshLicense();
};
$('licKey').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('licBtn').click(); });

// ---------- AI 积分 ----------
// 没配服务地址就整条不显示；连不上才显示输入框；连上了才显示「充值」。
// 不放点了没反应的按钮 —— 要么能用，要么不存在。
async function refreshAI() {
  let st;
  try { st = await window.nn.aiStatus(); } catch { $('aiBar').style.display = 'none'; return; }
  if (!st || !st.enabled) { $('aiBar').style.display = 'none'; return; }
  $('aiBar').style.display = 'flex';
  $('aiBar').classList.toggle('act', !!st.connected);
  $('aiBar').classList.toggle('no', !st.connected);

  if (st.connected) {
    const cny = st.creditCny ? `（1 积分 ≈ ¥${st.creditCny}）` : '';
    $('aiText').textContent = `已连接 · 余额 ${st.credits} 积分${cny}`;
    $('aiForm').style.display = 'none';
    $('aiAct').style.display = 'flex';
    $('aiTopupBtn').disabled = !st.rechargeUrl;
  } else {
    $('aiText').textContent = st.error || '未连接 AI 服务（不影响交易功能）';
    $('aiForm').style.display = 'flex';
    $('aiAct').style.display = 'none';
  }
}
$('aiBtn').onclick = async () => {
  const t = $('aiToken').value.trim();
  if (!t) return log('请先粘贴 AI 服务令牌', '⚠');
  const r = await window.nn.aiConnect(t);
  if (r?.connected) { log(`AI 服务已连接 · 余额 ${r.credits} 积分`, '✓'); $('aiToken').value = ''; }
  else log(`AI 连接失败：${r?.error || '未知原因'}`, '✗');
  await refreshAI();
};
$('aiToken').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('aiBtn').click(); });
$('aiOffBtn').onclick = async () => { await window.nn.aiDisconnect(); log('已断开 AI 服务'); await refreshAI(); };
let rechargeUrlCache = null;
$('aiTopupBtn').onclick = async () => {
  const st = await window.nn.aiStatus();
  if (!st?.rechargeUrl) return log('充值服务未就绪，请稍后再试', '⚠');
  rechargeUrlCache = st.rechargeUrl;
  $('topupModal').classList.add('on');
};
$('topupGo').onclick = () => {
  $('topupModal').classList.remove('on');
  if (rechargeUrlCache) window.nn.openExternal(rechargeUrlCache);
};
$('topupCancel').onclick = () => $('topupModal').classList.remove('on');
$('topupModal').addEventListener('click', (e) => {
  if (e.target === $('topupModal')) $('topupModal').classList.remove('on');
});

// ---------- 手数确定性计算（AI 不碰数字，这里全由程序算） ----------
// 公式：手数 = (余额 × 风险%) ÷ (止损点数 × 每点价值)
// 每点价值 = tick_value ÷ tick_size × point（账户货币 / 每手）
function calcLots(balance, riskPct, slPoints, si) {
  if (!balance || !riskPct || !slPoints || !si) return null;
  const point = Number(si.point);
  const tickSize = Number(si.tick_size);
  const tickValue = Number(si.tick_value);
  if (!point || !tickSize || !tickValue) return null;
  const pointValue = (tickValue / tickSize) * point;   // 每点每手价值
  if (!pointValue || pointValue <= 0) return null;
  let lots = (Number(balance) * Number(riskPct) / 100) / (Number(slPoints) * pointValue);
  const step = Number(si.volume_step) || 0.01;
  const min = Number(si.volume_min) || 0.01;
  const max = Number(si.volume_max) || 1000;
  lots = Math.max(min, Math.min(max, Math.round(lots / step) * step));
  return Number(lots.toFixed(2));
}

// ---------- 策略广场 ----------
async function loadStrategyCatalog() {
  try {
    const r = await window.nn.getStrategyCatalog();
    if (!r?.ok || !r?.catalog) {
      $('stratGrid').innerHTML = '<div class="empty">策略资产库尚未生成（' + (r?.reason || r?.error || '未知') + '）</div>';
      $('stratStats').innerHTML = '';
      return;
    }
    state.catalog = r.catalog;
  } catch (e) {
    $('stratGrid').innerHTML = '<div class="empty">读取策略资产库失败：' + escapeHtml(e.message) + '</div>';
    return;
  }
  renderStrategy();
}

function renderStrategy() {
  const c = state.catalog;
  if (!c) return;
  const assets = c.assets || [];
  const counts = { candidate: 0, excluded: 0, deferred: 0 };
  assets.forEach((a) => { if (counts[a.disposition] !== undefined) counts[a.disposition]++; });

  // 顶部统计
  $('stratStats').innerHTML = `
    <div class="ss"><div class="n">${counts.candidate}</div><div class="l">候选（待审）</div></div>
    <div class="ss"><div class="n">${counts.deferred}</div><div class="l">暂缓</div></div>
    <div class="ss"><div class="n">${counts.excluded}</div><div class="l">排除</div></div>
    <div class="ss"><div class="n">3</div><div class="l">已实现模板</div></div>`;

  const list = assets.filter((a) => state.stratFilter === 'all' || a.disposition === state.stratFilter);
  $('stratGrid').innerHTML = list.length ? list.map(cardHtml).join('') : '<div class="empty">无匹配资产</div>';
}

function cardHtml(a) {
  const tag = a.disposition === 'candidate' ? ['cand', '候选'] :
    a.disposition === 'excluded' ? ['excl', '排除'] : ['defr', '暂缓'];
  const meta = [
    a.classification?.style || '',
    a.classification?.decision_mode === 'rule_based' ? '规则型' : (a.classification?.decision_mode || ''),
    a.classification?.risk_tier === 'unassessed' ? '风险未评' : (a.classification?.risk_tier || ''),
    a.classification?.direction || '',
  ].filter(Boolean);
  const foot = a.disposition === 'candidate'
    ? '待回测 · 未上架 · 绩效全空'
    : (a.disposition_reason || '');
  return `
    <div class="strat-card">
      <div class="sc-h"><b>${escapeHtml(a.name_zh || a.id)}</b><span class="sc-tag ${tag[0]}">${tag[1]}</span></div>
      <div class="sc-desc">${escapeHtml(a.disposition_reason || '')}</div>
      <div class="sc-meta">${meta.map((m) => `<span>${escapeHtml(m)}</span>`).join('')}</div>
      <div class="sc-foot">${escapeHtml(foot)}</div>
    </div>`;
}

$('stratFilter').addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  state.stratFilter = btn.dataset.f;
  document.querySelectorAll('#stratFilter button').forEach((b) => b.classList.toggle('on', b === btn));
  renderStrategy();
});

// ---------- AI 一键下单（建议卡 → 二次确认 → 桥接 EA） ----------
function currentSymbolInfo() {
  return state.snapshot?.status?.symbol_info || null;
}

function renderSuggestion(sug) {
  const box = $('suggestBox');
  if (!sug) { box.innerHTML = ''; return; }
  const st = state.snapshot?.status;
  const balance = st?.account?.balance;
  const si = currentSymbolInfo();
  const lots = calcLots(balance, sug.risk_pct, sug.sl_points, si);
  const hasSl = Number(sug.sl_points) > 0;
  const confMap = { high: ['high', '高'], mid: ['mid', '中'], low: ['low', '低'] };
  const conf = confMap[sug.confidence] || ['mid', sug.confidence || '中'];
  const riskAmt = lots != null ? fmt(lots * (Number(sug.sl_points) * ((Number(si?.tick_value) / Number(si?.tick_size)) * Number(si?.point)))) : null;

  box.innerHTML = `
    <div class="suggest-card">
      <div class="sg-head">
        <span class="sg-sym">${escapeHtml(sug.symbol)}</span>
        <span class="sg-side ${sug.side}">${sug.side === 'BUY' ? '买入 BUY' : '卖出 SELL'}</span>
        <span class="sg-conf ${conf[0]}">把握 ${conf[1]}</span>
      </div>
      <div class="sg-grid">
        <div><div class="k">入场</div><div class="v">${escapeHtml(sug.entry_ref || '市价')}</div></div>
        <div><div class="k">止损</div><div class="v">${hasSl ? Number(sug.sl_points) + ' 点' : '—'}</div></div>
        <div><div class="k">止盈</div><div class="v">${Number(sug.tp_points) > 0 ? Number(sug.tp_points) + ' 点' : '—'}</div></div>
        <div><div class="k">手数</div><div class="v">${lots != null ? lots : '—'}</div></div>
      </div>
      <div class="sg-reason">${escapeHtml(sug.reason || '')}</div>
      ${sug.data_note ? `<div class="sg-note">⚠ ${escapeHtml(sug.data_note)}</div>` : ''}
      <div class="sg-warn">${lots != null
        ? `手数由系统按「风险 ${sug.risk_pct}% × 余额 ÷ 止损距离」计算，本笔最多亏约 ${riskAmt} 账户货币。`
        : '无法计算手数：品种规格未就绪（EA 需重编译以回传 symbol_info）。手数栏留空，请手动核对。'}</div>
      <div class="sg-actions">
        <button class="dismiss" id="sugDismissBtn">忽略</button>
        <button class="order" id="sugOrderBtn" ${(!hasSl || lots == null) ? 'disabled' : ''}>
          ${hasSl ? '一键下单' : '无止损 · 不出按钮'}</button>
      </div>
    </div>`;

  $('sugDismissBtn').onclick = () => { box.innerHTML = ''; state.pendingSuggestion = null; };
  $('sugOrderBtn').onclick = () => {
    if (!hasSl || lots == null) return;
    openConfirm(sug, lots);
  };
}

// 演示入口：AI 网关未接模型时，用一条示范建议走通全链路，字段与真实 AI 输出同构
$('aiDemoBtn').onclick = () => {
  const st = state.snapshot?.status;
  if (!st) { log('请先在「终端与 EA」连接终端，再生成示例建议', '⚠'); return; }
  renderSuggestion({
    type: 'order_suggestion',
    symbol: st.symbol || 'EURUSD',
    side: 'BUY',
    entry_ref: '市价',
    sl_points: 400,
    tp_points: 800,
    risk_pct: 0.5,
    reason: '示例建议：仅用于演示「建议卡 → 一键下单 → 二次确认 → 回执」链路，非真实 AI 信号。',
    confidence: 'low',
    data_note: '演示数据，AI 模型尚未接入。',
  });
};

function openConfirm(sug, lots) {
  const st = state.snapshot?.status;
  state.pendingSuggestion = sug;
  state.pendingLots = lots;
  $('cfmTitle').textContent = `${sug.symbol} · ${sug.side === 'BUY' ? '买入' : '卖出'}`;
  $('cfmSymbol').textContent = sug.symbol;
  $('cfmSide').textContent = sug.side === 'BUY' ? '买入 BUY' : '卖出 SELL';
  $('cfmLots').textContent = lots != null ? `${lots} 手` : '—';
  $('cfmSl').textContent = Number(sug.sl_points) > 0 ? `${Number(sug.sl_points)} 点` : '—';
  $('cfmTp').textContent = Number(sug.tp_points) > 0 ? `${Number(sug.tp_points)} 点` : '—';
  $('cfmRisk').textContent = `${sug.risk_pct}%`;
  const warns = [];
  if (st?.account?.mode === 'netting') warns.push('净额账户：市价单会直接加减仓/反手。');
  if (!st?.trading_allowed) warns.push('终端当前禁止交易。');
  $('cfmWarn').textContent = warns.join(' ');
  $('confirmModal').classList.add('on');
}

$('cfmCancel').onclick = () => $('confirmModal').classList.remove('on');
$('confirmModal').addEventListener('click', (e) => {
  if (e.target === $('confirmModal')) $('confirmModal').classList.remove('on');
});

$('cfmGo').onclick = async () => {
  const sug = state.pendingSuggestion;
  const lots = state.pendingLots;
  $('confirmModal').classList.remove('on');
  if (!sug) return;
  if (state.halted) return log('已停用，拒绝下单', '⚠');
  if (!licOk) return log('未授权：请先激活授权密钥', '⚠');
  const st = state.snapshot?.status;
  if (!st) return log('未连接终端，无法下单', '⚠');
  if (lots == null) return log('手数无法计算，请检查品种规格', '⚠');

  const r = await window.nn.sendCommand({
    terminalPath: state.selected,
    type: 'ORDER_MARKET',
    account: st.account?.login,
    accountServer: state.snapshot?.heart?.server,
    epoch: state.snapshot?.heart?.epoch,   // 不 fallback 1：让桥进程填当前代次
    payload: {
      symbol: sug.symbol,
      side: sug.side,
      volume_lots: lots,
      sl_points: Number(sug.sl_points),
      tp_points: Number(sug.tp_points || 0),
      max_deviation_points: 20,
      comment: 'ai-suggestion',
    },
  });

  if (!r?.ok) return log(`下单失败：${r?.error}`, '⚠');
  state.lastCmd = r.id;
  log(`AI 建议下单已发送 ${r.id} · ${sug.symbol} ${sug.side} ${lots} 手`, '→');
  watchCommand(r.id);
  $('suggestBox').innerHTML = '';
  state.pendingSuggestion = null;
};

// ---------- 启动 ----------
(async function init() {
  const v = await window.nn.version();
  log(`牛牛 AI v${v} 已启动 · 协议 v1 · 模拟盘优先`);
  log('策略广场已上线（候选待回测）；AI 一键下单为链路演示模式，模型网关待接入。');
  go(prefs.page);                               // 回到上次离开的页面
  await refreshLicense();
  await refreshAI();
  loadStrategyCatalog();                        // 策略资产库（不阻塞启动）
  // 停用状态以主进程为准：上次按下「停用」后重启，界面必须还是停用，不能悄悄恢复
  try {
    const h = await window.nn.haltStatus();
    state.halted = h?.halted === true;
    paintHalt();
    if (state.halted) log('⚠ 上次已全局停用，本次启动沿用停用状态（主进程闸门生效中）', '⚠');
  } catch { /* 拿不到就按运行中处理 */ }
  await discover();
  setInterval(refresh, 1500);
  setInterval(refreshAI, 60000);      // 积分余额一分钟同步一次，够用也不吵
})();
