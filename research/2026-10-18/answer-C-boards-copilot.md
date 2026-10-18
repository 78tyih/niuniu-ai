# K3-C 答案 · DIY 看板 + AI 副驾驶 UIUX（对标 mojo.trade）

> 日期：2026-10-18
> 事实底座：`00-FACTS.md`（第二节 mojo）、`01-CONTEXT.md`（牛牛AI 现状）。
> 纪律：事实底座之外的断言一律打 `[推断]`；不编造精确数字；定性用 High/Medium/Low。
> 现有代码引用均为本仓库真实文件：`src/ui/index.html`、`src/ui/app.js`、`src/preload.js`、`src/main.js`。

---

## C1 · DIY 看板组件库（MT5 场景版）

### 1.1 布局模型（先定这个，组件表里的「尺寸」才有意义）

- 看板画布 = **12 列网格**，`gap:16px`（沿用 `.card` 的 16px 节奏）。
- 组件宽度只有三档：**S = span 4（1/3）、M = span 6（1/2）、L = span 12（整行）**。不做自由坐标、不做任意缩放 —— 组件按**有序数组**流式排布（`grid-auto-flow:dense`），用户只改「顺序 + 尺寸档」，板面永远不会乱 `[推断]`。
- 组件高度由内容自适应，S 卡设 `min-height:120px` 占位 `[推断]`。

### 1.2 组件清单

「数据来源」列对照的是现有 snapshot 字段（`app.js render()` 里实际用到的：`status.account{balance,equity,free_margin,login,mode}`、`status.symbol`、`status.quote{bid,ask}`、`status.trading_allowed`、`status.signed`、`status.positions[{ticket,symbol,type,volume,price_open,sl,profit}]`、`heart{server,epoch}`、`eaLive`）。凡写「需新增」的，表示现有 snapshot 没有，要 EA 或主进程补字段。

| id | 名称 | 一句话用途 | 数据来源 | 尺寸 | 充要条件（缺什么就禁用，显示什么） |
|---|---|---|---|---|---|
| `w-account` | 账户总览 | 余额/净值/可用保证金/账户模式/服务器一眼看完 | 现有：`status.account` + `heart.server` + `eaLive` | S/M | EA 离线 → 禁用态：「未连接 MT5 —— 到『终端与 EA』装桥接 EA」（链接可点，是真跳转） |
| `w-positions` | 当前持仓 | 持仓表 + 单笔盈亏 + 快捷平仓入口 | 现有：`status.positions`（建议 EA 补 `swap`/`commission` 字段） | M/L | 无持仓 → 「暂无持仓」；EA 离线 → 禁用态同上 |
| `w-pnl` | 今日/本周盈亏 | 当日与本周已实现+浮动盈亏 | **需新增**：EA 侧 `HistoryDeals` 统计或桌面端本地账本 | S/M | 历史权限缺失/字段缺失 → **整块隐藏，绝不显示 0**（五层账本原则：缺失不补 0） |
| `w-equity` | 净值曲线 | 净值时序迷你图（sparkline） | **需新增**：主进程把每次 snapshot 的 equity 落盘成时序 | M/L | 样本 < 2 个 → 「样本积累中」；绝不画假线 |
| `w-watchlist` | 自选品种报价 | 用户自选 N 个品种的 Bid/Ask/涨跌 | **需新增**：多品种 quote（现有 snapshot 只有单 symbol 报价） | S/M | 某品种取不到价 → 该行显示「—」+ 原因；全部取不到 → 禁用态 |
| `w-risk` | 风险敞口与回撤 | 保证金水位、按品种聚合的敞口、当前回撤 | 程序计算：`account` + `positions` + equity 时序（回撤依赖 `w-equity` 的数据） | S/M | equity 时序不足 → 只显示保证金水位，回撤区显示「样本不足」 |
| `w-todo` | 待办 / 人工核对 | RECONCILING 待核对、签名未启用、授权临期等 | 程序规则生成（现有事件 + 授权状态 + snapshot） | S | **永不隐藏**；无事项时显示「全部已核对 ✓」 |
| `w-morning` | AI 早间摘要 | 一段中文晨会摘要（数字由程序注入） | AI 网关 + 本地晨会数据包（见 C2） | M/L | AI 未连接/积分不足 → **整块不渲染**（不放点了没反应的东西） |
| `w-news` | 快讯 | 重点财经快讯流 | **需新增**：服务端聚合数据源（走 AI 网关）[推断] | M | 无数据源/AI 未连接 → 不渲染 |
| `w-strategy` | 策略运行状态 | 每个运行中策略的状态/今日盈亏/停止按钮 | **需新增**：策略运行器（当前不存在，策略广场是占位页） | S/M | 无运行中策略 → 「没有运行中的策略」；策略体系上线前**该组件不进组件库** |
| `w-sentiment` | 情绪/新闻解读 | 对新闻的情绪倾向标注 | **需新增**：外部数据源，来源未定 `[未知]` | M | 数据源未确定 → **v1 不做** [推断] |

说明（增删理由）：
- **删掉独立的「情绪」组件** [推断]：数据源未定，先做会被迫放假数据或放空卡片，违反「不放没反应的东西」。情绪能力并入 `w-news` 的 AI 解读（数据源确定后再拆）。
- **`w-strategy` 进清单但不上架**：策略运行器不存在时，组件库不显示它，避免占位按钮。
- `w-todo` 是唯一「永不隐藏」的组件：它本身就是「缺数据/待核对」的收容所， mojo 的 Review 叙事里「待人工处理」必须始终有地方落地 `[推断]`。

### 1.3 默认首屏：2 个组件怎么选

**默认：`w-account`（S）+ `w-positions`（M），并排第一行。**

理由：
1. 数据 100% 来自现有 snapshot，**第一天就能用**，不依赖任何「需新增」字段 —— 用户第一次打开就有东西看。
2. 内容是「我的钱 + 我的敞口」，是用户自己的数据而不是 AI 的输出 —— 有信息量但**不吓人**（mojo 访谈：用户要「自己拿主意的感觉」，首屏放 AI 结论等于先替他拿主意 `[推断]`）。
3. 与现有「概览」页心智一致，老用户零迁移成本。
4. 第三个槽位（第一行剩余 1/3）放**空位占位卡「+ 添加组件」**，直接教学「这板子是自己搭的」`[推断]`。

### 1.4 拖拽与编辑：结论

**继续用已定方案：Pointer Events + 有序数组 + CSS transform。不简化成 HTML5 Drag API，也不上 DnD 库。**

- HTML5 原生拖拽：拖动幻影样式不可控、触屏不支持、跨网格吸附要自己再算一遍 —— 对我们没有省事 `[推断]`。
- Pointer Events 方案天然支持三件事，全部是我们已定的需求：
  - **编辑态快照**：进入编辑态时深拷贝有序数组；**取消 = 丢弃副本**，确认 = 提交副本 + 持久化到主进程（沿用 `prefs` 的白名单持久化思路，新增 `board` 键 `[推断]`）。
  - **网格吸附**：拖拽只改数组下标，`transform: translate()` 做位移动画（120ms `var(--ease)`），松手后重排，布局永远合法。
  - 组件 ≤ 12 个、宽度只有三档，计算量是玩具级的，不需要库。
- 非编辑态组件**不可拖**（mojo 式「看的时候就是看」）；长按或点「编辑看板」才进编辑态，组件抖动/描边提示可拖 `[推断]`。

### 1.5 空状态与降级：文案规则（具体到文案）

统一规则：**缺数据 ≠ 显示 0，≠ 堆「—」**。每个禁用态 = 一句原因 + 一个真动作（动作不可用就不给动作）。

| 场景 | 卡片显示 | 文案 |
|---|---|---|
| 未连 MT5（EA 离线） | 禁用态，虚线描边 | 「未连接 MT5。到『终端与 EA』安装桥接 EA 后这里就有数据了。」+ 按钮「去连接」（真跳转） |
| 数据积累中（时序样本不足） | 占位态 | 「样本积累中，约 {n} 分钟后出图。当前净值：{equity}」（给得出当前值就给） |
| 字段权限缺失（如历史盈亏取不到） | 不渲染该组件；`w-todo` 加一条 | 「今日盈亏组件已隐藏：EA 未提供历史成交统计。」 |
| 组件渲染报错 | 错误态卡片（不穿透整板） | 「这个组件出错了，已写入日志。」+ 按钮「移除组件」 |
| AI 不可用（未连网关/积分不足） | AI 类组件**整块不渲染**；板顶一条可关闭提示 | 「AI 未连接：早间摘要与快讯已隐藏。连接后自动出现。」（提示可关，不反复弹） |
| 策略体系未上线 | 组件库不显示 `w-strategy` | ——（用户根本看不到它） |

---

## C2 · 「早间看板」自动生成（MT5 版自动晨会）

### 2.1 触发与形态

- 触发：**本地日期跨天 + EA 在线后的第一个 snapshot** 时生成「晨会卡」，置顶于看板第一行（L 尺寸），当天可折叠，折叠状态记入偏好。
- 当天没开机/没连 MT5 → **不补发**（晨会是「今天第一次看到你」的仪式，不是历史报表）[推断]。
- 形态：**程序生成的数据表为主体，AI 摘要为可选的顶部一段**。有没有 AI，晨会都在 —— 这符合 mojo「08:00 看板已经在那里了」的叙事：在的是**看板**，不是 AI 的废话 `[推断]`。

### 2.2 晨会内容 × 「谁定什么」边界（逐条）

| 晨会区块 | 内容 | 确定性程序负责 | AI 负责 |
|---|---|---|---|
| 隔夜持仓 | 昨收快照 vs 当前：每笔持仓的浮盈变化、SL/TP 是否被改动 | 快照对比、逐笔计算（需主进程落盘「昨收快照」） | ❌ 不参与 |
| 隔夜 swap | 持仓隔夜利息合计 | 求和（**需 EA 补 `positions[].swap` 字段**）；字段缺失则该区块标「数据缺失」不显示数字 | ❌ |
| 账户夜变动 | 余额/净值较昨收的增减 | 减法 | ❌ |
| 昨晚行情 | 自选品种隔夜 OHLC、涨跌幅 | 取数与计算（需多品种行情，同 `w-watchlist` 依赖） | 可选：一句话解读（纯文字） |
| 今日财经日历 | 今日高重要性事件与时间 | 从数据源取数、按时间渲染（**需新增日历数据源** `[未知]`） | 可选：「今天哪个时段别重仓」式提示（纯文字，**不产时间点**） |
| 风险敞口 | 当前保证金水位、按品种/币种聚合的敞口、距平仓线的余量 | 全部（复用 `w-risk` 的计算） | ❌ |
| 待人工核对 | RECONCILING 命令、签名失效、授权临期、止损缺失的持仓 | 规则引擎生成条目 | ❌ |
| AI 早间摘要 | 一段 ≤120 字的中文摘要 | **数字占位符注入**：AI 输出的 `{净值变动}` `{敞口}` 等占位由程序替换为真实值后渲染 —— **AI 不产出任何数字** [推断] | 只写措辞 |

设计要点：摘要里的数字必须**可追溯**。渲染时对每个被注入的数字挂 `data-src`（指向晨会数据包字段），悬停显示来源 —— mojo「See everything it does」在文本层的对应物 `[推断]`。

### 2.3 AI 不可用时的降级

遵循现有原则（`app.js`：没配服务地址整条 AI 状态栏不显示）：

- 晨会卡**照常生成**（它是程序的）；「AI 早间摘要」段落**整块不渲染**，不留灰框、不留「敬请期待」。
- 降级后晨会卡顶部不显示任何 AI 相关提示；只在看板级放那条可关闭的「AI 未连接：摘要与快讯已隐藏」。
- 财经日历若无数据源：该区块显示「日历数据源未配置」，**不编日期、不编事件**。

### 2.4 字段级样例（当天第一次看到的内容；占位值，绩效一律「待填充」）

```
晨会 · {YYYY-MM-DD}（周{几}）                                    [折叠]

┌ 隔夜持仓 ────────────────────────────────────────────────
│ {N} 笔持仓过夜 · 浮动盈亏合计 {隔夜浮盈}（昨收 {昨收净值} → 现在 {当前净值}）
│ · #{ticket} {symbol} {方向} {手数} 手 · 浮盈 {盈亏} · swap {swap} · 止损 {有/缺失⚠}
├ 隔夜利息 ────────────────────────────────────────────────
│ swap 合计 {swap合计}（{N} 笔）        ※字段缺失时显示「数据缺失」
├ 昨晚行情 ────────────────────────────────────────────────
│ {symbol1} {涨跌幅} · {symbol2} {涨跌幅} · …（自选品种）
│ AI 解读：{一句话，纯文字；AI 不可用时此行不存在}
├ 今日日历 ────────────────────────────────────────────────
│ {HH:mm} {事件名}（重要性 {高/中}）…  ※无数据源时：「日历数据源未配置」
├ 风险敞口 ────────────────────────────────────────────────
│ 保证金水位 {margin_level} · 敞口集中在 {品种/币种} · 当前回撤 {回撤或「样本不足」}
├ 待人工核对 ──────────────────────────────────────────────
│ ⚠ {K} 项：命令 {id后10位} 结果未知待核对 / {ticket} 无止损 / 授权 {n} 天后到期
└ AI 早间摘要（AI 不可用时整段不显示）──────────────────────
  「{AI 措辞，其中数字由程序注入}」
  绩效口径：本卡不展示收益率，累计绩效「待填充」（需净值时序积累）。
```

---

## C3 · AI 副驾驶：对话 + 执行留痕

### 3.1 对话窗口：能问什么

对话页 = 左侧消息流 + 右侧「待确认卡队列」栏。用户可以：

- **问状态**：「我现在什么敞口」「今天亏了多少」→ 程序取数，AI 只负责措辞（数字注入，同晨会机制）。
- **问知识**：「净额账户反手会怎样」→ 纯 AI 回答，标注「仅供参考」。
- **表达交易意图**：「帮我买 0.1 手 EURUSD，止损 250 点」→ **不直接执行**，转成一张「交易确认卡」进右侧队列 + 消息流里同步一张卡。
- **搭看板**：「给我做一个早间看板」→ 生成看板方案（组件+尺寸的列表），用户点「应用」才改板（预览态，可取消）。
- **设盯盘**：「金价破 {价位} 提醒我」→ 生成「盯盘卡」（同确认卡机制：用户确认后才生效；触发判定由程序做，AI 不参与判定）[推断]。

问出交易意图时的转换规则：AI 只产出**结构化意图**（品种/方向/手数建议/止损建议/理由一句话），随后整条链路交给程序（3.3）。

### 3.2 那张卡：交易确认卡（ConfirmCard）

命名：**交易确认卡**。展示字段：

| 区块 | 字段 | 谁填 | 用户能改吗 |
|---|---|---|---|
| 头部 | 状态徽标（待确认/已发送/已成交/已拒绝/待核对/已取消）、一句话标题（「买入 EURUSD 0.10 手」）、来源引用（对话原文） | 程序 | — |
| 意图 | AI 的理由一句话 | AI（纯文字） | — |
| 参数 | **手数、止损、止盈、滑点上限** | AI 预填建议值 | **必须可改**；止损不能为空（用户定「什么条件止盈止损」） |
| 校验区（只读） | 预估占用保证金、可用余额是否足够、VOLUME_STEP 取整后的实际手数、STOPS_LEVEL 最小距离检查结果、账户/服务器/品种 | **确定性程序**，随用户改参数实时重算 | 只读 |
| 执行说明 | 固定文案：「确认后立即发送一次命令。不会自动加仓、不会自动重复、结果未知时不会自动重试。」 | 程序 | — |
| 动作 | 「确认执行」（校验全过才可点）/「取消」 | — | 用户 |

「会自动执行吗」写在哪：**校验区正下方的固定说明行**（snippet 见 C6-A），外加未授权/停用状态下确认按钮直接不渲染（不是禁用，是不存在 —— 同现有 `aiBar` 原则）。

### 3.3 模型 vs 确定性程序（逐条）

**模型（AI）只做：**
1. 把自然语言解析成结构化意图（品种/方向/手数建议/止损建议）。
2. 写确认卡上的「理由一句话」和晨会摘要措辞。
3. 回答知识性问题（带「仅供参考」标注）。
4. 提议看板组件组合、盯盘条件（提案，不生效）。

**确定性程序只做（模型绝不参与）：**
1. **报价**：Bid/Ask 一律来自 EA snapshot，AI 输出里出现的报价必须是程序注入的占位符。
2. **保证金**：预估占用保证金由程序按券商规格算。
3. **可用余额校验**：余额够不够、其他占用（对齐 mojo 五层账本：余额/挂单占用/其他策略占用/保证金水位/净值 —— 任一层缺失就**不允许确认**，不用 0 填补）。
4. **手数换算与取整**：VOLUME_STEP / VOLUME_MIN / VOLUME_MAX 校验，取整结果展示给用户。
5. **止损价落地**：STOPS_LEVEL 最小距离、 freeze level 检查；sl_points → 具体价格的换算在 EA/程序侧。
6. **命令构造与发送**：类型白名单（沿用现有 7 种）、`terminalPath` 校验、epoch 代次、签名 —— 全部走现有主进程链路，AI 的产物到不了 `sendCommand`。
7. **盯盘触发判定**：条件比对在本地程序循环里跑（每次 snapshot 即判定），AI 只收到「已触发」的事实通知 `[推断]`。
8. **RECONCILING 处置**：禁止自动重放，只能人工核对（现有逻辑，AI 无权触碰）。

### 3.4 留痕时间线

- 粒度：**每个动作一条结构化事件**（JSONL），字段：`ts / level / type / actor(user|agent|system) / ref(commandId|cardId|strategyId) / summary / payload(脱敏)`。
- 存储：主进程 `userData/audit-YYYYMMDD.jsonl`（渲染层只读，走 preload 白名单新增方法）[推断]。
- 与现有 `logBox` 的关系：**合并数据源、分级呈现**——
  - 结构化审计流是唯一事实源；`logBox` 降级为它的「原始文本视图」。
  - 交易页现状的 logBox 保留，但收进**二级抽屉**「原始日志」（复杂内容下沉）；Review 页呈现结构化时间线（见 C4）。
  - 现有 `app:saveLog`（纯文本导出）保留，导出的就是这个原始视图。

### 3.5 「AI 不能做的事」清单（8 条）

1. **不能在用户没点「确认执行」时发出任何命令**——AI 无法调用 `sendCommand`，确认卡是命令的唯一入口（策略自动单走策略卡，同样要批）。
2. **不能计算报价、保证金、可用余额、手数换算、止损价落地**（STOPS_LEVEL / VOLUME_STEP）——只能引用程序校验结果。
3. **不能修改止损/止盈建议值以外的任何风险参数**：滑点上限默认值、单笔手数上限、全局停用开关，AI 碰不到。
4. **不能对结果未知（RECONCILING）的命令自动重试，也不能自动发反向单/补仓**。
5. **不能平仓或修改持仓**——停止策略/Agent 不平仓（mojo 原则 + 事实底座 5.7），已有仓位只能由用户显式处置。
6. **不能在未授权（licOk=false）或全局停用状态下构造确认卡的动作按钮**——UI 直接不渲染。
7. **不能把账户号、服务器、持仓明细之外的信息发送到 AI 网关**；发送前 payload 经主进程白名单过滤 `[推断]`。
8. **不能替用户「确认」**：对话里出现「好的你帮我确认吧」也不构成确认——确认只能是确认卡上的实体点击 `[推断]`。

---

## C4 · Review 与「回所属」查看器

### 4.1 事件类型枚举

| type | 含义 | 默认级别 |
|---|---|---|
| `LIFECYCLE` | 策略/盯盘 启动·暂停·停止 | INFO |
| `SIGNAL` | 信号/盯盘条件触发（含触发时的快照摘要） | INFO |
| `PARAM_CHANGE` | 参数变更（谁改的、旧值→新值） | WARN |
| `CMD_SENT` | 命令已发送（关联确认卡 id） | INFO |
| `RECEIPT` | 回执：EXECUTED / REJECTED / EXPIRED / RECONCILING（子状态入 payload） | 成交 INFO；拒绝/过期 WARN；**待核对 CRITICAL** |
| `GUARD_BLOCK` | 校验拦截（未授权/停用/五层账本缺层/STOPS_LEVEL 不过） | WARN |
| `ANOMALY` | EA 掉线、签名失效、保证金水位越线、净值异常跳变 | WARN；**掉线超时/签名失效 CRITICAL** |
| `HUMAN` | 人工确认、手动下单、手动平仓、全局停用/恢复 | INFO |
| `AI_MSG` | AI 输出留痕（摘要/建议，存引用不存全文）[推断] | INFO |
| `EXPORT` | 导出动作本身也留痕 | INFO |

粒度：一条事件 = 一次状态迁移；命令的生命周期用同一 `ref` 串起来（SENT → RECEIPT），时间线上可展开看链路。

### 4.2 过滤器

顶栏一排：策略/Agent 选择 · 时间范围（今天/本周/自定义）· 结果（成功/拒绝/待核对/被拦截）· 级别 · **「只看异常」开关**（= WARN+CRITICAL + RECEIPT.RECONCILING，一键进入「出了什么事」视图）。

### 4.3 严重级别展示

| 级别 | 展示 | 打断用户？ |
|---|---|---|
| INFO | 只进时间线 | 不打断 |
| WARN | 时间线 + 侧边栏「记录」导航项上挂计数徽标（ amber ） | 不打断，等用户自己看 |
| CRITICAL | 顶部横幅（危险色描边，手动才能关）+ 时间线置顶 + 记录页红标 | **打断**，但不用模态（模态只留给「命令结果未知，需要人工核对后二选一」这种必须做决定的场景）[推断] |

CRITICAL 集合（初版）：新出现 RECONCILING、EA 签名失效、EA 掉线超阈值、保证金水位跌破用户设定线、授权当日到期。

### 4.4 导出

**建议新增结构化导出，保留现有纯文本导出，两者并存：**
- 现有 `app:saveLog`（纯文本）→ 改名语义为「导出原始日志」，不动。
- 新增 `app:exportAudit`（preload 白名单加方法）：导出**当前过滤器命中的**时间线，格式 JSONL（机器用）与 CSV（Excel 用）二选一。理由：审计的价值在可筛选、可转交（给客服/给自己复盘），纯文本做不到 `[推断]`。导出动作本身写一条 `EXPORT` 事件。

### 4.5 触发器：多久巡一次

分两层，花钱的和不花钱的分开：

| 层 | 频率 | 说明 |
|---|---|---|
| 本地确定性巡查 | **每次 snapshot 到达即跑**（现状 1.5s 一轮） | 规则判定零成本：RECONCILING 出现、签名失效、保证金水位、盯盘条件，全部本地算。UI 侧做节流聚合，避免刷屏 |
| AI 巡查（耗积分） | **默认关**；用户开启后**最低 10 分钟一次**（对齐 mojo 定时巡查下限），档位 10/30/60 分钟在策略卡/盯盘卡上选 | EA 是本机轮询，不存在服务端推送成本，所以本地层不需要 10 分钟下限；10 分钟下限约束的是**模型调用频率**（mojo 内测吐槽「太爱讲话」——少而准）`[推断]` |

---

## C5 · 页面层级：最终推荐导航

原则：简洁、多层级、复杂内容下沉。一级导航从 6 项变 **7 项**（新增「看板」「记录」，删掉「概览」——被看板吸收）。

```
侧边栏（一级）                页面内二级结构
─────────────────────────────────────────────────────
① 看板  p-board              · 看板画布（晨会卡置顶，可折叠）
   （新首页，默认落地页）       · 「编辑看板」→ 编辑态：右侧滑出组件库抽屉
                             · 空位占位卡「+ 添加组件」
② 交易  p-trade              · 二级 tab：下单（表单+票据，现状）｜持仓（含快捷平仓）
                             · 「原始日志」收进二级抽屉（logBox 下沉）
③ AI 副驾驶  p-ai            · 主列：对话消息流
                             · 右栏：待确认卡队列（二级）｜积分与充值（现状入口下沉至此）
                             · AI 未连接时：对话区显示连接引导（令牌输入），无失效按钮
④ 策略  p-strategy           · 二级 tab：广场｜我的策略（运行状态/参数/停止）
                             · 广场未开放前该 tab 隐藏（现状占位文案保留在「广场」）
⑤ 记录  p-review  （新）     · 二级 tab：审计时间线（C4）｜原始日志｜导出
                             · WARN 徽标挂在该导航项上
⑥ 终端与 EA  p-terminal      · 现状不变；概览页的三步引导条迁入本页顶部
⑦ 设置  p-settings           · 二级分组：外观（现状）｜看板与布局（重置看板/网格密度）
                               ｜通知与告警（CRITICAL 阈值、声音开关）
```

被收起来的内容：logBox 原始日志（→抽屉）、充值（→AI 页右栏）、步骤条（→终端页）、外观（→设置，现状已如此）。授权状态条与 AI 状态条维持**全局置顶**不变（安全状态不该下沉）。

---

## C6 · 视觉与组件骨架（对齐现有变量体系）

### 6.1 数值表（全部沿用 `index.html` 现有变量与刻度，不另起一套）

| 项 | 值 | 出处/说明 |
|---|---|---|
| 卡片圆角 | 14px | 沿用 `.card` |
| 卡内嵌块（票据/校验区/日志）圆角 | 10–11px | 沿用 `.ticket` 11px / `.log` 11px |
| 按钮/输入圆角 | 9–10px | 沿用 `input` 9px、`button.primary` 10px |
| 徽标圆角 | 5px | 沿用 `.badge` |
| 看板网格 gap | 16px | 沿用 `.grid2` 的 16px |
| 卡片 padding | 18px 20px（看板 S 卡可收紧到 14px 16px）`[推断]` | 沿用 `.card` |
| 描边 | 1px `var(--line)`；分隔线 `var(--line-strong)`；聚焦 `var(--accent)`；错误 `color-mix(in srgb,var(--danger) 45%,var(--line))` | 全部现有 |
| 阴影 | 仅 `var(--shadow)`；弹窗 `0 24px 64px rgba(0,0,0,.30)` | 现有，不新增阴影 |
| 字号层级 | 10.5 徽标/表头/meta · 11.5 label/note · 12.5 卡标题/表格 · 13 正文/导航 · 14 主按钮 · 15–16 KPI · 17 弹窗标题 | 现有刻度 |
| 看板大数字 | 16px（沿用 `.kv .v`）；仅晨会 L 卡头数字可 20px `[推断]`（新增一档，仅此一处） | — |
| 深底色 | `--bg:#0B1220` / `--panel:#141D2B` / `--soft:#101827` | **只写变量名，不写字面量**（深色由 `[data-theme="dark"]` 接管） |
| 涨跌 | `var(--up)` 红涨 / `var(--down)` 绿跌（`.buy`/`.sell` 类已有） | 中国惯例，现有 |
| 动效 | 交互 .15s `var(--ease)`；页面 fade .18s；拖拽位移 transform 120ms `var(--ease)` | 沿用 `--ease:cubic-bezier(.22,1,.36,1)` |
| 字体 | 正文沿用 body 栈；数字 `font-variant-numeric:tabular-nums`；等宽 `ui-monospace,Menlo,monospace` | 现有 |

### 6.2 片段 A：对话中的「待确认卡片」

HTML（无 inline onclick；动作用 `data-act`，由 app.js 事件委托绑定）：

```html
<!-- 交易确认卡：出现在 AI 副驾驶消息流与右侧待确认队列 -->
<div class="cfm" data-card-id="{cardId}" data-state="pending">
  <div class="cfm-head">
    <span class="badge b-sent">待确认</span>
    <b class="cfm-title">买入 EURUSD · 0.10 手</b>
    <span class="cfm-src">来自对话：「帮我买 0.1 手，止损 250 点」</span>
  </div>

  <p class="cfm-why">AI 理由：{一句话，纯文字，不含数字承诺}</p>

  <div class="cfm-params">
    <label>手数 Lots
      <input data-f="lots" type="number" step="0.01" min="0.01" value="0.10"></label>
    <label>止损（点）
      <input data-f="sl" type="number" step="10" min="0" value="250"></label>
    <label>止盈（点）
      <input data-f="tp" type="number" step="10" min="0" value="500"></label>
    <label>滑点上限（点）
      <input data-f="dev" type="number" step="5" min="0" value="30"></label>
  </div>

  <!-- 校验区：全部由确定性程序填写，模型不参与；用户改参数后实时重算 -->
  <div class="cfm-checks">
    <div class="t-r"><span>账户 / 服务器</span><b data-c="acct">—</b></div>
    <div class="t-r"><span>预估占用保证金</span><b data-c="margin">—</b></div>
    <div class="t-r"><span>可用余额校验</span><b data-c="funds">校验中…</b></div>
    <div class="t-r"><span>手数取整（VOLUME_STEP）</span><b data-c="vol">—</b></div>
    <div class="t-r"><span>止损距离（STOPS_LEVEL）</span><b data-c="stops">—</b></div>
  </div>

  <p class="cfm-note">确认后立即发送一次命令：不会自动加仓、不会自动重复、
    结果未知时不会自动重试（需人工核对）。</p>

  <div class="cfm-actions">
    <button class="ghost" data-act="cancel">取消</button>
    <button class="primary" data-act="confirm" disabled>校验中…</button>
  </div>
</div>
```

CSS（追加进现有 `<style>`，只用现有变量）：

```css
/* ===== 交易确认卡 ===== */
.cfm{background:var(--panel);border:1px solid var(--accent);border-radius:14px;
  padding:16px 18px;margin:12px 0;box-shadow:var(--shadow);max-width:560px}
.cfm[data-state="done"]{border-color:var(--line);opacity:.75}
.cfm-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px}
.cfm-title{font-size:14px;font-weight:640}
.cfm-src{font-size:11px;color:var(--faint);margin-left:auto;max-width:45%;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cfm-why{font-size:12px;color:var(--muted);margin-bottom:10px;line-height:1.6}
.cfm-params{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.cfm-params label{margin:0}
.cfm-checks{background:var(--soft);border:1px solid var(--line);border-radius:11px;
  padding:12px 14px;margin-top:12px}
.cfm-checks .t-r{display:flex;justify-content:space-between;font-size:12.5px;padding:4px 0}
.cfm-checks .t-r span{color:var(--muted)}
.cfm-checks .t-r b{font-variant-numeric:tabular-nums}
.cfm-checks b.bad{color:var(--danger)}
.cfm-checks b.ok{color:var(--ok)}
.cfm-note{font-size:11.5px;color:var(--muted);margin-top:10px;line-height:1.6}
.cfm-actions{display:flex;gap:10px;margin-top:14px}
.cfm-actions .primary{flex:1;margin-top:0}
.cfm-actions .ghost{flex:0 0 auto}
```

JS 绑定约定（写进 app.js，不进 HTML）：`document.addEventListener('click', e => { const b = e.target.closest('[data-act]'); ... })`；参数输入用 `change/input` 委托到 `[data-f]`，触发程序重算校验区。

### 6.3 片段 B：看板组件 S 尺寸卡片

HTML：

```html
<!-- 看板画布 -->
<div class="board" data-editing="off">
  <!-- S 尺寸组件：账户总览 -->
  <section class="bk bk-s" data-widget="w-account">
    <header class="bk-h">
      <span class="dot live"></span>
      <h4>账户总览</h4>
      <button class="bk-act" data-bk="cfg" aria-label="组件设置">···</button>
    </header>
    <div class="bk-body">
      <div class="bk-kpi"><span class="k">净值 Equity</span><b class="v" data-k="equity">—</b></div>
      <div class="bk-rows">
        <div class="t-r"><span>余额</span><b data-k="balance">—</b></div>
        <div class="t-r"><span>可用保证金</span><b data-k="free">—</b></div>
        <div class="t-r"><span>账户模式</span><b data-k="mode">—</b></div>
      </div>
    </div>
    <footer class="bk-f">EA 快照 · 实时</footer>
  </section>

  <!-- 禁用态示例（未连 MT5）：同一张卡加 data-state -->
  <section class="bk bk-s" data-widget="w-account" data-state="off">
    <header class="bk-h"><span class="dot dead"></span><h4>账户总览</h4></header>
    <div class="bk-empty">
      未连接 MT5。到「终端与 EA」安装桥接 EA 后这里就有数据了。
      <button class="ghost" data-bk="go-terminal">去连接</button>
    </div>
  </section>
</div>
```

CSS：

```css
/* ===== 看板 ===== */
.board{display:grid;grid-template-columns:repeat(12,1fr);gap:16px;
  grid-auto-flow:dense;margin-bottom:16px}
.bk{background:var(--panel);border:1px solid var(--line);border-radius:14px;
  box-shadow:var(--shadow);display:flex;flex-direction:column;min-height:120px;
  transition:transform .12s var(--ease),border-color .15s var(--ease)}
.bk-s{grid-column:span 4}
.bk-m{grid-column:span 6}
.bk-l{grid-column:span 12}
.bk-h{display:flex;align-items:center;gap:8px;padding:12px 16px 0}
.bk-h h4{font-size:12.5px;font-weight:640;color:var(--ink)}
.bk-h .dot{width:7px;height:7px;border-radius:50%;background:var(--faint)}
.bk-h .dot.live{background:var(--ok)}
.bk-h .dot.dead{background:var(--danger)}
.bk-act{margin-left:auto;border:none;background:transparent;color:var(--faint);
  cursor:pointer;font-size:13px;border-radius:7px;padding:2px 8px;font-family:inherit}
.bk-act:hover{background:var(--soft);color:var(--ink)}
.board[data-editing="off"] .bk-act{display:none}   /* 非编辑态不收杂音 */
.bk-body{padding:10px 16px 12px;flex:1}
.bk-kpi .k{font-size:11px;color:var(--muted);display:block}
.bk-kpi .v{font-size:16px;font-weight:620;font-variant-numeric:tabular-nums}
.bk-rows{margin-top:8px}
.bk-rows .t-r{display:flex;justify-content:space-between;font-size:12px;padding:3px 0}
.bk-rows .t-r span{color:var(--muted)}
.bk-rows .t-r b{font-variant-numeric:tabular-nums}
.bk-f{font-size:10.5px;color:var(--faint);padding:8px 16px 10px;
  border-top:1px solid var(--line-strong)}
/* 禁用 / 空态 */
.bk[data-state="off"]{border-style:dashed;box-shadow:none}
.bk-empty{padding:18px 16px;font-size:12px;color:var(--muted);line-height:1.7;
  display:flex;flex-direction:column;gap:10px;align-items:flex-start}
/* 编辑态：可拖提示 + 拖拽位移用 transform，不改布局 */
.board[data-editing="on"] .bk{border-color:var(--accent);cursor:grab}
.bk.drag{opacity:.9;z-index:5;pointer-events:none}
```

---

## 附：落地依赖清单（给开发排期用）

| 依赖 | 现状 | 缺口 |
|---|---|---|
| snapshot 账户/报价/持仓 | ✅ 已有 | 持仓建议补 `swap`/`commission` |
| 多品种报价 | ❌ | EA 侧订阅 + snapshot 扩字段 |
| equity 时序 / 昨收快照 | ❌ | 主进程落盘（对齐 prefs 持久化思路） |
| 历史盈亏统计 | ❌ | EA `HistoryDeals` 或本地账本 |
| 财经日历 / 快讯数据源 | ❌ `[未知]` | 服务端聚合，走 AI 网关 |
| 审计 JSONL 存储 + `exportAudit` IPC | ❌ | preload/main 白名单新增 |
| AI 网关对话接口 | ❌（只有积分/状态） | 网关联调 |
| CSP 约束 | ✅ 已禁 inline script/onclick | 两个片段均满足（data-* + addEventListener 委托） |
