# 01 · 牛牛AI 现状（技术事实，来自本仓库源码）

> 这是给外部模型读的项目上下文。**只列源码里真实存在的东西**。
> 需要更细节时，直接读这些文件（绝对路径）：
> - `/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/src/main.js`（Electron 主进程）
> - `/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/src/preload.js`（contextBridge 白名单）
> - `/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/src/ui/app.js`（渲染层）
> - `/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/src/ui/index.html`（桌面 UI，含全部 CSS 变量）

## 产品定位
牛牛AI（niuniuai.app）—— **面向 Windows + MT5 的交易助手/副驾驶**。目标形态：策略广场 + DIY 看板 + AI 副驾驶 + MT5 EA 桥接执行。
商业化现状：官网已有订阅计划与分销/推荐体系，支付走 ZPay + Stripe，后端 Supabase。

## 桌面端已落地的能力（2026-10-18）
- **Electron 主进程**：授权离线校验（公钥在客户端，客户伪造不出密钥）；未授权 → **不能下单**，但可看行情、可装 EA。
- **桥进程**：`utilityProcess`（stdio JSON-lines），持有随机密钥；**不暴露 localhost HTTP**。
- **随机密钥 + epoch 代次**：换账户/重新授权会换密钥并让 epoch 自增，旧代次命令全作废。
- **AI 网关**：客户端只持「用户令牌」，模型 Key 在服务端；积分余额按分钟轮询；**没配服务地址就整条状态条不显示**（不放点了没反应的按钮）。
- **下单安全**：主进程参数二次校验 + 未授权闸门 + 类型白名单（ORDER_MARKET / ORDER_PENDING / ORDER_CANCEL / ORDER_MODIFY / POSITION_CLOSE / POSITION_MODIFY / SYNC_STATE）+ `terminalPath` 必须含 `MetaQuotes` + 手数 0–1000。
- **回执与可核对性**：命令有 stage（SENT / EXECUTED / REJECTED / **RECONCILING（结果未知，禁止自动重放，要求人工核对）** / EXPIRED）。
- **渲染层隔离**：nodeIntegration false + contextIsolation true + sandbox true；CSP `default-src 'self'; script-src 'self'`（**禁止 inline onclick / inline script**，所有交互必须在 app.js 里 addEventListener）。
- **UI 现状**：桌面宽屏（1280×860，最小 1080×700），左侧 212px 侧边栏 + 6 个页面：
  概览（步骤条 + 账户行情 KPI + 持仓表）、终端与 EA（扫描 MT5 实例/装桥接 EA/重绑）、交易（人工下单 + 票据 + 事件回执日志）、**策略广场（当前是「规划中」占位页）**、AI 副驾驶（积分说明 + 充值入口，AI 分析未开放）、设置（主题 + 配色）。
- **配色系统**：`--accent` 变量驱动 4 套主色（品牌橙 `#FF6A1A` / 深海蓝 `#2563EB` / 翡翠绿 `#0E9F5A` / 紫罗兰 `#7C3AED`），与日/夜主题正交；**涨红跌绿**（`--up:#E23B2E / --down:#17995B`；深色下提亮为 `#FF7A66 / #3DDC97`）。
- **偏好持久化**：走主进程 `userData/prefs.json`（三个白名单值：theme / accent / page），不用 localStorage。
- **验证基建**：`tools/verify-main.js`（真 Electron + 桩 IPC + 真 app.js，30 条 DOM 断言，当前 30/30 通过）、`tools/shot-main.js`（实拍截图）、`tools/make-preview.js`（生成单文件浏览器预览）。

## 老板确定的产品偏好（硬约束）
- 审美：Premium / Minimal / Editorial / Data-driven。**禁止**花哨渐变、玻璃拟态、Neon 赛博、动态背景。
- 页面要**简洁干净**：复杂内容必须**收缩、隐藏或下沉到二级菜单**，做**多层级**导航；正面 Example「设置」里才有主题与配色，不铺在主界面。
- 「不要把一次性设计浪费掉」：能抽象的必须抽象成 **Skill / Template / SOP**。
- 所有数据要有出处；**禁止编精确数字**，定性判断用 High/Medium/Low 或 Observed/Inferred/Unknown。
- 中文优先。

## 本次要解决的问题
1. 策略广场从「占位」变成**真正有内容的生态**：把 minara / AlphaFox 的产物**模板化**成我们自己的可复用资产。
2. DIY 看板 + AI 副驾驶的 UIUX（主要学 **mojo.trade** 的 Boards / Trade / Review）。
3. 最终要**能打通并测试**：AI 副驾驶 ↔ 策略模板 ↔ MT5 终端/EA 桥接 ↔ 订阅/接入模式，形成一条端到端可观测的最小闭环。

---

## 补充 · EA 真实能力边界（2026-10-18 亲自读源码核实，非推断）

来源：`/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/ea/NiuNiuBridge.mq5`（921 行，UTF-8 BOM）

### 事实 1 · EA 只实现了三种命令，其余一律 REJECTED
源码第 752/785/793/800 行的分发结构是硬事实：
```
if (typ == "SYNC_STATE")      {...}
if (typ == "ORDER_MARKET")    {...}
else if (typ == "POSITION_CLOSE") {...}
WriteReceipt(id, "REJECTED", 0, 0, 0, 0, "暂不支持的操作: " + typ);
```
而主进程 `sanitizeCommand` 的白名单写着 7 种：`ORDER_MARKET / ORDER_PENDING / ORDER_CANCEL / ORDER_MODIFY / POSITION_CLOSE / POSITION_MODIFY / SYNC_STATE`。
→ **白名单 ≠ 已实现**。桌面端放行的 4 种（挂单 / 撤单 / 改单 / 改持仓），EA 侧现在会回答「暂不支持的操作」。
→ **这直接决定了：模板体系的 v1，只能用「市价开仓 + 按单号平仓」两个原语表达。任何依赖挂单(Stop/Limit)、移动止损、部分平仓、修改 SL/TP 的模板，v1 都不可用**，除非先在 EA 里实现对应原语。

### 事实 2 · 一个 EA 实例 = 一个 Magic = 一张图表
源码第 29 行 `input int InpMagic = 20261015;`，下单时 `req.magic = InpMagic`；平仓前第 576 行校验 `pos_magic != InpMagic` 就拒单（"持仓不属于本 EA"）。
MT5 规则：一个图表只能挂一个 EA。
→ 「多策略并行」在我们这里的等价物是：**多张图表 / 多个 EA 实例，每个实例一个不同 Magic**。这是天然的、也是唯一可行的隔离粒度。
→ 也因此，magic 不是运行时动态分配的，而是**输入参数**：要么由安装流程按实例写入，要么要求用户手动确认不重复。

### 事实 3 · 止损止盈由 EA 按「点」换算，再交给确定性逻辑
第 518~543 行：`sell/buy → sl/tp = price ∓ sl_points * point`，`req.type_filling = ORDER_FILLING_FOK`（默认 FOK，失败整单取消）。
→ 「 sl_points / tp_points」是**点（point）不是 pip**，且成交模式硬编码 FOK。模板参数必须沿用这套单位与语义。

### 事实 4 · 密钥闸门是 fail-closed，且只对 SYNC_STATE 网开一面
第 663~664 行：`if (!g_secret_ok && typ != "SYNC_STATE")` 拒绝。
→ 未装到密钥时，仍能看状态不能交易。这是安全设计，不是 bug。

### 事实 5 · 已经有「孤儿单」检测能力
第 465~476 行：按 MagicNumber 扫描历史成交，找出「本地无记录但券商有仓位」的单。
→ 这是**现有代码里被低估的资产**：正是「策略归属」和「执行对账」的起点，等于我们天然有了一条 mini 核验路径。

### 这五条对策略模板体系的硬约束（必须先满足才谈设计）
1. v1 模板的允许原语集合 = `{市价开仓(带 sl/tp 点), 按单号平仓}`。超出即不可上映。
2. 「止盈止损 via points + FOK」必须在模板 schema 里显式建模，不能沿用 pip 思维。
3. 并行能力来自「多实例多 Magic」，所以**策略实例 ≟ EA 实例 ≟ 图表**，这个一对一关系要在产品语言里讲清楚。
4. Magic 冲突是事故源，产品必须在「添加第二个策略」这一步阻止重复输入。
5. 孤儿单检测应被升级为一等公民的「对账视图」，而不是藏在日志里。
