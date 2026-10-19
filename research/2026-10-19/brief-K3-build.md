# Brief · K3 生态库 + Prompt 库施工（基于 GPT 蓝图 + 边界修正）

你是资深产品施工者。GPT 已经出了设计蓝图，Sera 拍板修正了 AI 边界。你的任务是把蓝图和修正**落成可用的数据与文件**。先读三份材料，再动手。

## 先读这些文件（都在 niuniu-ai 目录下）

1. `research/2026-10-19/answer-design-blueprint.md` —— GPT 的设计蓝图（结构/规则）
2. `research/2026-10-19/边界修正-AI一键下单.md` —— **覆盖蓝图第 2 章的 AI 边界**（以它为准）
3. `research/2026-10-18/templates-v1.clean.json` —— 23 个设计资产原文（161KB，A3_templates.templates 是数组）

## 任务一：策略广场生态库落地

按蓝图的 1.10 数据契约，产出：

### A. `strategy-library/catalog.json`
- 23 个设计资产**逐个审查**：按「机制」而非名称分类，输出每个资产的处置 = 保留候选 / 排除 / 暂缓 + 一句话原因。
- 处置规则（蓝图 1.3）：
  - grid / 马丁 / 逆势加仓 / 无止损 → **排除**（不改名、不隐藏，记入 excluded）
  - scalping / arbitrage → **暂缓**（不违反不做清单，但当前执行能力撑不住）
  - trend / mean_reversion / breakout / swing / other → **候选**，但含禁做机制的照样淘汰
- 候选资产按蓝图 1.2 四维分类：决策方式（rule_based）/ 交易风格 / 风险档（unassessed）/ 方向。
- **绩效字段全部 null**，validation_stage=research，execution_status=disabled。
- 首批 3 个模板（NN-T01/T02/T03）与 23 个资产若有重叠要说明，不能重复计数。

### B. `strategy-library/schemas/template.schema.json`
- 按蓝图 1.10 的 manifest 字段，写一个 JSON Schema（字段 + 允许值 + required）。

### C. `strategy-library/excluded/index.json`
- 被排除/暂缓的资产清单：id / 名称 / 风格 / 处置（excluded|deferred）/ 原因。

### D. `strategy-library/templates/NN-T01-trend-pullback/manifest.json`（3 个首批模板各一个）
- 用真实参数（读 `strategies/NN-T0*.json`），套蓝图 1.10 的 manifest 结构，validation_stage=research，performance 全 null。

## 任务二：交易 Prompt 库落地

按蓝图第 2 章 + 边界修正，产出：

### `prompts/` 目录下的 prompt 文件
- `P00-system.md`（身份，含边界修正加的那句）
- `P01-boundary.md`（能力边界，**用边界修正版**：可给建议 + 手数系统算 + 止损必带 + 不直接下单）
- `P10-market.md`（行情解读，保留）
- `P15-order-suggestion.md`（**新增**，下单建议卡片 JSON 契约，见边界修正）
- `P20-positions.md`（持仓分析，保留）
- `P30-decision.md`（**改为下单建议生成**，见边界修正）
- `P40-risk.md`（风控提醒，保留）
- `P50-receipt.md`（回执解释，保留）
- `P90-refuse.md`（边界拒答，保留）
- `README.md`（说明每个 prompt 的用途、触发场景、被谁引用）

每个 prompt 文件：用途 / 触发场景 / 模板正文 / 红线。正文里的 {{占位符}} 保留。

## 硬约束（违反 = 施工不合格）

- **不编造数字**：绩效 null、手数不算、不预测价格。
- **AI 一键下单的正确边界**：AI 给结构化建议卡片，手数由系统算，止损必带，必须用户确认才下单。
- **中文优先**。
- 你没把握的机制，写「待核验」并说明缺什么，别硬编。

## 输出

直接在 `strategy-library/` 和 `prompts/` 目录下写文件。写完后给我一份清单：哪些资产保留/排除/暂缓，各多少，以及你在施工中发现的蓝图问题（如有）。
