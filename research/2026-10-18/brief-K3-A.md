# K3-A · 牛牛AI 策略模板体系 v1（核心任务 · 最高优先级）

## 0. 先读这两份（绝对路径）
1. `/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/research/2026-10-18/00-FACTS.md` —— 外部事实底座（minara / mojo / alphafox 的已核实公开事实，**含链接**）
2. `/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/research/2026-10-18/01-CONTEXT.md` —— 牛牛AI 现状与技术边界

需要更细节时可直接读：`.../niuniu-ai/src/main.js`、`.../niuniu-ai/src/ui/index.html`、`.../niuniu-ai/src/ui/app.js`。

**纪律（硬性）**：
- 事实底座之外的任何断言，必须标注 `[推断]` 或 `[未知]`。
- **禁止编造精确数字**（如「这个模板预期年化 27.4%」「胜率 63%」）。需要估计时写 High/Medium/Low 或「区间待实盘填充」。
- 我不知道我们的魔改指标在实盘的表现，**不要用具体绩效数字填充模板**。绩效栏必须是「待填充字段 + 口径定义」。

## 1. 背景
牛牛AI 的「策略广场」目前是一张占位卡。我们要把它变成一个**真正有内容的生态**：
借鉴 minara 的策略市场（分类法 / 披露口径 / 发布-上线-实时三段）与 AlphaFox 的模板化执行（网格 / DCA / 趋势 / 马丁「拿来就用」），
产出**牛牛AI 自己的、可复用、模板化**的策略资产。
**落地环境是 MT5 + 我们的桥接 EA**（不是加密货币交易所），所以：
- 没有钱包 / DEX / 交易所托管这一层，只有 **MT5 账户 + 品种 + 手数 + 止损止盈点**；
- 执行参数必须能映射到我们现有的命令类型：`ORDER_MARKET / ORDER_PENDING / ORDER_MODIFY / POSITION_CLOSE / POSITION_MODIFY`；
- 每个模板最终要能被**桥接 EA** 执行，而不是一句营销话。

## 2. 你要交付什么

### A1 · 牛牛AI 策略分类树（不要照抄 crypto）
- 一级维度建议：`决策方式`（时序 Time-Series / 截面 Cross-Sectional）+ `交易风格`（趋势 / 波段 / 均值回归 / 突破 / 剥头皮 / 网格 / 加仓摊平 DCA·马丁 / 套利 / 其他）+ `风险档`（保守 / 平衡 / 激进）。
- 说明：**为什么这套维度适合外汇/贵金属/CFD**，哪些 minara 的分类要改、哪些要砍（例如 Market making 对我们是否成立）。
- 每个维度给出：**取值列表 + 一句话定义 + 反例**（什么策略不该被归到这一类——写反例比写定义更有用）。

### A2 · 模板 JSON Schema（typed，可直接落库）
一个模板对象需要哪些字段，给出完整 schema 草案 + 一个填好的样例。至少覆盖：
```
id / name / version / author_type(#平台官方#入驻策略方#用户自建)
category(决策方式) / style / risk(保守|平衡|激进) / direction(只多|只空|双向)
markets[] (EURUSD, XAUUSD 等；含「不适合的市场」negative list)
timeframes[] (M15/H1/H4/D1)
session(是否限定交易时段：亚洲/伦敦/纽约；是否有新闻黑名单)
entry_rules[] / exit_rules[] / filters[]  —— 结构化描述（见下）
params[] : { key, label, type, default, min, max, step, unit, 说明 }
risk_defaults : { sl_points, tp_points, max_lots_per_trade, max_open_positions,
                  max_daily_loss_pct, max_drawdown_stop_pct, trailing? }
required_data[] : EA 执行这个模板必须拿到的数据（报价、点差、K 线周期、账户模式(netting/hedging)…）
execution_map : 该模板会用到哪些既有命令类型（ORDER_MARKET? ORDER_PENDING? POSITION_MODIFY?）
verification[] : **上线前必须通过的验证清单**（回测 / 模拟盘 X 天 / 最小样本笔数 / 滑点容忍）
display : { 一级字段(2~3个), 二级字段, 详情页才展示的三级字段 }
lifecycle_state : draft | backtested | paper_verified | published | subscribable | delisted
```
**关键**：`entry_rules / exit_rules` 不要用自然语言散文，要结构化为：
`{ indicator: "EMA", period: 20, op: "cross_above", target: {indicator:"EMA", period:50}, on: "close" }`
这种**可被 EA 解析的形状**。给出你的结构设计（含运算符枚举），并说清楚**哪些结构现阶段桥接 EA 还做不到**。

### A3 · 至少 20 个可复用模板
分批覆盖（每批给 3~6 个）：
1. 趋势跟随（含均线穿越 + 趋势过滤版本）
2. 均值回归 / 震荡
3. 突破（含区间突破、假突破反手）
4. 网格（正向 / 反向）
5. 加仓摊平类（DCA / 马丁）——**必须显式标注风险等级=激进，并强制 max_lots / max_open_positions / 净值熔断三重上限**
6. 日内剥头皮 / 时段策略
7. 多品种轮动（截面：因子打分 → 排序 → 持前 N）
8. 跨品种 / 相关性套利
9. 组合型（多子策略 + 资金分配）

每个模板至少包含：一句话定位、**适用/不适用**的市场环境、规则骨架、**默认参数与取值范围**、**风控默认**、**必须先看哪个指标才能判断它是否失效**（失效信号）。
**MT5 特性要照顾到**：点值/point vs pip、netting vs hedging 平仓语义差异、隔夜库存费（swap）、点差扩大时段、最小手数与 STOPS_LEVEL 限制、止损>TakeProfit 品牌合规（禁马丁诱发）——都要在参数或 verification 里体现。

### A4 · 模板生命周期 + 准入条件（强烈参考 minara 的三段披露）
设计我们的阶段门：`草稿 → 回测通过 → 模拟盘 X 天 → 公开 → 可订阅 → 下架`。
逐阶段回答：
- 进入下一阶段的**最低证据**（多少笔？多少天？考不考虑是模拟盘还是实盘？）
- **每一次策略逻辑修改要不要重新走流程**（minara 的做法是改逻辑要重跑回测并重发版本）
- **「回测 / 模拟 / 实盘」三条曲线在界面上怎么摆**，才不会让用户误读（minara 明确要求不能把回测段和 live-forward 段读成一条连续实盘曲线）
- **明确列出「什么样的策略不许进广场」**（至少 5 条硬否决：例如样本量不足、实盘与回测显著背离、未披露最大回撤、含不可解释的超额收益等）

### A5 · 「三个不做」清单
站在产品经理角度：哪些 minara / AlphaFox 的功能我们**照搬会死**（考虑到我们是 MT5 + 客户自己资金 + 国内合规）：
至少给 5 条，每条写清楚「照搬会怎样 + 我们怎么做」。

## 3. 输出格式
1. **把完整交付写到文件**：`/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/research/2026-10-18/answer-A-templates.json`（schema + 20 个模板实例，UTF-8，可含 `"_note"` 字段放解释）
2. 同时在 stdout 输出一份**中文浓缩版**（≤ 400 行）：分类树结论 + schema 要点 + 20 个模板的**一行表格**（名称/风格/风险档/适用市场/核心信号）+ 生命周期表格 + 三个不做清单。
3. 凡是不在上述事实底座里的断言，全部打 `[推断]` 标记。禁止简称糊弄，禁止用「等等」跳过任何一个模板。
