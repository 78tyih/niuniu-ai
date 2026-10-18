kimi version 2.1.1
• This is a big design task. I need to read the three required files first, plus the existing UI files. Let me start reading.

  Let me read the research files and UI files in parallel. They may be long.Now read the UI files: index.html and app.js. These are likely large. Let me read index.html (CSS variables + structure) and app.js. Let me check sizes first... Just read them; use max_chars up to 500000.    451 src/ui/index.html
    490 src/ui/app.js
    327 src/main.js
     33 src/preload.js
   1301 total
Now I have a full picture. Also should peek at main.js and preload.js briefly for IPC names (app:saveLog etc.). The context file mentions `app:saveLog`. Let me quickly grep main.js/preload.js for the IPC surface to be accurate.I have everything I need. Now I need to check the snapshot fields — from app.js render: snapshot.status.account {balance, equity, free_margin, login, mode}, status.symbol, status.quote {bid, ask}, status.trading_allowed, status.signed, status.positions [{ticket, symbol, type, volume, price_open, sl, profit}], snapshot.heart {server, epoch}, snapshot.eaLive. Good.

  Also ai-gateway exists in the repo — there might be config for news/calendar? Probably not needed; mark as `[推断]`/新增数据源.

  Now write the answer file. This is a big design document covering C1–C6. I should write it myself (I have all context) rather than delegating, since the design reasoning is the core work. The file will be long. Let me draft it carefully.

  Key requirements:

  C1: component library table: id / name / one-line purpose / data source (existing snapshot fields or new) / size S/M/L / necessary conditions (disable reason). Cover at least: 账户总览、净值/资金曲线、当前持仓、今日/本周盈亏、自选品种报价、快讯、AI 早间摘要、策略运行状态、风险敞口与回撤、待办/人工核对项、情绪/新闻. First two default components + rationale. Drag interaction: Pointer Events + ordered array + CSS transform conclusion. Empty/degraded states with concrete copy rules.

  C2: morning board auto-generation. Contents on first connect. AI vs deterministic per item. Degradation when AI unavailable. Chinese field-level sample with placeholders (绩效用「待填充」).

  C3: copilot chat + confirm card + model/deterministic split + audit timeline + AI can't-do list (≥6).

  C4: review viewer: timeline granularity, event type enum, filters, severity INFO/WARN/CRITICAL, export (structured vs app:saveLog plain text), triggers (polling interval considering local EA polling — EA snapshot every 1500ms in UI; mojo patrol min 10 min).

  C5: navigation: final 一级导航 list + per-page secondary structure.

  C6: visual values aligned to existing CSS vars + 2 HTML+CSS snippets (待确认卡片 in conversation, S-size board card), no inline onclick.

  Output: file + stdout condensed ≤350 lines + [推断] tags.

  The stdout condensed version is essentially my final message. Let me write the file first, then summarize.

  Let me draft the file content.

  Important details to respect:
  - CSP forbids inline script/onclick — snippets must use class + data attributes + addEventListener in app.js.
  - Existing vars: --brand/--brand-deep/--tint/--panel/--soft/--line/--line-strong/--ink/--muted/--faint/--up/--down/--shadow/--ease; dark base #0B1220/#141D2B/#101827. Also --accent, --ok, --amber, --danger exist. Card radius 14px, padding 18px 20px, border 1px var(--line). Font sizes: 10.5-16.
  - "不放点了没反应的东西" — AI unavailable → hide AI-dependent widgets entirely, or show with clear reason? The brief says "宁可不显示" per existing principle. So degradation: AI widgets hidden from board (not rendered), and a one-line notice where relevant.
  - 净值/资金曲线： needs history — snapshot doesn't provide history; needs new persistence (equity time series recorded locally). Mark 数据来源： 需新增（本地落盘 equity_history）。
  - 今日/本周盈亏： needs deal history — MT5 EA can provide via HistoryDeals; snapshot doesn't have it; needs new field (需新增： deals_today / deals_week, 由 EA 统计或桌面端按本地账本）。
  - 快讯 / 情绪 / 财经日历： need new data sources (AI 网关聚合或第三方日历 API). Mark [推断] and note disable conditions.
  - swap 隔夜： MT5 position has swap field; snapshot positions currently only ticket/symbol/type/volume/price_open/sl/profit — needs swap + commission added. Mark 需新增字段.

  Board layout: grid 12-col? Sizes S/M/L mapping to grid spans: S=1/3 (4col), M=1/2 (6col), L=full (12col) perhaps. Define grid: gap 16px (matches .card margin-bottom 16 and grid2 gap 16).

  Drag interaction: confirm Pointer Events + ordered array + CSS transform is right for a small grid (≤12 widgets), vs HTML5 drag API. Conclusion: keep the chosen scheme; justify (touch support, no native drag image artifacts, cancel/rollback via snapshot).

  Default first two widgets: 账户总览 + 当前持仓 [推断] rationale: always has data when EA connected (first-run has content), matches existing overview muscle memory; not scary. Actually "第一个组件应该怎么选（默认 2 个）" — default board ships with 账户总览 (S) + 当前持仓 (M/L)? Rationale: both sourced purely from existing snapshot fields → no new deps, works on day one; shows money state + exposure without AI.

  Morning board generation: deterministic program generates structure + numbers (positions overnight P&L change, swap sum, risk exposure computed by rules), AI generates 摘要文本 only (narrative), and only when connected. Field-level sample with placeholders like `{净值}` `待填充`.

  Who decides what, per item:
  - 隔夜持仓盈亏变动: 确定性程序（EA snapshot 对比昨收快照）
  - swap 汇总: 确定性程序（EA 持仓 swap 字段求和）
  - 昨晚行情回顾: 数据由确定性程序取（OHLC from EA/history），措辞由 AI（可选）
  - 今日财经日历: 数据源外部（新增），渲染确定性，解读 AI 可选
  - 风险敞口: 确定性程序计算
  - 待人工核对项: 确定性程序（RECONCILING 命令、授权临期、签名未启用、交易日历缺失等规则生成）
  - AI 早间摘要: AI（仅文字，不产数字，数字占位由程序注入）

  C3 confirm card ("指令卡" / "交易确认卡"): fields: 意图摘要、品种、方向、手数（用户可改）、止损/止盈（用户可改，必填）、预计占用保证金（程序算，只读）、可用余额校验结果（程序）、最小手数/VOLUME_STEP 校验（程序）、STOPS_LEVEL 距离校验（程序）、滑点上限、有效期、"确认后会自动执行吗" → 明确写：确认后立即发送一次命令，不会自动加仓/不会自动重复；卡片带命令预校验结果。留痕：事件枚举与现有 logBox 关系：logBox 保持原始调试日志；新增结构化审计事件流（JSONL 存主进程），UI 在 Review 页呈现，logBox 作为「原始日志」二级抽屉。

  AI can't do list ≥6:
  1. 未经确认卡「确认执行」点击，不得发出任何命令类型
  2. 不得计算报价/保证金/可用余额/手数换算/止损价落地（STOPS_LEVEL/VOLUME_STEP），只能引用程序校验结果
  3. 不得修改除「止损/止盈建议值」以外的风险参数（滑点、最大手数上限、停用开关）
  4. 不得对 RECONCILING 命令自动重试或发起反向单
  5. 不得平仓/修改他人 magic 的持仓（停止策略不平仓）
  6. 不得在用户未授权/licOk=false 时构造命令（UI 层不渲染确认按钮）
  7. 不得导出/上传账户号、服务器、持仓明细以外的内容到 AI 网关 [推断]（隐私边界）
  8. 不得绕过全局停用 halt

  C4: event enum: SIGNAL / PARAM_CHANGE / CMD_SENT / RECEIPT_EXEC / RECEIPT_REJ / RECEIPT_REC / RECEIPT_EXP / GUARD_BLOCK / ERROR / HUMAN / AI_MSG / LIFECYCLE (strategy start/stop). Severity INFO/WARN/CRITICAL: INFO 静默入流；WARN 侧边栏徽标计数；CRITICAL 打断（顶条/模态）：RECONCILING、签名失效、EA 掉线超过 N、保证金水位越线。Export: 建议新增结构化导出 JSON/CSV via new IPC app:exportAudit，保留 app:saveLog 纯文本。Triggers: EA snapshot 轮询 1.5s 已在；巡查节奏：本地 EA 轮询，看板刷新 1.5s 现状保留；风险规则检查每次 snapshot 到达即跑（本地、免费）；AI 巡查（需要花钱的）默认关闭/手动，最低 10 分钟间隔 [推断对齐 mojo]。

  C5 navigation: propose 6-7 items. Recommended:
  1. 看板 (Boards) — new home, DIY grid
  2. 交易 — 人工下单 + 票据 + 回执 (existing) 
  3. AI 副驾驶 — 对话 + 待确认卡 + 积分
  4. 策略 — 策略广场 + 我的策略运行状态（二级 tab）
  5. 记录 (Review) — 审计时间线 + 导出（二级：时间线/原始日志）
  6. 终端与 EA — 现有
  7. 设置 — 现有 + 看板/通知偏好下沉
  概览页被看板吸收 [推断]。Keep ≤7.

  C6 values: aligned with existing: radius: 卡 14px、组件内元素 9–11px、按钮 9–10px; spacing 8/12/16/18/20/26; font scale: 10.5 badge/h3-meta, 11.5 label/note, 12.5 table/secondary, 13 body/nav, 14 button primary, 15-16 KPI v, 17 modal h2; borders: 1px var(--line), emphasis var(--line-strong); colors via vars only. Two snippets: (a) 待确认卡 in chat; (b) S-size board card. Use existing class conventions (.card, .ticket-like), data-* attributes, JS binding sample comment? No inline onclick — show addEventListener snippet separately maybe as JS note. The requirement: "可直接进单文件 UI、用现有变量名、不用 inline onclick" — HTML+CSS fragments; JS hooking via class/data attributes delegated.

  Now write the file. It should be comprehensive but I shouldn't spend forever. Let me write it.

  Also sizes: S = 4 列（约 1/3 宽），M = 6 列，L = 12 列 on a 12-col grid, gap 16px. Min heights: S 120px etc. [推断] as design proposal — actually all design is proposal; mark [推断] where asserting behavior/preference, but design decisions themselves are the deliverable, not facts. The discipline says assertions outside fact base get [推断]. Design recommendations are proposals, not assertions of fact; but comparative claims (e.g., "users prefer...") need marking. I'll mark judgments.

  Let me now write the answer file. Aim for a well-structured doc. Then stdout condensed ≤350 lines — my final message with tables.

  Component table (C1):

  | id | 名称 | 用途 | 数据来源 | 尺寸 | 充要条件/禁用原因 |
  - w-account 账户总览： 余额/净值/可用保证金/账户模式/服务器。snapshot.status.account + heart.server。S/M。禁用：EA 未连接（显示「未连接 MT5」+ 去终端页按钮? 原则：不放没反应的——给的是跳转链接，有效）。
  - w-equity-curve 净值曲线： 需新增本地 equity 时序落盘（主进程每 snapshot 追加）。M/L。禁用：累计样本 < 2 个 → 显示「数据积累中」。
  - w-positions 当前持仓： snapshot.status.positions（建议 EA 增加 swap/commission 字段）。M/L。禁用：无 → 空表「暂无持仓」。
  - w-pnl-today 今日/本周盈亏： 需新增（EA HistoryDeals 统计或桌面端本地账本）。S/M。禁用：无历史权限/字段缺失 → 隐藏而非显示 0（五层账本原则：绝不用 0 填补）。
  - w-watchlist 自选品种报价： 需新增 quote 多品种订阅（snapshot 当前只有单 symbol quote）。S/M。禁用：未订阅/EA 未提供该品种 → 该品种行显示「—」并标注原因。
  - w-news 快讯： 需新增（AI 网关聚合，服务端数据源 [推断]）。M。禁用：AI 未连接 → 整个组件不显示。
  - w-morning AI 早间摘要： AI 网关 + 本地晨会数据包。M/L。禁用：AI 不可用 → 降级为纯程序化「晨会数据表」组件（w-brief-fallback）或不显示摘要文字段。
  - w-strategy 策略运行状态： 需新增（策略运行器存在后；当前无）。S/M。禁用：无运行中策略 → 空态「没有运行中的策略」+ 前往策略广场链接（策略广场开放前整条不显示）。
  - w-risk 风险敞口与回撤： 程序计算：margin_level、敞口按品种聚合、回撤（基于 equity 时序）。S/M。禁用：equity 时序不足 → 只显示保证金水位，回撤区块显示「样本不足」。
  - w-todo 待办/人工核对： 程序规则生成：RECONCILING 待核对、签名未启用、授权临期、交易日历缺失、净值样本不足等。S。永不隐藏（无事项时显示「全部已核对 ✓」）。
  - w-sentiment 情绪/新闻： 需新增外部数据源 [推断]（来源未定）。M。禁用：无数据源 → 不显示（避免放点了没反应的东西）。备注：与 w-news 合并风险，建议 v1 只做 w-news，情绪等数据源确定后再上 [推断]。

  Default 2: w-account(S) + w-positions(M)。理由： 数据全部来自现有 snapshot，首日可用；用户第一次打开看到的是「钱 + 风险敞口」而不是 AI 输出，不吓人 [推断]；与现有概览页心智一致。

  Drag: 结论：继续 Pointer Events + 有序数组 + transform。理由： ≤12 组件，不需要 DnD 库；HTML5 drag 原生拖动幻影不可控且触屏不支持；transform 方案可天然支持编辑态快照/取消回滚/网格吸附；单文件 UI 约束下零依赖。布局模型： 12 列网格 + 组件只占 S/M/L 三档宽度，按有序数组流式排布（CSS grid-auto-flow: dense），拖拽只改数组顺序 + 尺寸档位，不做自由坐标 —— 简单且永远不会乱 [推断]。

  Empty states 文案规则：
  - 规则 1：缺数据 ≠ 显示 0 或「—」堆砌；每个组件有明确缺省态文案 + 原因 + 下一步动作（动作必须可用，否则不给动作）。
  - 没连 MT5：「未连接 MT5 —— 到『终端与 EA』安装桥接 EA」。
  - 数据积累中：「样本积累中，预计 {n} 分钟后出图」。
  - 组件报错（渲染/字段异常）：卡片降级为错误态：「这个组件出错了 · 已记录到日志 · 点击移除」，绝不让异常穿透到整板 [推断]。
  - AI 不可用：AI 类组件整块不渲染；看板顶部一条可关闭提示「AI 未连接：摘要与快讯已隐藏」。

  C2 morning board:
  触发： 每天首次「EA 在线 + 有新一天交叉」时生成（本地日期变化检测）；关机没开机就没有——不补发 [推断]。
  内容表 with 谁算：
  1. 隔夜持仓变化 — 程序（昨收快照 vs 当前 snapshot 对比）
  2. 隔夜 swap 汇总 — 程序（需 EA 新增 positions[].swap）
  3. 账户夜变动（余额/净值 delta）— 程序
  4. 昨晚行情（各自选品种 OHLC/涨跌幅）— 程序取数；一句话解读 AI 可选
  5. 今日财经日历 — 外部数据源（新增）取数程序；解读 AI 可选
  6. 风险敞口 — 程序
  7. 待人工核对 — 程序规则
  8. AI 早间摘要（一段中文）— AI 写文字，数字全部以占位符由程序注入（AI 不产数字）[推断设计]

  AI 不可用降级： 晨会照常生成（它是程序的），摘要段落整块不显示；不放灰按钮。

  字段级样例 with placeholders and 「待填充」.

  C3 as planned above.

  确认卡命名： 「交易确认卡」（ConfirmCard）。字段： 标题=意图摘要（AI 一句话）、来源（对话原文引用）、品种/方向、手数 input（用户可改，默认 AI 建议）、止损/止盈 input（用户可改）、程序校验区（只读）： 预估占用保证金、可用余额充足性、VOLUME_STEP 取整后手数、STOPS_LEVEL 最小距离检查结果、滑点上限、命令类型、有效期。明确文案： 「确认后立即发送一次命令；不会自动加仓、不会自动重复、失败不会自动重试。」哪些字段必须用户改： 止损必填（AI 建议只是预填，用户不碰则高亮提示「止损未确认」？[推断]——更稳妥： 止损不能为空，预填值需用户点过或改过才算确认？ 简化： 确认按钮在手数/止损任一未经过用户聚焦确认时保持 disabled? 过重。结论： 手数与止损必须有值且通过程序校验即可确认，但卡片显著标注「请核对： 手数与止损」。[推断]）

  留痕粒度： 每事件一行 JSONL，字段 ts/level/type/actor(user|agent|system)/ref(commandId|cardId|strategyId)/summary/payload(脱敏）。与 logBox: 合并数据源，分级呈现 —— logBox 保持「原始日志」抽屉；Review 页是结构化视图。存储： 主进程 userData/audit-YYYYMMDD.jsonl，渲染层只读 [推断]。

  AI 不能做的事 8 条。

  C4:
  事件类型枚举： LIFECYCLE（策略启动/停止/暂停）、SIGNAL、PARAM_CHANGE、CMD_SENT、RECEIPT(EXECUTED/REJECTED/EXPIRED/RECONCILING 子状态）、GUARD_BLOCK（校验拦截）、ANOMALY（掉线/签名失效/保证金水位）、HUMAN（确认/修改/手动下单/停用）、AI_MSG（AI 输出摘要，引用级）、EXPORT。
  过滤器： 策略/时间/结果（成功/拒绝/待核对/拦截）/级别/只看异常开关。
  级别： INFO 只进时间线；WARN 时间线 + 侧边栏「记录」徽标计数；CRITICAL 打断： 顶部横幅 + 声音可选（默认关）+ 需手动关闭；CRITICAL 集： RECONCILING 新出现、签名失效、EA 掉线 >60s [推断]、保证金水位低于阈值、授权到期当日。
  导出： 建议新增 app:exportAudit（JSONL + CSV 两种），保留 app:saveLog 纯文本作为「原始日志导出」。理由： 审计需要结构化（可筛选/可给客服/可导入表格）[推断]。
  触发器/巡查频率： 两层。本地确定性巡查： 每次 snapshot（1.5s）即跑规则，零成本；UI 聚合刷新节流。AI 巡查（花积分）: 默认关，用户开则最低 10 分钟一次（对齐 mojo 下限），由用户在策略卡上选档 [推断]。

  C5 导航（最终推荐 7 项）:
  1. 看板 p-board —— 首页。二级： 看板画布 / 组件库抽屉（编辑态右侧滑出）。晨会以置顶卡形式出现，当天可折叠。
  2. 交易 p-trade —— 人工下单 | 持仓（二级 tab）；回执日志下沉为「原始日志」抽屉。
  3. AI 副驾驶 p-ai —— 对话（主） + 右侧栏： 待确认卡队列 / 积分与充值入口（二级）。
  4. 策略 p-strategy —— 二级 tab: 广场 | 我的策略（运行状态、停止/参数）。广场未开放前 tab 隐藏，只显示我的策略或占位。
  5. 记录 p-review —— 二级： 审计时间线 | 原始日志 | 导出。
  6. 终端与 EA p-terminal —— 现状不变。
  7. 设置 p-settings —— 增加二级分组： 外观 | 看板与布局 | 通知与告警 | 账户与授权（授权条从全局下沉？[推断]——不，授权条保持全局可见，设置里放管理）。

  概览页删除，被看板吸收。步骤条移入「终端与 EA」页顶部 [推断]。

  C6 数值表 + 2 snippets.

  Snippet A: 待确认卡 (chat confirm card). HTML:
  ```html
  <div class="cfm-card" data-card-id="{cardId}" data-state="pending">
    <div class="cfm-head">
      <span class="badge b-sent">待确认</span>
      <span class="cfm-title">买入 EURUSD 0.10 手 · 止损 250 点</span>
      <span class="cfm-src">来自对话：「帮我…」</span>
    </div>
    <div class="cfm-grid">
      <label>手数<input class="cfm-in" data-f="lots" type="number" step="0.01" min="0.01" value="0.10"></label>
      <label>止损（点）<input class="cfm-in" data-f="sl" type="number" step="10" min="0" value="250"></label>
      <label>止盈（点）<input class="cfm-in" data-f="tp" type="number" step="10" min="0" value="500"></label>
    </div>
    <div class="cfm-checks"> ... rows 只读校验: 预估保证金/可用余额/最小手数/STOPS_LEVEL
    </div>
    <div class="cfm-note">确认后立即发送一次命令：不会自动加仓、不会自动重复、结果未知时不会自动重试。</div>
    <div class="cfm-actions"><button class="ghost" data-act="cancel">取消</button><button class="primary" data-act="confirm" disabled>校验中…</button></div>
  </div>
  ```
  CSS uses vars. JS binding note: app.js 用事件委托 document.addEventListener('click', e => e.target.closest('[data-act]')).

  Snippet B: S-size board card:
  ```html
  <section class="bk bk-s" data-widget="w-account">
    <header class="bk-h"><span class="dot live"></span><h4>账户总览</h4><button class="bk-act" data-bk="edit" aria-label="组件设置">…</button></header>
    <div class="bk-body">
      <div class="bk-kpi"><span class="k">净值</span><b class="v">—</b></div>
      ...
    </div>
    <footer class="bk-f">数据来自 EA 快照 · 1.5s 刷新</footer>
  </section>
  ```

  Grid CSS: .board{display:grid;grid-template-columns:repeat(12,1fr);gap:16px} .bk-s{grid-column:span 4}.bk-m{span 6}.bk-l{span 12}.

  Numeric table:
  - 卡片圆角： 14px（沿用 .card）；组件内嵌块/票据 10–11px；按钮/输入 9–10px；徽标 5px（沿用 .badge）
  - 间距： 网格 gap 16px；卡内 padding 18/20；组件 S 卡 padding 14/16 [推断建议]; 段落间距 8/12
  - 字号层级： 10.5 徽标/表头/meta; 11.5 label/note; 12.5 表格/卡标题（12.5 h3）/正文次级； 13 正文/导航； 14 主按钮； 15–16 KPI; 17 弹窗标题； 组件大数字 16（沿用 .kv .v），L 卡可 20 [推断新增一档，仅看板 hero]
  - 描边： 1px var(--line)；分隔线 var(--line-strong)；聚焦 var(--accent)；错误描边 color-mix danger 45%
  - 阴影： 仅 var(--shadow)；弹窗 0 24px 64px rgba(0,0,0,.30)（沿用）
  - 深色底： --bg #0B1220 / --panel #141D2B / --soft #101827（已有，直接用变量，不写字面量）
  - 动效： .15s var(--ease) 交互； 页面 fade .18s; 拖拽位移 transform 120ms var(--ease)

  Now write the file. Also stdout condensed ≤350 lines. My final message should include: 组件表 + 晨会内容表 + AI 边界表 + 留痕事件枚举 + 导航结构 + 数值建议表. Keep under 350 lines.

  Let me write the answer file now. It'll be long (~400+ lines). Use Write.

• 三份材料都读完了，事实底座、现状、UI 源码（`index.html` 的 CSS 变量体系、`app.js` 的 snapshot 字段与命令链路、preload 白名单）都已核对。现在写答案文件。

• File written. Now the stdout condensed version ≤350 lines with the required tables.

• 已写入 `research/2026-10-18/answer-C-boards-copilot.md`（全文含 C1–C6 + 依赖清单）。以下为浓缩版。

  ## C1 · 看板组件表（12 列网格，S=4列 / M=6列 / L=12列，gap 16px）

  | id | 名称 | 数据来源 | 尺寸 | 充要条件（缺则禁用/隐藏） |
  |---|---|---|---|---|
  | w-account | 账户总览 | 现有 `status.account`+`heart.server` | S/M | EA 离线→「未连接 MT5，去装桥接 EA」（真跳转） |
  | w-positions | 当前持仓 | 现有 `status.positions`（建议补 swap） | M/L | 无持仓→「暂无持仓」 |
  | w-pnl | 今日/本周盈亏 | **需新增**（HistoryDeals/本地账本） | S/M | 取不到→**整块隐藏，绝不显示 0** |
  | w-equity | 净值曲线 | **需新增**（equity 时序落盘） | M/L | 样本<2→「样本积累中」 |
  | w-watchlist | 自选品种报价 | **需新增**（多品种 quote） | S/M | 单品种缺价→该行「—」+原因 |
  | w-risk | 风险敞口与回撤 | 程序算（account+positions+时序） | S/M | 时序不足→只显保证金水位 |
  | w-todo | 待办/人工核对 | 程序规则（RECONCILING/签名/临期） | S | **永不隐藏**，无事项显「全部已核对 ✓」 |
  | w-morning | AI 早间摘要 | AI 网关+晨会数据包 | M/L | AI 不可用→**整块不渲染** |
  | w-news | 快讯 | **需新增**（网关聚合）`[推断]` | M | 无源→不渲染 |
  | w-strategy | 策略运行状态 | **需新增**（策略运行器） | S/M | 策略体系上线前不进组件库 |
  | w-sentiment | 情绪 | 数据源未定 `[未知]` | — | **v1 不做**，并入 w-news 解读 `[推断]` |

  - **默认首屏 2 个**：`w-account`(S) + `w-positions`(M)。理由：数据全来自现有 snapshot，首日可用；内容是用户自己的钱与敞口而非 AI 结论，不吓人 `[推断]`；第三槽放「+ 添加组件」占位卡做教学。
  - **拖拽结论**：维持 Pointer Events + 有序数组 + CSS transform。理由：≤12 组件、三档宽度，HTML5 拖拽幻影不可控且无触屏；transform 天然支持编辑态快照/取消回滚/网格吸附；只改数组顺序不改自由坐标，板面永不会乱 `[推断]`。
  - **空态规则**：缺数据≠显 0 或堆「—」；每个禁用态=一句原因+一个真动作（动作不可用就不给）；组件报错降级为「这个组件出错了，已写入日志」+「移除组件」，不穿透整板；AI 不可用→AI 组件整块不渲染，板顶一条可关闭提示。

  ## C2 · 晨会内容表（AI vs 程序）

  | 区块 | 程序（确定性） | AI |
  |---|---|---|
  | 隔夜持仓变动 | 昨收快照对比，逐笔算 | ❌ |
  | 隔夜 swap | 求和（需 EA 补字段，缺则标「数据缺失」） | ❌ |
  | 账户夜变动 | 减法 | ❌ |
  | 昨晚行情 | 取数/计算 | 可选一句话解读（纯文字） |
  | 今日日历 | 取数渲染（需新数据源 `[未知]`） | 可选提示，**不产时间点** |
  | 风险敞口 | 全部 | ❌ |
  | 待人工核对 | 规则引擎 | ❌ |
  | 早间摘要 | **数字占位符注入**（AI 不产任何数字）`[推断]` | 只写措辞 ≤120 字 |

  - 触发：本地跨天 + EA 在线后首个 snapshot；当天没开机不补发 `[推断]`。
  - AI 不可用：晨会照常（它是程序的），摘要段整块不显示，不留灰框；日历无源显「日历数据源未配置」，不编事件。
  - 字段级样例（占位）：`{N} 笔持仓过夜 · 浮动盈亏 {隔夜浮盈}（昨收 {昨收净值} → {当前净值}）`、`swap 合计 {swap合计}`、`保证金水位 {margin_level}`、`⚠ {K} 项待核对`；绩效口径「待填充」（需净值时序积累）。全文有完整样例。

  ## C3 · AI 边界表

  **模型只做**：① NL→结构化意图 ② 理由/摘要措辞 ③ 知识问答（标「仅供参考」）④ 看板/盯盘提案（不生效）。
  **程序只做（模型绝不参与）**：报价（Bid/Ask 来自 snapshot，AI 文本里报价走占位注入）、保证金预估、可用余额五层校验（任一层缺失禁止确认，不用 0 填）、VOLUME_STEP 取整、STOPS_LEVEL 落地、命令构造/epoch/签名（走现有 7 类型白名单）、盯盘触发判定、RECONCILING 处置。
  **确认卡（交易确认卡）**：状态徽标+标题+对话来源引用｜AI 理由一句｜手数/止损/止盈/滑点（用户可改，止损必填）｜只读校验区（保证金/余额/VOLUME_STEP/STOPS_LEVEL 实时重算）｜固定文案「确认后立即发送一次命令：不自动加仓、不自动重复、结果未知不自动重试」｜确认键校验全过才可点，未授权/停用时不渲染。
  **AI 不能做的 8 条**：未确认不发命令；不算报价/保证金/余额/手数/止损价；不改止损以外风险参数；不对 RECONCILING 自动重试或反向单；不平仓不改仓（停止策略≠平仓）；未授权/停用时不渲染确认按钮；发往网关的 payload 主进程白名单过滤 `[推断]`；对话里的口头同意不构成确认 `[推断]`。
  **留痕**：JSONL（ts/level/type/actor/ref/summary/脱敏 payload）存主进程；logBox 合并为同一数据源的「原始文本视图」并下沉为二级抽屉；`app:saveLog` 保留。

  ## C4 · 留痕事件枚举与级别

  事件：`LIFECYCLE` / `SIGNAL` / `PARAM_CHANGE` / `CMD_SENT` / `RECEIPT`(EXECUTED/REJECTED/EXPIRED/RECONCILING) / `GUARD_BLOCK` / `ANOMALY` / `HUMAN` / `AI_MSG` / `EXPORT`。命令生命周期用同一 `ref` 串链。
  过滤器：策略·时间·结果（成功/拒绝/待核对/拦截）·级别·「只看异常」开关。
  级别：INFO 只进时间线；WARN 侧边栏「记录」计数徽标；CRITICAL（新 RECONCILING、签名失效、EA 掉线超时、保证金越线、授权当日到期）顶部横幅手动关闭，**不用模态**（模态只留给必须二选一的核对）`[推断]`。
  导出：保留 `app:saveLog` 纯文本；新增 `app:exportAudit`（JSONL+CSV，导出当前过滤结果，动作本身留痕）`[推断]`。
  巡查频率：本地规则每次 snapshot（1.5s）即跑，零成本；AI 巡查默认关，开启后**最低 10 分钟**一档（10/30/60 可选，对齐 mojo 下限，约束的是模型调用频率）`[推断]`。

  ## C5 · 导航（7 项）

  ① **看板**（新首页，吸收概览）：画布+晨会卡置顶｜编辑态右侧组件库抽屉
  ② **交易**：tab 下单｜持仓；logBox 下沉「原始日志」抽屉
  ③ **AI 副驾驶**：主列对话｜右栏待确认卡队列+积分充值
  ④ **策略**：tab 广场｜我的策略（广场未开放前 tab 隐藏）
  ⑤ **记录**（新）：tab 审计时间线｜原始日志｜导出；WARN 徽标挂此项
  ⑥ **终端与 EA**：不变，三步引导条迁入页顶
  ⑦ **设置**：外观｜看板与布局｜通知与告警
  授权/AI 状态条维持全局置顶不下沉。

  ## C6 · 数值建议表（全部沿用现有变量，不另起）

  | 项 | 值 |
  |---|---|
  | 圆角 | 卡 14px / 嵌块 10–11px / 按钮输入 9–10px / 徽标 5px |
  | 间距 | 网格 gap 16px；卡 padding 18/20（S 卡 14/16 `[推断]`） |
  | 字号 | 10.5 徽标 → 11.5 note → 12.5 卡标题/表格 → 13 正文 → 14 主按钮 → 16 KPI → 17 弹窗标题；晨会头数字 20 仅此一档 `[推断]` |
  | 描边 | 1px `--line`；分隔 `--line-strong`；聚焦 `--accent`；错误 color-mix danger 45% |
  | 阴影 | 仅 `--shadow`；弹窗 0 24px 64px rgba(0,0,0,.30) |
  | 深底 | 只写 `--bg/--panel/--soft` 变量（#0B1220/#141D2B/#101827 由 `[data-theme=dark]` 接管） |
  | 涨跌 | `--up` 红涨 / `--down` 绿跌，沿用 `.buy/.sell` |
  | 动效 | .15s / 拖拽位移 120ms，统一 `var(--ease)` |

  两个片段（**对话内待确认卡** + **S 尺寸看板卡**，HTML+CSS 完整代码在文件 C6.2/C6.3）：只用现有变量名；动作走 `data-act`/`data-bk`/`data-f`/`data-k` 属性 + app.js 事件委托，无 inline onclick，满足现有 CSP（`script-src 'self'`）。

  **主要新增依赖**（排期用）：持仓补 swap 字段、多品种报价、equity 时序落盘、历史盈亏统计、日历/快讯数据源 `[未知]`、审计 JSONL + `exportAudit` IPC、AI 网关对话接口。

To resume this session: kimi -r session_f41dc524-2209-4ac6-8661-031a94fc9894
