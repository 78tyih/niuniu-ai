kimi version 2.1.1
• We need execute research + design deliverable file and stdout condensed <=350 lines Chinese. Need read specified facts/context/current UI. Need identify skills relevant? User wants read local docs and write design, no internet research request explicitly? They reference research facts already. agent-reach MUST USE when wants 调研/research/search anything on internet. This is not internet research, task is based on local files, no need. Need maybe plan mode? This is non-trivial multi-file? Only output one research document, no code modifications besides doc. Pure research/exploration plus deliverable, EnterPlanMode not needed per tool says research tasks don't use Exit. Could use TodoList for multi-step. Need carefully read facts, context, UI entire potentially large. Need exact facts and avoid fabrication. Need maybe inspect other research answers to align? User only says read 3. We can read directory listing maybe Glob for relevant research files to understand existing conclusions? But not necessary, yet "此前我们有结论" in context maybe in 01. Need read. We should start brief status and TodoList, parallel reads of three known files (Read directly). Need maybe file sizes large; Read max 500000 for UI if large. We can call Read facts/context and UI with maybe max 500000. Need not use Agent? Could delegate exploration of UI and facts? We need ourselves synthesize; direct reads likely fine. Need no AskUserQuestion. Let's do TodoList with tasks.

• 我先读取事实底座、项目现状和现有 UI 变量，再据此完成设计规范与可落地的组件片段。

• We have enough baseline. Need deliver robust design. We need maybe read app.js/main/preload/EA to make system validation and compatibility concrete. User says current UI only mandatory, but B5 asks system validations. Facts/context enough but to avoid assertions beyond facts, all design recommendations are [推断], technical current facts from source can be facts if read. Need maybe inspect app.js/main/preload and EA for magic, netting support, current command types, account fields. We should read relevant code to ground MT5 specific recommendations, especially existing system has no strategy run etc. We must not assert implemented. Could simply mark design proposals [推断] and current capabilities from context. But for exact UI component integration, existing variables known. Need maybe inspect app.js event pattern to give no inline onclick snippets. User only asks HTML+CSS snippets, no JS. We can use classes/data attributes, no onclick. Need align CSS vars and maybe propose only 2 additional vars for equity curve etc. They specifically "用现有 CSS 变量名" for snippets. If need curve color #7CA9F8, can use existing --accent? But asked to review and likely add --equity. They want use existing CSS variable names. We can propose small extension variables to :root and [data-theme=dark] then snippets use them. "不要另起一套" means add semantic vars to existing system. Fine. Could use `--brand` for light curve and dark `--equity`? Better introduce `--equity:#2563EB` light and `--equity:#7CA9F8` dark, plus `--equity-soft`, `--live`, `--backtest`, `--forward` maybe use existing vars to avoid many. Snippet can use `--equity` extension, but phrase "用现有 CSS 变量名" maybe strict: only existing variables? They also request CSS variable suggestions, so new vars okay if aligned. We can explicitly "仅新增 3 个语义变量，其他全部复用". Need decide exact set.

  Need answer all B1-B7 deeply. Document likely long, maybe 600-1000 lines? Stdout <=350 lines only, file can be long. Need ensure non-factual assertions tagged [推断]. Could set global convention: "除‘已核实事实’小节及明确引用源码/事实底座外，以下所有产品取舍、数值建议、交互、文案均为[推断]，为免每句重复，在标题/段落前以[推断]覆盖至下一事实引文"? User says non-factual assertions all marked [推断]. Best explicitly tag each design section or table rows. Could state at top "标注规则：... 下文所有未标‘事实’的设计建议、结论、字段、尺寸、文案均为 [推断]；每个表格的‘结论/方案’列整体均为 [推断]" but may not satisfy "非事实断言全部打". Safer add `[推断]` at start of every bullet/paragraph/table cell with design assertions, though verbose. We can have tables with column "结论（均为[推断]）" and every row starts `[推断]`. Code snippets are design artifacts not assertions; can label "[推断] 以下代码..." and comments minimal. CSS numeric values design suggestions, tag preceding sentence/table rows. Exact numeric values allowed for design dimensions? User prohibits fabricating exact numbers and percentages for facts, but B6 specifically asks concrete numeric CSS values and B2 default period etc. Those are design prescriptions, not claimed facts. Mark [推断]. We can give suggested numeric values. For performance metric examples in code snippets, avoid precise fabricated performance numbers; use placeholders like `{windowReturn}` or `—` not actual numbers. For data values like "20~40" provided by user can mention as premise not new fact. Default period choose "全部可验证区间" or "90天" recommended? User notes AlphaFox lesson default 7 days, design default period. Facts says official suggests 90+ days. We can choose default "近90天；若可验证记录不足90天，显示全部并标不足90天" [推断], but initial strategies may mostly backtest, lack live. Need not mix. Better default "全部可验证区间（优先不少于90天）" but sorting cross strategies with different windows problematic. Need specify fixed display window for comparability and data coverage. Could default period "近90天" with "数据不足90天" badge and no ranking? For 20-40 templates maybe all backtest only. Could have default "近90天" for window return; sorting default "稳健优先" using max drawdown then Sharpe? Exact algorithm would be inference. We can avoid proprietary scoring and use default sort "最大回撤（低到高）" because both emphasize drawdown first. But consistent ranking by max DD alone can favor no trading. Could default "回撤优先" sorted by max DD with eligibility min sample and then Sharpe tiebreak. But "排序选项给几个？默认值哪个？" We can recommend 4 options: 稳健优先 (default composite? avoid opaque score), 最大回撤低→高, 夏普高→低, 窗口收益高→低. Maybe "最新发布" too? 5. Keep simple 4. Default "稳健优先" might be opaque and effectively recommendation. Better default "最大回撤（低到高）" with secondary "同区间收益（高到低）" and eligibility constraints. But ranking low DD is still recommendation risk; label "排序不等于推荐". The default period 90 days. Could also choose "夏普（高到低）" as balanced return/risk, but can be gamed and backtest. Max DD explicit both platforms. Use default sort "最大回撤：低到高" with fixed same data type & window, must have sufficient data; no synthetic score. In full directory default maybe "精选" but marketing. Avoid.

  B1: One first-level sidebar entry "策略广场", inside page segmented control two views? User asks conclusion how many views. Need balance content small and simplicity. Could recommend **one page, one default directory view + optional ranking mode via sort, not dual views**. But reference minara dual views, ask do we double. Given only 20-40 templates, two views redundant/empty. We can say **一个视图「策略广场」**, no Top Strategies/Marketplace split; same card list supports search/filter/sort; "排行" isn't separate view, just sort control and numbered order when sorted. Details as second-level page, "我的运行" separate tab? They ask full chain monitor. Could have page-level segmented "发现策略 / 我的策略" maybe that's two views but not top/market. Need choose. The question specifically "做几个视图、叫什么、怎么切换" could answer 2 views within one sidebar: "发现策略" default and "我的运行" for management; not Top/Market duplicates. This makes sense for run monitoring. But "我们内容量初期少...双视图..." likely recommended one discovery view plus details and run as second-level, not duplicate directories. We can phrase "发现侧只做 1 个目录视图，叫「策略广场」；不做 Top Strategies/Marketplace 双目录。运行侧是独立的「我的运行」二级页，不是第二个策略目录。切换：侧栏进入广场，页内分段 `发现策略 | 我的运行`，默认发现；卡片/详情共用。" That's two page modes but only one discovery view. This answers. Or "两个功能视图，非两个内容池". Need no empty leaderboard. Sorting can show ranking but not separate. Use "排行榜" as sort not tab.一级导航 side bar existing "策略广场" stays. Reasons: 20-40 enough single list; no duplicate; complex filters down to panel; My Run separate object and states. Good.

  B2 filters:一级 max3: 搜索? They ask filters not search. Put `品种/市场`, `绩效口径` (回测/模拟/实盘) and `快捷组合`? Quick presets separate. We need default visible at most 3. Could choose `品种` (all/FX/gold/index etc), `风险/风格`? Risk creator self label unreliable. `数据口径` is essential due B3 not mixing. `周期` maybe sort period control separate. The filter primary likely `品种`, `策略风格`, `风险等级` but performance type should not be filter if not mix. We can make "绩效口径" a mandatory context toggle at top, default separate? B3 conclusion "干脆不混在同一张卡" easiest: each card only one performance source, with label; list can mix but cards clear? They ask easiest misread must conclusion. Strongest: **不在同一列表混排三种绩效**; top-level segmented data scope `实盘 | 模拟 | 回测`, one active at a time; card single source with badge and chart segmented for details. Default `实盘`? If little/no live, empty. Default "可验证实盘" would often empty. Could default `实盘` and show empty with switch to simulation? That harms content. Could default `模拟盘` because product side says模拟盘优先 and verified live not yet. But initial templates maybe only backtest. The UI current says need real verified performance before open. We can propose default priority "实盘→模拟→回测 based on availability"? Dynamic default confusing. Better fixed `模拟盘` default, since 牛牛AI side-foot says 模拟盘优先; but for comparing templates, backtest may be the only data. Yet user asks design not current launch. Could set default "实盘" once available, until then default "模拟盘"; that's conditional but consistent rule. Maybe default **"模拟盘"** for MVP; no live implies no fabrication. Tabs show counts; user can switch. If no simulation performance, "回测" selected? I'd avoid adaptive default. `实盘` default would align safety and trust, but empty list with 20-40 templates maybe no. They expect practical design. Maybe default "全部" with cards clearly tagged? But violates not mixing. We need clear conclusion: no mixed same card; separate tabs. Default can be "回测" if templates are just templates? But safety says historical not promise. Starting with backtest default may overemphasize hypothetical. "模拟盘" best compromise and aligns "先模拟，再实盘". We'll choose `模拟盘` default for MVP and explain `[推断]` because current product is模拟盘优先, and live records scarce [推断]. If no sim data, show empty reason not silently fallback. When verified live becomes broadly available can revisit default; don't switch silently per user. Good.

  Primary filters: `品种` (tradable symbol group), `策略风格` (trend/swing/mean reversion/breakout/grid? facts styles minara no grid but AlphaFox templates grid etc; can propose), `风险预算` maybe actual per-trade risk rather than self-label. But three includes performance scope? Scope segmented separate from filter not counted. Need mention.一级: `品种/市场`, `风格`, `风险档`? Risk label creator self-assessed facts; we can use normalized risk based on config, not return promise. Or `账户模式` (netting/hedging) is more practical for MT5 and "能用". User says from 8 dimensions to usable, first-level should maybe `市场`, `风险`, `排序`. Sort separate not filter. We can do top bar: search + scope tabs + 3 filter buttons `品种`, `风格`, `账户适配`; sort at right. Risk goes secondary because self-label and can be misread. Quick presets are chips. However most users likely want risk first. Maybe primary `品种`, `风险`, `可运行`? Availability critical for buttons. But can just disable unavailable cards. We need justify.

  We can define:
  - 绩效口径 segmented (not counted as filter): 模拟 / 实盘 / 回测.
  - 一级 filters: 品种, 风格, 风险档 (derived from strategy parameters + historical DD? Avoid exact algorithm).
  - sort separate.
  - 二级: direction, account mode (netting/hedging), minimum capital range, availability (可模拟/可启动/仅查看), creator (official/verified/all), data duration/coverage, version compatibility with my terminal/EA, maybe category time-series/cross-sectional not relevant to MT5 retail hide as advanced "策略机制".
  Original 8 dimensions map: Category -> strategy mechanism advanced; Asset -> primary; Sort -> separate; Style -> primary; Risk -> primary but normalized label plus disclaimer; Availability -> secondary; Creator -> secondary; Direction -> secondary. Add MT5 account mode, min capital, currency/exposure, data source/time, compatibility. Do not overdo. Secondary panel sections "交易特征", "运行要求", "数据与作者". Could include 8-10 controls but collapsed. Good.

  Sort options 4: `最大回撤（默认，低→高）`, `夏普（高→低）`, `窗口收益（高→低）`, `运行/记录天数（长→短）` maybe "最新发布" not as useful. Need ensure returns same period. Include measurement window selector `近30天/近90天/近180天/全部` default 90; user asked default period not necessarily options count. We can specify 4 windows. But exact numbers are design [推断], okay. Data insufficient: still show actual window and "不足90天", don't annualize or rank with missing? We can exclude from ordered ranking? Could show after eligible with "数据不足" and no rank; don't fabricate. Use no annualized return in card first level. Sorting requires same scope & window; if insufficient, sort at bottom with "窗口不足" not treat missing as 0. Good.

  Quick presets 3:
  - 稳健先看: scope simulation/current; risk=保守/稳健? max DD sort ascending, min record 90 days, exclude grid/martingale maybe style exclusion. We shouldn't claim safe. Name "回撤优先" instead of "稳健收益" to avoid implied returns. User examples "稳健收益..." but B7 bans稳赚. Preset "回撤优先" better.
  - 日内活跃: style intraday? Need style includes "日内" not minara list but design. direction any, holding period intraday, no overnight, sort by trade count? We only have 4 sort options; preset can filter "交易频率=活跃" and sort夏普? Could add sort transaction count? Keep options 5 maybe. User wants few. Could preset style=日内/短线 + holding=不隔夜 + sort交易笔数. Then need include `交易活跃度` sort option. Five sort options okay. But request "排序选项给几个" not max. 5 reasonable.
  - 高弹性 (not "高风险高弹性" maybe "高波动观察"): risk=激进, max DD desc? Should not encourage. Preset should not be default and requires risk warning. Could choose "趋势跟随" more useful and less marketing. User says e.g. three labels. We can do 4 presets: `回撤优先`, `日内不隔夜`, `趋势跟随`, `高风险观察` maybe last has explicit warning. They asked "设计一个「快捷组合」（例如...这类预设标签）" singular concept maybe 3 presets. Use three: `回撤优先` (风险=保守+稳健? sort maxDD, ≥90d, exclude martingale/grid?), `日内活跃` (style=日内/短线, holding=不隔夜, sort=交易笔数), `趋势·长线` (style=趋势/波段, direction=all, sort=夏普). But they specifically "高风险高弹性" as example not must. Maybe include `高波动观察` as third with aggressive risk, high DD allowed, no "收益" wording, default sort window return? That could marketing. Better `趋势跟随` avoids promoting high risk. But need demonstrate each preset behind filter combo, yes.

  B3 card fields three levels.一级 scan 2-3: strategy name + window return + max DD; data source badge and window length are metadata not metrics. They ask strategy name + what 2-3. Could include `window return`, `max drawdown`, `record days` or Sharpe. Reference minara uses Sharpe. We should put only 3 primary: name + 90-day return + max DD; performance source badge and 90d label mandatory context not counted. Second level: Sharpe, trade count, record days, style, market/symbols, account mode/min capital maybe availability and creator. But card only so much. Define second level "card expanded/hover?" They say three layers, second decide click. Could be lower portion of card visible but secondary; third details only. We'll specify:
  - 一级 top & key metrics: strategy name, same-window return, max DD. Always performance source badge and window.
  - 二级 card support line & metrics strip: equity sparkline, Sharpe, trades, data days, style/symbol chips, min capital/account mode, creator/availability, actions favorite/simulate/run. This is more than "决定是否点进去" but okay.
  - 三级 detail: annualized with explanation, Sortino/Calmar, win rate, profit factor, expectancy, avg win/loss, long/short, costs/slippage, max single win/loss, streaks, parameter/version history, full trade list, risk disclosures, etc.
  Why DD beside return: same window, prevents high return without risk; DD historical not future loss cap. Put equal visual weight, no red/green on DD? Use neutral/amber/danger, not `--down` since down means falling price and Chinese color semantics. Return colored up/down based sign; max DD `--ink` or `--danger`? Equal font but danger text maybe over alarms. Use `--ink` for DD with label and negative number, maybe `--danger` only beyond user threshold? No exact thresholds. Keep neutral to avoid conflating. Use tabular numbers.

  Performance types: no mixing in same list, no same card aggregate. One active scope; card badge `回测 / 模拟盘 / 实盘` with not color alone: text + icon/shape? Use badge different neutral colors: backtest muted, simulation accent/amber, live ok. But live green could imply profitability; better all neutral outline with text, tiny shape and explicit label; don't use red/green to indicate performance type. Could use `--faint`, `--amber`, `--brand` but not ok. Distinguish text first; color auxiliary. Chart line styles: backtest dashed, simulation dash-dot? live solid. Cards only selected one scope so sparkline single segment. Details three segments with gaps and markers. No ranking across types. No combining into single metric. Default simulation as above. If live absent, no fake.

  Thumbnail: equity curve, not K-line, because comparing strategy performance; same selected time window and return % axis; no volume overlay (different meaning, clutter); no benchmark by default because not same asset/risk and could imply excess return; optional benchmark in detail only with same currency/time and labels. Publish point only if chart includes backtest + live; card single-scope chart shouldn't show publish except if mixed? We decided no mixed card, so no publish marker on card. In detail three-segment chart publish and simulation start markers. If card backtest only, no publish point. If want show release point in live curve at left boundary label "发布/可验证起点", but not necessary. Need answer "要不要标发布点" explicitly: card no unless multiple segments (which we disallow); detail yes mandatory vertical marker and gaps. K line no. No volume comparison baseline. Maybe zero baseline yes if both positive/negative, show zero line. Align y-axis independently? Comparing cards requires same window but y scale may differ; label values. Avoid volume.

  B4 details 7 sections reorganized plus additional 3-5 unique. Need design maybe 10 sections:
  1. 顶部摘要 + action / strategy info? Reference 7. Need exact逐段 with title fields exclude collapse.
  Could structure 10:
  1 `策略身份与当前可用性` (name, creator, version, scope, source, symbol/style, last verified, Public/Subscribable etc) default expanded; not marketing.
  2 `绩效概览` (same-window return, max DD, Sharpe, trades, record days, costs) expanded; no annualized primary; detailed metrics collapsed.
  3 `绩效三段图` (backtest, publish marker, simulation, live-forward) expanded; gaps, line styles, no continuous; no projected.
  4 `详细绩效与交易分析` (annualized, Sortino, Calmar, PF, expectancy, win rate, avg etc) collapsed; not just win rate.
  5 `策略规则与版本` (description, entry/exit, risk logic, changelog, parameters, source availability) default collapsed maybe strategy info summary expanded? Need avoid IP if private.
  6 `运行须知·MT5账户适配` (netting/hedging, symbols, account currency, min capital, volume range/step, leverage? not invent, stops level, sessions, news/overnight, VPS/terminal requirements) expanded mandatory before run.
  7 `组合风险与占用` (magic, symbol conflicts, margin, existing positions, other EAs, currency exposure, risk budget, kill criteria) expanded in run drawer maybe detail default collapsed? Unique.
  8 `数据口径与可验证性` (data source, broker/timezone, backtest settings, commissions/slippage, simulation/live start, missing data, last sync, audit links) collapsed or expanded? Important, default expanded summary with details collapsed.
  9 `我的 MT5 运行` replaces My live run (accounts, state, parameters, EA/bridge version, positions by magic, P&L, receipts, last heartbeat, controls) expanded if running, collapsed if not; no run actions if unavailable.
  10 `作者与版本更新` maybe combine with 1 and 5. Need at least extra 3-5 sections platforms don't have: MT5运行须知, 组合风险, 数据口径, 停止与持仓处置, 我的MT5运行? My live run exists so counterpart not extra. We can have 9 or 10 sections and mark 4 extra. User specifically "要求两平台没有但我们必须有的额外 3~5 段". We can mark exactly 4 additional: `MT5 运行须知`, `组合风险与账户冲突`, `停止与持仓处置`, `连接/版本与回执` maybe data provenance minara has some but not necessarily. Better compare facts only; cannot assert platforms don't have if facts don't mention? We can say "[推断] 相对题述两平台可见结构，新增以下4段" not claim actual absence beyond sources. They asked, so okay.
  Could structure 11 segments:
  A1 header identity
  A2 performance summary
  A3 performance chart three
  A4 detailed performance + trade analysis
  A5 strategy rules & author/version
  A6 MT5 running requirements (extra 1)
  A7 Portfolio risk and compatibility (extra 2)
  A8 Data provenance & verification (extra 3)
  A9 My MT5 run (counterpart)
  A10 Stop/position handling & recovery (extra 4)
  This is 10; user said reference 7 rearranged our version, adding 3-5 => 10-12. Great. For each title, fields, not fields, collapse strategy. Could use table with 10 rows and dense text. Need include "我该怎么开始" full action sequence in B5 and within B4 section 9/10 maybe start checklist. Add `启动向导` not separate detail section? Maybe CTA "检查并试运行" opens 7-step drawer. Section `我的 MT5 运行` shows empty state with numbered actions: select parameters→account→funds check→simulation→start. Full chain B5.

  Three-segment performance disclosure:
  - backtest segment muted dashed; ends at `回测结束` and gap.
  - publish marker vertical line at publish timestamp; not performance itself; label "发布点：此后才可外部验证"; between backtest and forward maybe publication same as simulation start; show `不可验证间隔` if any.
  - simulation and live are separate types; user asked "回测 / 发布点 / 实盘段" three段 disclosure, but earlier says three performance types backtest/sim/live. We should chart can have **four zones**: backtest, unverified gap, simulation, live, with publish marker. But B4 says "绩效三段披露：回测 / 发布点（什么时候开始可验证）/ 实盘段". They may consider publish marker not segment. We can implement three visual regions backtest / sim forward / live with two markers (publish, sim start/live start). Their requested "三段式曲线容器" likely backtest/publish/live. Need support simulation too. We can show `backtest` dashed, `simulation` dotted, `live` solid; each in separate aligned panel or broken axis with explicit gaps. If no live, no line, empty state "暂无实盘段" not extend sim. Publish marker vertical between backtest and forward. Simulation is forward but not real money; not call live. For 3-part container in component: header legend + chart with three `<svg>`? They want HTML+CSS not actual chart drawing maybe placeholder with labels and segmented grid. We can create `figure` with header and `div.perf-track` containing three `<section>` backtest/forward/live and SVG paths. Need use real CSS vars, accessible labels. No fake numeric data. Could code `<svg viewBox...>` with path no actual data? A path shape is fabricated performance if used as design snippet, even placeholder. Better use `path d=""`? Empty path invalid? Could use no path, `<div class="perf-plot" data-chart="backtest">回测曲线（由数据渲染）</div>` with CSS background no gradients banned. But they ask container only, so empty plot slots with labels acceptable. Use `svg class="perf-svg" viewBox="0 0 240 64" role="img" aria-label="回测段，按真实数据绘制"></svg>` no path. CSS `border` and line styles via border-top? Container segmentation. We can include `<path class="equity-line equity-backtest" d="" />` but empty d might not render. Better snippet is structural with `data-*` and comment `<!-- JS 按真实数据追加 path，禁止静态假曲线 -->`; comments in code maybe necessary to clarify; the design doc should stay otherwise minimal in comments. Use `<svg ...><g data-series="backtest"></g></svg>`. Fine.

  B5 interaction chain table each step: user sees, system validates, failure prompt, confirm. Steps exact given 14:
  1 进入广场
  2 筛选/搜索
  3 看卡片
  4 看详情
  5 预览/收藏
  6 选择参数
  7 选择我的 MT5 账户
  8 资金校验
  9 模拟盘试运行
  10 确认启动
  11 运行中监控
  12 暂停/停止/修改
  13 停止后资产处置说明
  Actually user chain includes 13? Count: enter, filter, card, detail, preview/fav, params, account, funds, sim, confirm, monitor, pause/stop/modify, after stop =13. Need each. Could split pause/stop/modify into separate rows because different validations/confirm; and stop assets maybe own. They said every step, can make 15 rows by split. Use full table. Need failure prompts specific disabled reasons and confirmations.
  - Enter: list, scope tabs, status bar; validate catalog availability/version, no license required to browse per current unauthorized can view markets/install EA but strategies? Current fact only no orders. Design: browsing/favorite no auth, run requires valid license. If catalog fetch fails, cached data with timestamp or empty error; not show stale as current.
  - Filter: chips and result count; validate filter values and data coverage; no results with reset, not fake.
  - Cards: one scope, metrics; validate same window/source, missing data em dash, stale badge; CTA disabled reasons.
  - Detail: data provenance and run requirements; validate strategy version, availability, performance segments; if not subscribable, button disabled "仅查看：作者未开放运行".
  - Preview/favorite: preview maybe equity/parameter summary, star; validate local preferences/login? current prefs only theme/accent/page white list; favorites not implemented. Design needs persistence. If not available, don't show? This is design future. Could say favorite local only no funds; if sync fails keep local and show not synced. Preview no orders. No confirm.
  - Params: recommended defaults, lots/risk, news/overnight options; validate bounds, symbol volume step, stop level, risk budget, unsupported combos; inline errors, cannot continue; changing real running params requires confirm and maybe restart.
  - Account: list discovered MT5 instances, login account/server, mode netting/hedging, demo/live, bridge status; validate terminal path MetaQuotes, bridge EA installed/bound, epoch/key, authorization, account mode, symbol availability, version compatibility, other strategies/magic. Failure disabled with deep link to terminal page.
  - Funds: balance/equity/free margin, min capital, existing margin, portfolio stress; validate data freshness and missing not zero, min capital, volume, margin, risk budget; fail specific which constraint; live maybe confirm not yet.
  - Simulation: creates paper/demo run? Important MT5 simulation could mean demo account or "模拟运行" with no real orders on same account. Need define. `模拟盘试运行` means in demo MT5 account or internal paper? We should recommend actual MT5 demo account via EA for high fidelity, or "模拟模式（EA 不发送真实订单）" if available not current. Current context only manual order button labeled模拟盘 but actual maybe any account? Do not assert. Design can say "[推断] 试运行默认使用 MT5 模拟账户；不能用真实账户勾选‘模拟’来代替，除非另有明确虚拟撮合且可辨识." The chain includes select my MT5 account before simulation then confirm live start; maybe choose target account first, sim on demo, then select live again? Could design target account selection includes demo/live, simulation on same selected account only if demo; if live target, require a separate demo account for trial then revalidate live at start. Need full coherent sequence:
    - At account step choose target MT5 account (demo or live).
    - Funds check.
    - Simulation trial: if selected is demo, run EA on demo; if selected is live, "模拟预检" only? Can't run simulated on live unless paper engine. Better mandate simulation on a demo account, so flow: choose "我的MT5账户" for simulation; then after trial, confirm start allows choose live account and redo validation. But user's sequence says select account before simulation and confirm start, likely they expect trial then live. We can specify selected account is **trial account** at step 7; if final target is live, start wizard re-select/confirm live account at step 10 and rerun all checks. The chain then has account selection twice (runtime target at confirm). We can make row 7 "选择我的 MT5 账户（先选模拟账户；实盘目标可在启动时改选）". This adds friction but safe. Or allow "跳过模拟" with second confirm? Facts AlphaFox recommends first simulation not necessarily hard requirement. User chain includes sim step, likely make required before first live. Good: first live start of a strategy version requires simulation run and explicit acknowledgment; subsequent versions maybe changes require re-sim. No exact duration fabricated; "达到可解释的样本/用户主动结束" no fixed days. A simulation run doesn't guarantee live.
    - Step 9 "模拟盘试运行" shows demo account, status, no real funds; system validates demo flag, heartbeat, commands, order events; failure if account actually live block with "检测到实盘账户，已停止，避免模拟单变真实单". No real confirm because demo, but starting algo still maybe confirm? Only real-money actions mandatory second confirm. Simulation start single confirm? Could confirm once to install EA? No real money.
    - Step10 confirm start live: show run ticket (strategy version, params, account, server, mode, symbols, lots/risk, SL/TP, margin, magic, news/overnight, stop behavior) and require checkbox + typed? Secondary confirm modal. Do not overdo typing; checkbox "我明白..." + click "确认启动实盘". If strategy can immediately open positions vs wait for next signal, state explicitly. Real money action double confirm: main run button opens review modal, modal confirm is second. Also changing parameters on live, resume after pause, closing positions all require confirm. Starting simulation no.
    - Monitor: status, equity, positions by magic, orders/events/receipts, heartbeat, free margin, portfolio exposure. Validate sync freshness, epoch, reconnecting unknown state; on stale show "状态未知" and block repeated commands; RECONCILING no auto replay per current fact. Buttons disconnect disabled reason.
    - Pause: no new orders but management? Need define semantics precisely. Default pause = stops opening new positions, continues existing SL/TP? EA pause may no longer manage positions, dangerous. Need choose: `暂停新开仓` default, keeps monitoring and protective exits; existing positions remain. If pause entire EA, must warn protection may stop. System validates heartbeat and writes pause state; failure status unknown. Confirm? Pause reduces risk but can affect management, real money actions "暂停/停止/修改" could require confirm if stops management. We can require confirm modal that states existing positions unchanged and protective behavior. User says real money all second confirm; pause impacts real funds, so yes.
    - Stop: default stop generating new orders and EA management? Need define default stop and open positions. `停止策略` = no new orders, retain positions, continue MT5 broker-side SL/TP if present, but no strategy management; need user choose position handling. Separate options: `仅停止，保留持仓` default; `停止并平仓所选策略持仓` optional separate confirmation; `停止并撤销本策略挂单` maybe default? Need decide. If stop doesn't cancel pending orders, they can later open, unsafe. Default stop should cancel strategy's pending orders? Mojo stops agent no auto close. In MT5, stopping strategy but pending orders remain at broker is dangerous. We can design default: stop new signals + cancel this strategy's pending orders (with preview and confirm) + keep open positions; but cancellation is a real-money action and requires explicit confirmation. User asks default behavior + must话术. We can state:
      - Default `停止策略，不自动平仓`; immediately stop new signals; **pending orders**: default also cancel? If default cancel, it's asset action; user can choose keep? Simpler safe: stop wizard shows two independent sections: open positions default retain; pending orders default cancel because otherwise may open after stop. But user could expect "stop no asset actions" from mojo. We can choose `停止 = 停止新开仓 + 撤销本策略未触发挂单 + 保留已有持仓` as default. This is defensible; explicit ticket lists orders to cancel and positions retained, second confirm. If user wants completely no order changes, can select "保留挂单" but warning. Does this violate default "停止不会自动平仓" no. Good.
      - Open positions remain, EA no longer modifies SL/TP/trailing; existing broker-side SL/TP remains if already placed; if no SL/TP, unprotected. Need warn exact: "停止后，本策略已有的 N 个持仓仍留在你的 MT5 账户，盈亏与保证金占用继续变化；策略不再为其移动止损或执行退出。已挂在券商服务器的止损/止盈（如有）仍按券商规则执行，未设置的不会自动补齐。你可前往持仓手工管理，或勾选‘同时平仓’并再次确认。" Avoid exact N placeholder dynamic. `magic` filter may not identify netting positions reliably; in netting, cannot safely selectively close per strategy if net position mixed. Our conflict rules prevent same symbol multi strategy but manual trades can still mix. Need detect and block selective auto close if ownership ambiguous. Add failure "净额账户该品种存在非本策略/手工仓位，无法可靠拆分，已禁用自动平仓，请到 MT5 人工处理". Good.
      - Optional "停止并平仓" requires separate checkbox and confirm with market price/slippage uncertainty, partial failure/reconciliation. Never auto close by default. After stop asset page shows remaining positions/pending orders, freed margin only after positions actually closed, no claim funds "returned" because already in own MT5. Non-custodial means no redemption/settlement. Stop after asset disposition explanation: "没有平台余额可赎回，资金/持仓始终在 MT5；保留仓位 means risk continues; pending canceled etc; realized P&L in MT5 account; run record retained; strategy can be restarted but no automatic recovery/replay without review." If subscription share settlement not in current product, don't include.

  MT5 one account one strategy question: facts direct says no hard restriction; implement magic registration + per-symbol exclusion netting + portfolio risk. Need nuanced hedging: allow multiple strategies same account with unique magic and risk budgets; same symbol maybe allowed hedging if magic isolation, but portfolio correlated exposure checks. Netting: **per symbol exclusive across all EA/manual?** Magic cannot isolate net position; require one strategy per symbol and detect manual position; block start if conflicting. Hedging: allow same symbol with unique magic but warn aggregated exposure and margin; maybe default still same-symbol exclusive for simplicity? Facts says industry recommends one symbol per strategy especially netting; recommendation could choose stricter default for both to reduce risk. But question asks not copy AlphaFox. We can say no account-wide exclusion; allow multi-EA under three gates. For netting hard per-symbol mutex; hedging technically allow same symbol but default warn and require portfolio check, maybe allow. Unique magic registry across terminal/account, collision block. Margin risk and currency exposure aggregate. Option stronger isolation separate MT5 instances/accounts for users needing strong risk. No hard-coded exact risk percentages from third-party table; we can avoid using numeric allocations and mark qualitative. Existing facts contains precise risk table but user says no fabricated exact numbers; those are sourced facts but not necessary. We should not prescribe 1% etc. Say strategy templates cannot default risk without portfolio context; dynamic calculation deterministic.

  B6 visual:
  - Existing variables all given. Need recommend color use: accent only actions/selection, up/down only signed price/P&L, not performance source/risk; light/dark orthogonal.
  - Equity curve dark #7CA9F8 review: reasonable [推断] because distinct from up/down red/green and accent palettes (orange/blue/green/purple). Wait if accent=blue, light/dark curve #7CA9F8 and accent light #60A5FA could be close, but curve semantically separate. Need mention #7CA9F8 has adequate contrast? Cannot claim WCAG exact without calculation; can calculate? Could avoid accessibility exact claims, say visually clear. For light equity curve use `--brand-deep`? If accent green, then equity green might be mistaken down (Chinese down=green). That's why fixed blue better both themes. Use fixed `--equity:#2563EB` light and `#7CA9F8` dark, independent of accent and up/down. In light, blue #2563EB distinct from `--down:#17995B` and `--up:#E23B2E`; good. Dark #7CA9F8 reasonable. On orange/green/purple accent, fixed blue avoids confusion. On blue accent, selection vs curve could conflict; use curve only in charts, accent for controls. Add `--equity` variable fixed independent of accent. Backtest line use `--faint` dashed; simulation use `--amber` dotted? Amber usually warning; maybe simulated line `--accent` but then accent interplay. Better backtest `--faint` dashed; simulation `--muted` dotted or `--amber` dash-dot; live `--equity` solid. But "资金曲线在深色下用什么颜色" likely all equity line? We can say live/selected performance equity uses #7CA9F8 dark; backtest gray dashed, simulation amber dash-dot, so no continuous single color. In cards single scope, backtest gray, sim amber, live blue. But if simulation curve amber, could imply warning, okay maybe not. Alternative all segments equity blue but different line styles and gaps; less color confusion. Use line style + labels, color auxiliary. `--equity` for actual simulation/live? Sim not actual. Use `--equity` for live only; `--brand` for selected card? Hmm.

  We can propose:
    - `--equity:#2563EB` light / `#7CA9F8` dark for **current selected equity series**, regardless of source; source encoded badge and line style. But backtest in gray? User wants three-segment. We can set live solid equity blue, sim solid? Use fixed blue for any equity curve, line style differentiates; no red/green. Then backtest uses muted dashed, simulation uses equity dotted, live uses equity solid. Fine.
    - `--perf-backtest:var(--faint)`, `--perf-sim:var(--amber)`, `--equity` for live. That adds 2 aliases. Maybe simpler only add `--equity`, use existing `--faint`, `--amber`. Snippets use all existing plus equity.
  - Border colors already --line #E4E6EA light #2A3648 dark; note `--line-strong` oddly lighter in light (#F0F1F4) vs --line, name inverted; do not rename globally, use --line for card boundary, --line-strong for subtle divider? Existing `line-strong` is actually lighter. Need "对齐不另起一套". Could point out `[推断] 目前 --line-strong 在浅色下比 --line 更浅，命名与强度相反；本页先按现有用途把 --line 用于外框、--line-strong 用于内部细分隔，不在本任务改名，避免全 UI 回归。` This is observation from code (exact values fact) and design recommendation. Good. Card border radius existing 14px, padding 18/20, gap16. Strategy card maybe 14px radius, 16px padding, grid gap16, border 1px --line. Metrics strip 10px radius (kv existing), badge5px, buttons9/10. Font levels existing body14, page title16, card h3 12.5, data v16, labels11, notes11.5. Suggest strategy name14 (or15), key metrics20? User asks specific hierarchy. Need not huge. `20px/1.2 650` for return and DD, `14px/1.4 640` strategy name, `12.5px` body, `11px` labels, `10.5px` badges/meta. Detail title20? topbar h1 16 existing; detail strategy title20 may be okay but keep editorial. Page heading16 existing, detail title18. Could table:
    - page/detail title 18/26 650 (existing topbar 16, but strategy detail inside page can 18)
    - card strategy name 14/22 640
    - primary metrics 20/24 650 tabular
    - metric strip values 14/20 620
    - body/controls 12.5/20 or 13/20
    - labels 11/16
    - badge 10.5/16
  Same values light/dark; colors differ.
  - Spacing 4/8/12/16/20/26 based existing. Card 16/18? Existing card 18 20. Use strategy card padding16 18? To align exactly use 18px 20px; but card grid could be dense. Suggest card padding16px 18px? "如何与现有变量体系对齐" no spacing vars currently. Reuse `.card` 14 radius 18/20, `.grid2` gap16, `.kv` 10 radius and .v16. For strategy card primary metrics 20 is new. Good.
  - Light/dark shadows use existing --shadow (dark heavy 0 8 24 maybe cards floating; premium minimal can keep). Hover border accent and translate? No need motion maybe no movement; use border accent. No gradients (note existing logo uses linear-gradient despite hard ban; don't touch? Could mention strategy page doesn't use; existing logo is preexisting and outside scope. Hard ban says no gradients, maybe design doc should not repeat; could flag existing `.logo` uses gradient at line48 contradicts stated preference but user asks strategy page. We can mention in alignment "本页不新增渐变；现有 `.logo` 的渐变不在本片段复用" maybe not necessary).
  - Radius: card14, inner10, controls9, badge5, modal16, exactly existing.
  - Borders light/dark table uses variables. Could list actual values and variable names. No new neutral palette.
  - Additional `--equity` only. Could add `--grid-line:var(--line-strong)` alias? Not necessary. For chart grid use --line-strong. Performance source backgrounds use color-mix existing.
  - Need 3 HTML+CSS snippets:
  1 strategy card with classes `strategy-card card` maybe use existing `.card` (has margin-bottom) and `article`, no inline onclick. Buttons with `data-action` and `data-strategy-id`, no ids necessary. Use data metrics placeholders not actual numbers. We need avoid JS template mustache in static HTML? Can show `—` for values and `data-field`. Good. Example:
  ```
  <article class="card strategy-card" data-strategy-id="" data-performance="paper">
  <header ...>
  <div><span class="badge perf-badge perf-paper">模拟盘</span><h3...>...</h3></div>
  <button class="ghost icon-button" type="button" data-action="star" aria-pressed="false" aria-label="收藏策略">☆</button>
  </header>
  <div class="strategy-meta">...</div>
  <div class="strategy-primary">
  <div><span>近90天收益</span><strong data-field="window-return">—</strong></div>
  ...
  </div>
  <figure class="strategy-spark"><svg ...><g data-series="equity"></g></svg><figcaption>...</figcaption></figure>
  <div class="strategy-secondary">Sharpe etc</div>
  <footer><span>可运行状态...</span><button ...>查看详情</button><button class="primary" ... disabled>... </button></footer>
  </article>
  ```
  Existing `button.primary` width100% margin-top18; in card footer need override `.strategy-actions .primary{width:auto;margin-top:0;padding:9px 14px;font-size:12.5px}`. Good. No inline onclick. No inline style. `h3` existing card h3 margins etc; override.
  Could avoid actual strategy name placeholder "策略名称" and symbol "品种 · 风格" generic. That's okay. Badge "模拟盘" is example; not performance numbers. Card CTA disabled reason in `title` and visible note? Disabled buttons don't fire and title may not show consistently. Need visible reason text. Include `.strategy-availability` "未绑定 MT5：仅可查看" and button disabled aria-describedby. Unique ids? snippet single card can use `id="run-reason-demo"` but repeated cards need unique generated IDs. Better `aria-label="试运行，不可用：未绑定 MT5"` plus visible reason. No need aria-describedby. Button text "暂可查看" maybe primary disabled "试运行". Data-action still event delegated. For preview no inline JS.

  2 metric strip `div class="metric-strip"` with four items annualized/sharpe/maxDD/trades, values em dash and labels with title? Need annualized warning "由所选窗口折算，非一年实际收益" visible caption. Reuse `.kv`? Existing kv grid 3 columns; we need 4, create `.perf-metrics` with grid. Fields no numbers. Use `<span class="metric-value" data-field=...>—</span>`. CSS.
  3 detail top three segment container `figure class="perf-disclosure"` with header badges and legend, `.perf-segments` grid columns maybe 1.2fr 1fr 1fr; each `.perf-segment` has header and svg. Backtest, simulation forward, live. Publish marker as separate `.publish-marker` between backtest and forward? If three columns with grid, can have marker absolutely at boundary. Better container:
  ```
  <div class="perf-stage">
  <section class="perf-segment is-backtest">...</section>
  <div class="publish-marker"><span>发布点...</span></div>
  <section ...>...</section>
  <section ...>...</section>
  </div>
  ```
  CSS grid `grid-template-columns: 1.2fr 1px 1fr 1fr` maybe marker width 72? Need clearly gaps. Could use 3 independent panels with gap12 and marker row above? We need "三段式曲线容器" likely backtest/publish/live. Do 3 segment panels separated by 12px gap, with `data-start` labels. Between backtest and forward marker can be a vertical line at top? Simpler:
  ```
  <div class="perf-disclosure-track">
  <section>回测段<svg...></section>
  <div class="publish-divider" role="separator" aria-label="发布点"><span>发布点<br><time>—</time></span></div>
  <section>模拟/前瞻段...</section>
  <section>实盘段...</section>
  </div>
  ```
  That's 3 chart sections + marker. Grid columns `1fr 76px 1fr 1fr`; gap12. On 1080 width with sidebar 212 and pages 52 leaves 816; 4 columns ~180 each okay. Could stack on narrow with container query? Not necessary but desktop min 1080. Use no media query? Good.
  But "不连续" easiest separate plot panels with own baselines and gaps, not shared svg. If same y-axis scale? To compare, need same y scale maybe can be same return axis but gaps. We can specify common y scale if shown side-by-side, each segment own x scale/time labels, no joining path. However daily returns vs equity cumulative need rebasing at segment boundaries? If chart cumulative equity across backtest and live, starting values differ. Better each segment normalized to own start =0%, clearly labeled "各段从各自起点累计，不拼接净值"; but then cannot visually show continuous actual equity. The user says won't be misread as continuous. We can specify **segment-local cumulative return**, each segment zero baseline, no connecting line; header also shows absolute account equity separately if live. Or use actual equity with gaps? If backtest starting balance and live account differ, impossible. Use segment-local returns and label. In detail, three plots aligned but independent, no path across. Publish marker between backtest and forward with timestamp. "发布点不是收益拐点，不纳入收益计算." Good.
  - Component container labels "各段独立从 0% 起算 · 空白处无数据 · 不用跨段连线". `0%` is design convention not fabricated exact metric. Allowed.
  - If no live segment show "暂无实盘记录" no fake line.
  - Card sparkline should be single source and zero line if needed; no benchmark.

  B7 at least 8 items, each risk and alternative. Need maybe 12:
  1 no "稳赚/保本/零风险/收益承诺" -> risk misleading -> use historical facts + risk warning.
  2 no annualized huge marketing tags / default APY sort -> short window extrapolation -> default 90d window return & DD; annualized detail with formula.
  3 no mixed backtest/sim/live same curve/list -> misread -> tabs and broken segments.
  4 no default 7d returns ranking -> recent luck -> 90d, data days.
  5 no "Top=推荐"/"官方精选" without disclosure -> perceived endorsement -> "排序不等于推荐", methodology.
  6 no risk labels as guarantees ("保守=低回撤") -> false safety -> parameter/description + historical DD + disclaimer.
  7 no follower count as top primary / popularity ranking -> herd/social proof unverified -> secondary detail or omit until verified.
  8 no fabricated live badges / backfilled live / future returns, projected curves -> fraud -> verified source timestamps, no projection.
  9 no one-click live Run directly on card -> accidental money -> card to details/sim; live only wizard with review + confirm.
  10 no stop=close / auto liquidation default -> unexpected realization -> retain positions default, pending cancel explicit, separate close confirm.
  11 no enabled buttons when unavailable / hidden dead clicks -> confusion and unsafe retries -> disabled with visible reason or hide whole unavailable bar; state unknown disable.
  12 no K-line/volume/benchmark clutter in cards / gradients etc -> misread & visual noise -> equity sparkline only.
  13 no precise risk % or min capital generic unsupported -> false applicability -> broker-specific deterministic validation and template metadata.
  14 no automatic retry on RECONCILING -> duplicate orders -> manual reconcile.
  15 no display of unverified creator income or exact future returns.
  Need at least 8, maybe 12 concise. Each risk and alternative. Could include "不在卡片放年化" separate from "不放营销标签". "不放未来收益预测/AI目标价" etc.

  Need maybe read app.js for disabled pattern and event delegation if code snippet data-action matches. Current app.js uses direct addEventListener, no inline. We can state snippet interactions delegated from app.js. Could read relevant sections for disabled status and prefs? Context sufficient. But to "verify deliverable" no code tests needed since only doc. We can run script to check line counts and grep for inline onclick. Need maybe validate HTML snippets? Could extract? Not necessary. Could use markdown lint? No project standard for docs. We can read final file and grep for required headings/inline onclick. We should write and verify all B1-B7 present and output. Need ensure no unsupported factual assertions not tagged. Could mark entire document design sections as [推断] per heading. For facts section, quote facts with source path and line numbers? Local file references. We can cite `research/2026-10-18/00-FACTS.md` sections, `01-CONTEXT.md`. No external citations needed since facts file has URLs. User wants output file and stdout. We can use relative references.

  Potential use of subagent to independently review coverage after draft could be helpful but not necessary; we can do ourselves. Task substantial; could delegate an explore agent to review existing code variables? But direct read done. No need.

  We need now mark first todo done and second in progress. Then compose file. Need maybe generate content with Write new file. Need plan content in analysis thoroughly.

  Let's outline document:

  ```
  # K3-B · 牛牛AI策略广场 UIUX规范
  > 日期...
  > 输入...
  > 标注: "事实" ... [推断] ...
  ## 0. 结论摘要
  table B1-B7 each conclusion [推断]
  ## 1. 已核实边界
  - [事实] ... Minara...
  ...
  ## 2 B1
  ### 结论
  [推断] 一侧栏 etc
  tree
  理由 table maybe.
  ##3 B2
  [推断] scope control etc
  table primary
  secondary table
  sort and window
  presets table
  empty and no results
  ##4 B3
  table levels
  why DD
  performance source decision
  thumbnail rules
  ##5 B4
  ### detail skeleton
  table 10 sections with title/content/exclude/default
  ### three segment disclosure
  rules
  ### start sequence summary link B5
  ##6 B5
  ### global state rules
  - data unavailable etc
  ### chain table 15 rows
  ### MT5 account concurrency
  ### stop positions
  default and copy
  ##7 B6
  ### color
  table vars
  ### review equity dark
  ### dimensions
  table
  ### mapping
  ### code snippets with variable addition + card + metrics + detail container
  ##8 B7
  table 12
  ##9 acceptance checklist maybe useful
  ```
  Stdout condensed <=350 lines includes conclusion table, skeleton, chain table, CSS variables, not list. Could essentially summarize file ~200 lines. Final response should include Chinese condensed version not just "file written". User explicitly "stdout 输出中文浓缩版（≤350行）". In this interface final message is stdout. Need include all requested components. Could produce ~180-250 lines. File can be longer. Need not dump full code snippets in stdout? They only require conclusion table + skeleton + chain + CSS vars + exclusion list; code in file. Mention path. Great.

  Need no precise fabricated numbers in text except design values tagged [推断]. Code includes CSS exact values design, label [推断]. Placeholder metrics em dash. No made-up performance numbers. Preset windows exact design values [推断]. Maybe file title "v1" okay.

  Facts vs inference labeling:
  At top:
  ```
  - 事实：仅“已核实输入”节...
  - [推断]：所有产品决策、UI规格、交互、代码和文案均为设计建议，不是已上线能力。
  ```
  Then each table row maybe not every cell if table caption says `[推断] 下表全部为设计建议`. Does this count all assertions tagged? We can put `[推断]` in each row's conclusion cell. To be safe, start every design bullet with `[推断]`; table columns header "方案（[推断]）" and row entries not each? User says non-factual assertions全部打, header tag applies entire column maybe enough but safer row first cell begins `[推断]`. For big chain table, caption `[推断] 本表所有步骤、校验与提示均为目标设计，不代表现有功能。` and each row first cell `1. 进入广场 [推断]`? Could tag in each "看到" cell? Too repetitive. We can add column "性质" all [推断], but 5 columns becomes 6. Alternative title `### 全链路（整表均为 [推断]）` clearly marks whole table. The phrase "非事实断言全部打 [推断]" likely expects tags on claims, not every CSS line. Section-level tagging acceptable if unambiguous. We'll explicitly state "以下整节（含表格、代码、文案）均为 [推断]" under each major design section. Then no untagged inference inside. But final condensed also should tag each conclusion row or global statement. We can do global "以下除‘事实依据’外，所有方案与数值均为[推断]" plus each table row with [推断] in conclusion. That should satisfy.

  Maybe document can avoid separate facts claims beyond source by only small "事实锚点" list:
  - Minara dual views same detail, performance chart must not treat backtest + live as continuous; high ranking not recommendation; conservative no guarantee.
  - AlphaFox copy parameters not returns, separate pools, 90d recommendation, account constraint, etc.
  - MT5 one chart one EA, magic not risk isolation, netting one position, etc.
  - Current UI 6 pages, variables, CSP no inline, unauthorized no orders, etc.
  Each source cited. Design starts afterwards.

  Need think through filter/sort and performance scope default more. We can refine:
  B2 primary:
  1 `品种` because actual tradability, filter values derived from available templates and selected MT5 symbols.
  2 `风格` (趋势/波段/均值回归/突破/日内/其他) because user mental model.
  3 `风险档` but not creator self-label only. Need risk normalization based on max historical DD? If derived solely from historical DD may guarantee? We can define risk filter uses `模板申报风险 + 历史最大回撤` display both, filter on "风险标签" not guarantee. Better call `风险与持仓` with options `不隔夜 / 低杠杆?` Not enough. Maybe primary `持仓周期` instead of risk: `日内/短线/波段/长线` more objective and avoids self-label. Risk goes secondary with warning. Quick preset "回撤优先" handles risk via sort. What would users need? User asks minara dimensions; risk is one. Primary max3 should be most useful. We can choose `品种`, `持仓周期`, `风险档` and move style to secondary. But style and holding period overlap. We need clean taxonomy:
  - Asset (品种) primary.
  - Style (策略风格) primary includes trend/mean reversion/breakout/grid etc.
  - Risk (风险档) primary with self/review source and not guarantee.
  - Holding period secondary (日内/隔夜/周末).
  That's okay.
  Performance scope segmented separate, search and sort separate. Primary filter count exactly 3. Risk label if creator self-assessed, show source; if internal reviewed, "牛牛风险评估" but assessment methodology not implemented. Design can say filter values `保守/均衡/激进/未评级`; always show "标签不保证回撤" and allow "未评级" rather than force. Default All. Sorting default max DD makes risk filter less necessary but okay.

  Secondary:
  - Direction (long/short/both)
  - Availability (runnable/sim only/view only/open source maybe code availability separate)
  - Creator (all/verified/official) but "verified" identity not performance.
  - Category (time-series/cross-sectional/other) maybe these concepts crypto/quant less relevant; place "机制" advanced, default hidden? User wants secondary panel; include.
  - MT5 account mode (hedging/netting/both)
  - Min capital / max capital? filter "我的账户可运行" using selected account, better than asking ranges. Add toggle "仅看当前账户可运行" which does deterministic compatibility; if no account selected disabled reason. This is valuable.
  - Data days (≥90 etc) and performance record source? Scope already.
  - Version compatibility (only compatible with my bridge) part of current account runnable.
  - Trading session (no news/no overnight) maybe secondary "交易时段".
  - Creator.
  Need not recreate 8+ unnecessarily; collapsed so okay but "复杂内容必须下沉". Use groups with 7 controls. Could state `Category` not shown in MVP if all templates same? But question asks from 8 dimensions; should map all. We'll include `策略机制（Category）` under secondary "高级" collapsed within panel (third level?) User says secondary appears filter panel; okay. Use progressive disclosure inside panel group maybe not needed.

  Sort 5 options:
  - 最大回撤 低→高 (default)
  - 夏普 高→低
  - 窗口收益 高→低
  - 交易笔数 多→少 (only same window; not activity quality)
  - 记录天数 长→短
  No APY default. Annualized not sort? Could omit completely to avoid extrapolation. If user expects minara APY sort, we intentionally don't include. Maybe include `年化收益` only advanced sort with warning? Better not, B7 no default annualized marketing. Sort choices 5 enough. Default period 90d; other windows 30/180/all. If record < selected window: display actual days and `窗口不足`, no interpolation; eligible sorted after full-window or exclude? Design decide: "参与该窗口排序，但排在数据完整者之后" could still compare partial returns misleading. Better "不参与名次；保留在目录底部并标‘数据不足’". But then ranking view isn't separate, no rank numbers by default. We can say no rank numbers at all; sorted list only. Then insufficient can be listed after with no fabricated ordering. "缺少指标置底且显示原因，不以0代替". Good.

  Quick presets:
  1 `回撤优先`: scope unchanged, risk=全部? Sort maxDD, record>=90, availability=可模拟, exclude unverified? Filter `数据完整性=完整窗口`, style all. If risk=保守 then self-label issue. Preset combo: `记录≥90天 + 数据完整 + 最大回撤升序`; no risk filter needed. Name avoids return promise.
  2 `日内不隔夜`: style=日内/短线, holding=不隔夜, direction=all, sort=交易笔数 desc, session=避免隔夜; maybe "日内活跃" requires min trade count but no exact threshold; filter trade activity=活跃 (defined relative? Need no precise threshold? Could use template metadata `持仓周期=日内` and sort transactions). Name `日内短线` not "活跃" to avoid threshold. But user wants willing to start, `日内活跃` is engaging. Define "活跃" via sort not filter, no exact cutoff.
  3 `趋势波段`: style=趋势跟随, holding=波段/允许隔夜, sort=夏普 desc, record>=90. This is safe.
  Could include `高波动观察` optional not default: risk=激进, sort=window return? No need.
  Each preset just applies visible filter chips, user can see and edit, no hidden logic; no performance guarantee; preset not recommendation. Default preset `回撤优先`? If default sort already maxDD and record90, preset redundant. Default preset could be `全部策略`, with `回撤优先` one click. Default sort maxDD and period90; preset adds min record & availability. Fine.

  B3 fields and actions:
  Primary includes name + return + maxDD. Secondary includes Sharpe etc. Maybe window and source required not counted. Third detail includes annualized etc.
  Cards should have two actions `收藏` and `查看详情`; `模拟` primary if available; `实盘启动` not on card. The user wants can follow; card can `模拟` and detail `启动`. "可跟单" semantics in MT5: copying template parameters vs following future trades? Need clarify **copy vs follow**. Current task "策略广场...可跟单" but MT5 templates could be copied. We should distinguish:
  - For strategy templates: `使用策略` = instantiate rules/params on own MT5, not copy past returns.
  - For signal providers: not current content? Facts AlphaFox has two pools, but B1 we don't make second pool. If future signal-following strategies exist, card must badge `模板`/`信号源`; different semantics. Should we include? User reference AlphaFox strategy leaderboard + follow button. They ask "策略广场" with templates 20-40, so likely strategies are templates. We can define CTA "模拟运行" not "一键跟单"; detail "启动策略". If creator live signal copy is supported later, separate type and explain "只跟随启动后的新信号，不补开历史持仓" from AlphaFox. But not required and could complicate. Yet "可跟单" explicitly. We should mention `[推断] v1 统一把动作命名为「模拟运行 / 启动策略」，不笼统写「跟单」；模板是复制规则与参数到自己的 MT5。若后续加入信号源，再新增明确「跟随新信号」类型与独立说明，不与模板混为一谈。` This addresses semantics and avoids fake capability. B1 one content pool but can filter type. Maybe not central but valuable. Add in B1 or B5. Existing UI page-s says "策略方挂牌 · 业绩可查 · 一键跟单" but design should replace "一键跟单" with "先模拟，再启动" to avoid direct real money. Good. Could explicitly recommend updating page-s in future implementation, but task only design doc not actual UI. Good.

  B4 run requirements fields:
  - account mode: supported `hedging/netting`, behavior if incompatible.
  - symbol name mapping across brokers, contract size, volume min/max/step, stops level, digits, currency, leverage/margin (read from terminal, not creator fixed).
  - minimum capital: template min + current account currency conversion; show as "模板最低资金" and "当前账户校验" separate; not guarantee.
  - suggested lots: show range and formula, not one fixed lot; lot deterministic from risk, SL, tick value, contract size, free margin, portfolio factor.
  - forbidden sessions: news, rollover, overnight, weekends, market holidays, low liquidity; strategy-specific; user can configure but if template mandatory cannot override? Show `强制` vs `建议`.
  - terminal: MT5 build, EA bridge version, strategy schema version, always-on terminal, heartbeat, VPS recommendation (not factual).
  - no trading times: exact schedule from template not invent.
  - kill criteria: max daily loss/DD etc user configured; no exact values.
  Detailed sections not fields: no projected return, no fake live, no raw parameter dumps in summary, no creator private source if not open, no hidden risk.

  B5 global validations:
  - Browse no license; starting requires license (current unauthorized cannot order).
  - Version compatibility check `strategy schema / bridge EA / desktop` and terminal path; current main only terminalPath contains MetaQuotes, types etc. Design target.
  - Deterministic program calculates funds/lot, not AI (from Mojo fact). Add `[推断] AI 不参与资金/手数最终计算`.
  - Data missing = block not 0 (from Mojo fact).
  - Command receipt stages including RECONCILING (current fact) integrate monitoring.
  - Permissions: authorization, availability, creator subscription maybe.
  - Double confirm real money: start live, resume live, apply param changes, stop if cancels orders? and close positions, manual close. Pausing/stopping no new exposure but affects open management; require one review confirmation? User says "哪些步骤必须二次确认（真金白银动作一律）". In table mark:
    * start simulation: no (demo).
    * live start: yes (review + modal).
    * pause: yes if it changes position management; else no? To be safe yes.
    * stop: yes because pending cancellation / management cessation.
    * modify live: yes, and if only future signals maybe still real; yes.
    * resume: yes.
    * position close: separate additional confirmation.
    * favorite/filter no.
  - "二次确认" could mean modal after action, not two modals. Define as "首次点击只生成确认票据，第二次点击才下发命令"; avoids requiring 3. For high-risk close all maybe type account? Not necessary.

  Failure prompts examples specific:
    - Catalog unavailable: "策略目录暂时不可用，显示最近缓存（更新于…）；运行按钮已禁用" no stale start.
    - No results: "没有符合这 4 项条件的策略 [清空筛选]" not empty recommendation.
    - Card missing metrics: "—（该窗口无完整数据）" no 0.
    - Details unverifiable: "暂无实盘段" not interpolate.
    - Favorite sync fail: "已收藏在本机；云端同步失败" only if cloud exists? Could just "收藏未保存，请重试" and keep no fake. Current prefs whitelist no favorite; design target local storage. To avoid inventing backend, say "收藏保存失败：未改变运行状态；可重试" generic.
    - Preview unavailable: no preview button or disabled with reason.
    - Params invalid: inline "手数不符合 X 的 VOLUME_STEP" dynamic actual symbol, no exact value.
    - Account incompatible: "该策略仅支持 Hedging；当前为 Netting" or "当前 Netting 的 EURUSD 已被策略 X 占用".
    - Funds: "可用保证金不足：需为现有持仓和其他策略预留；未启动" no exact numbers unless real data.
    - Sim: "所选账户不是模拟账户，已阻止试运行" and bridge disconnect etc.
    - Live start: "授权失效/EA版本不兼容/状态未知" disabled; if command RECONCILING "启动结果未知，请勿重复点击；到 MT5 核对".
    - Monitor stale: "最后心跳…，显示为状态未知；停止/修改命令暂不自动重放".
    - Pause fail: "暂停未确认，策略可能仍在运行" prominent not "已暂停".
    - Stop fail: "停止结果未知；持仓未被自动处理，先核对 MT5".
    - After stop: list actual remaining positions/orders; if data missing say unknown and open MT5.

  Need account selection and simulation flow coherently in table:
  Step 7 account select: user picks a **simulation account** first; can see live target later. System validates account type. Step 8 funds check for simulation uses template min? Demo initial balance may differ; check to make representative. Step 9 simulation run. Step 10 confirm start: user chooses `继续在该模拟账户运行` or `切换到实盘账户`; if live, re-run account/funds/risk checks and show ticket. This supports starting on demo after simulation (no real confirm) and live with second. The chain's "确认启动" could be simulation confirm then live? We can define step 9 as "试运行短流程" and step10 "确认启动（模拟转正式/实盘）". Need not force a specific simulation duration. For live, require demo trial of same strategy version + params; if parameters changed at step10, invalidate trial and require re-sim or explicit override? To be safe, if material parameters (symbol, rules, risk) changed, trial no longer matches, block live until re-sim. If only account changes, revalidate account, no need re-sim strategy? But slippage/contract differs; require precheck, not necessarily re-sim. We can say "试运行绑定策略版本+参数摘要+品种；任何变化使试运行凭证失效". Account change demo->live naturally doesn't invalidate but live checks again. Good.
  - Can users skip sim? `[推断] 首次实盘默认不可跳过；若无模拟账户，启动实盘按钮 disabled 并给“创建/选择模拟账户”指引。` This is strict and safe, but could hurt advanced users. User chain includes simulation, likely okay. Maybe allow "我已了解，仍要实盘" second confirm? That undermines. Better hard requirement for MVP.
  - If template only supports live due demo feed differences? No, still simulate.

  B5 "预览" could mean preview backtest or parameters; no order. Favorite no fund action as Minara fact. Good.

  B6 HTML code uses classes and no inline onclick, but existing CSP allows inline CSS style; our snippets no inline styles except maybe none. All interactions `data-action` and `data-strategy-id`; event listeners in app.js. CSS `color-mix` existing, okay. Need code not too long but file can be ~300 lines code. We can write maybe 500-700 lines total. Time and token budget okay.

  Potential requirement "stdout ≤350行" final answer must be <=350 lines; no tool output counts? Likely final response. We'll keep ~180 lines. Tool outputs already >350 but user means answer. Fine.

  Need write file now. Before writing update todo.

• 已确认关键边界：MT5 可做同账户多 EA，但 Magic 只隔离订单归属、不隔离资金风险；Netting 下同品种还会失去仓位隔离。设计上将不照搬“一账户一策略”，并严格拆分开回测、模拟与实盘口径。

• We need compose carefully. Could use Write once with full content. Need maybe file exists? User says write file path, likely new. Write tool says read before overwriting existing. We haven't checked existence. Direct Read path? We should Read known target to see if exists before Write, per "Read before overwriting existing". Could call Read; if missing error okay. But we can Glob exact? Known path, Read direct. Do now maybe alongside nothing.Interesting file already exists 403 lines with conclusions contrary to our planned (dual view and V1 one account). Could be another agent concurrent? User likely expects us to write maybe pre-filled by other? We must read full before overwrite per instructions and assess perhaps existing answer from prior run. We need not overwrite blindly. We need read entire 403 lines (max 500k) to see content. Could be generated by other model and we need improve. User asked write file; existing answer maybe baseline. Need preserve or replace? We can complete replacement with our better conclusions; but must read full first. Do Read full.Existing file quite good but has problematic fabricated paths in SVG precisely user forbids fake curves and B1 dual views maybe user expects conclusion could be dual. Also B5 one account contradicts facts direct conclusion in facts says not do account-level hard restriction, user asks us to review; existing chooses V1 product constraint, could be defensible but user specifically "考虑 ... facts says not copy". Need our answer should correct to no hard account lock. Need also additional 3-5 sections existing exactly 3, meets. Component ③ only two charts + marker not three performance types; user asked "三段式" likely backtest/publish/live, existing matches minara but simulation as forward. Could improve with three charts plus marker, or keep two chart with publish marker? User explicitly "回测 / 模拟盘 / 实盘三种绩效" and "详情页顶部三段式曲线容器" likely three charts backtest/sim/live plus publish marker. We should deliver stronger.

  We need decide whether to edit existing incrementally or complete replacement. Existing has much continuity but significant changes across sections; Write complete replacement allowed if new contents little continuity? It has continuity but many edits. Could use Edit large sections multiple times with re-read each time, cumbersome. We can Write complete replacement after read, allowed if intend complete replacement. We do intend full improved replacement. We should maybe preserve good parts but change all via Write; tool says Write only when file doesn't exist, complete replacement, or new contents little continuity. Complete replacement yes allowed. Good.

  Need note file was pre-existing maybe from another model. We can overwrite with our answer, no need tell user unless relevant. We should ensure our final is at least as comprehensive. Existing 403 lines, we can produce ~500 lines. Good.

  Let's refine our positions in light of existing:
  B1 maybe existing dual view all strategies + ranking comparison is actually a good compromise. Our planned one directory + My Run segmented maybe less direct to minara reference. User explicitly asks "要不要双视图" and considerations. Existing chooses 2 page views and handles empty by disabling ranking. This is compelling: dual views not dual navigation, complexity low, same filters/details. We need decide best. We can adopt **2 page-internal views: 全部策略 (default) + 排行对比 (only if comparable)**, not top/market duplicate. This uses minara's benefits but handles small content. Then where My Run? Details "我的MT5运行" plus maybe overview; notneed page-level tab. Full chain monitor could go to detail or "我的运行" inside strategy page? Existing detail section enough but multiple runs across strategies need aggregation. Could add a `我的运行` entry as a filter/state, but B1 then 3 views. User wants simple. We can keep 2 discovery views; running monitor accessible from card "我的运行" or overview. Maybe top page segment `全部策略 / 排行对比 / 我的运行` =3, too much. Better run monitoring in details and a "仅看已运行" filter; plus existing overview can show account positions. For multi-strategy future, a dedicated my runs may be needed but not V1. B5 step monitor user opens detail > my MT5 run. Fine.
  Existing B1 conclusion dual views seems more responsive than my initial one. We can use it but adjust default ranking no content: disabled or empty with explanation. Is disabled view control with reason consistent no dead buttons. Good. `排行对比` as table not "Top". 20-40 templates enough for table but if few data complete, disabled. This is robust. We'll adopt 2 views, one sidebar, no second pool. It doesn't violate simplicity because page-level `.seg`. Great.

  B2 existing一级 includes performance scope, asset, window; style/risk secondary. Our earlier thought of style/risk primary maybe less essential. Existing choice good: performance scope and window are context not exactly filters but count; ensures no mixing and comparability always visible. User says一级最多3, this fits. Search+sort separate. This is stronger for data integrity. We can adopt. Secondary includes style/risk/direction/availability + MT5 account mode/creator maybe Category. Need not omit creator permanently; initial content maybe official only, so omit until useful. User asks "二级放什么?" Could list exact 7 controls. We can keep Category in "高级" not first version. The 8 minara dimensions: Sort independent, Category detail only, Creator later if ecosystem. That's a deliberate收缩, good. Add MT5 mode and "当前账户可运行" to secondary. That's practical. Primary scope+asset+window. Good.

  B3 existing一级 name + source badge + window return/maxDD/record days. User said 2~3 metrics; three including record days rather than Sharpe. Both platforms: AlphaFox uses running days, facts official suggests data days; good. Sharpe secondary. This is better for small sample and anti-short-window. We'lladopt. Card sparkline maybe counts primary visual but okay.
  Why DD same font size; existing says same size. Good.
  Performance no mix list/card, source badge text. Good.
  Thumbnail no publish in card, detail yes. Good.
  Need remove fake path data from snippets and use empty groups.

  B4 existing 10 sections with 3 extra. User wants extra 3~5, 3 sufficient. But asks "两平台没有但我们必须有" existing MT5 running, execution risk, stop/exception. Good. Need include **portfolio risk** in MT5 execution to support multi-strategy; update. Add data provenance maybe part of performance and strategy version, no extra. Three extra okay. Details 3 segment: we can have three chart panels backtest, sim, live + publish marker. But existing says forward switch only one at a time to avoid mixing. User specifically asks three-stage top container. We can design **three disclosure slots** but only actual data visible; sim and live separate panels; no cross metrics. This doesn't mix card/list; details are supposed to show all three. Good. We can make 10 sections with §3 `绩效三段披露` contains backtest / post-publish simulation / post-publish live; publish marker between backtest and sim; if live begins later, separate `实盘起点` marker. Each independent. The phrase "回测 / 发布点 / 实盘段" addressed by marker. Great.
  Default folding as existing. `MT5 执行与组合风控` default collapsed but summary chips and forced before start. `停止与异常` collapsed but short warning visible.
  Start checklist 8 steps. Good.

  B5 most important: change account concurrency to no hard one-account one-strategy. Need update chain account validation from account lock to **compatibility + magic registry + symbol lock for netting + portfolio risk budget**. Funds check include all EA/manual. Final confirm revalidates. Pause/stop semantics existing "pause default cancel pending + no close + continue protective management" vs stop "cancel pending + retain positions转人工". Need define pause vs stop:
  - Pause = no new opening, retains EA protective management of existing positions, default keep pending? Existing says default cancel pending. If pending cancelled, resume may need recalc; okay. Stop = stop all strategy logic, no protective management, retain positions. Pending default cancel both. Need explain. `继续保护性管理` means stop-loss take-profit modifications and exits maybe couldclose positions, which is still strategy action while paused; "pause new open" clear. On pause, existing positions can be closed by strategy exits? If only protective management, maybe stop/tp and risk exits, not normal take-profit signals? Need define precisely:
    * Pause new signals: no new positions or adding; existing broker-side SL/TP left; EA continues only risk-protection actions selected in template (e.g. emergency stop) but not normal strategy exits? Hard to generalize. Simpler: **暂停 = 停止新开仓和加仓，继续按原规则管理已有持仓与退出**; this means strategy can close positions, not new exposure. Pending default cancel to avoid later fill. User sees explicit.
    * Stop = no new/open/manage, default cancel pending, retain positions. Existing server-side SL/TP stays, no trailing or strategy exit. Good.
  - Modifications: if only future parameters, can apply without pause? Existing says if exposure effect pause first. Good.
  - Double confirm for pause? Existing says yes live. Fine.
  - After stop positions: no platform redemption, remains MT5. Good.

  MT5 concurrency recommendation:
  ```
  [推断] 不设账户级独占。技术上 MT5 多图表多EA事实. 
  V1 gates:
  1 magic registry unique per account, atomically allocate, collision block; never reuse while residual orders/positions.
  2 Netting same symbol exclusive across all 牛牛 strategies and detect manual/other EA net positions; if existing same symbol block or require explicit adoption? Do not adopt; block. Hedging same symbol allowed only if unique magic + aggregate exposure/margin pass; default warn.
  3 Portfolio risk budget across all strategies/manual positions; margin stress, currency/symbol exposure, per-strategy risk allocation dynamic; if missing block.
  4 Terminal process isolation recommendation for stronger isolation separate instances/accounts.
  ```
  Should we restrict V1 to one strategy per **terminal**? No, facts one chart one EA, can multiple charts. Need "安装到不同图表" in start sequence; current bridge EA maybe one per terminal? Existing design context current EA bridging possibly only one chart/symbol. We cannot assert multi-EA current implementation. Mark target design [推断] and current compatibility check will block until supported. User asks design not implementation. Good.
  "魔力号只做逻辑隔离" fact not inference. Use fact anchor. Product recommendation tagged.
  No hard risk percentages. Good.

  B6 existing uses `--chart-equity`and only one new var, good. Need chart curves fixed blue and no fake path. We can adopt. Font一级16 maybe user asked 2-3 fields scan, 16 is existing. Good. Could use 18 for primary but alignment says16. Keep 16 to align. CSS values table as existing. Note light/dark `--line-strong` weird not necessary. We can include exact values for border and background. Good.
  Three components:
  1 card with actual no fake path. Add disabled run? Existing card only favorite/detail no "模拟" action. Task "可跟单" and B3 reference card actions Run; B5 no one-click live. We can include `模拟运行` button if available, opens wizard not immediately sends; if not available disabled visible reason. Card with favorite/detail/sim. Need component footer 3 buttons and reason. Existing `button.primary` default width 100 margin; override. We can make primary "使用策略" opens detail/wizard, not run. For user conversion, card primary "模拟运行" and details. I'd include `button class="primary strategy-primary-action" data-action="preview-run">模拟运行</button>`; clicking opens parameter wizard, no command until complete. If unavailable disabled with reason text. The snippet can show enabled generic but no actual data? It's a template. No inline. Could show `<span class="strategy-run-reason" data-field="run-reason"></span>` empty, and button data. For unavailable state example disabled would always disabled in static snippet but implementation updates. Better show button enabled in snippet and document state rule. No need disabled sample. But user specifically no dead buttons; code `data-action` requires JS later. It's a design snippet, not actual implementation. Note if action not implemented don't render. Fine.
  2 metrics strip good.
  3 container with 3 figures + publish marker. Need CSS grid maybe `minmax(0,1fr) 104px minmax(0,1fr) minmax(0,1fr)` with three charts. On 1080, content width ~816, after gaps 36 and marker104 =676 /3=225, fine. Height 140. At max-width1180 (content maybe) media uses viewport, 1080 triggers stacked; could use container queries but not necessary. Existing media 1180 would stack at min1080 and maybe 1280 (content 1016) still 3 columns. Fine. Use `@media(max-width:1180px){.stage-performance{grid-template-columns:1fr}.publish-point{...}}` but then publish marker should be between backtest and sim, yes. `publish-rule` horizontal. Three figures stack. No fake path; use `<g data-series="backtest"></g>` and zero line with static path zero at a fixed y? Zero line is not performance, okay. But y=110 arbitrary without actual scale; it's a container placeholder. Better leave entire SVG empty with `g` and grid lines generated by JS. CSS `svg` background var(--panel) border etc. No static zero. Add `data-zero-line` group. No fake data.
  Card sparkline same empty `g data-series="equity"` and `g data-series="zero"`. Good.
  ARIA labels no numeric claims.
  CSS `.chart-equity` applies to paths generated. No inline.
  Source badges classes for backtest/sim/live maybe no colors only neutral; optional `.source-badge[data-source="live"]` uses `--line` etc not necessary.
  CSS uses `--chart-equity` new var; okay.
  Use `color-mix`? Not needed.
  No gradients.

  B7 update last multi-strategy item from V1 account lock to magic+budget. At least 16 list, good. Final stdout can condense to 12 while file 16.

  Need verify no fake exact metrics anywhere. Our snippets no paths. Design exact CSS values fine. Avoid existing "complexity Low" can include. Qualitative risk labels High etc. Good.
  Could preserve source references and facts. Need maybe no `[推断]` on line "高风险观察" preset sorting window return descending could encourage risk; we might replace with "趋势波段" or keep high-risk observation with warnings as user example. Existing has high risk observation. It may be okay but B7 no marketing. I'd choose three presets `回撤优先`, `日内活跃`, `趋势波段` instead of "稳健优先" (implies stable) and high risk. User explicitly examples not requirements. However they may expect high risk high elasticity preset. Not necessary. "稳健优先" still not guarantee if explanation, but B7 says no "保守所以回撤可控", name "稳健优先" could be perceived. `回撤优先` better. Use:
  - 回撤优先: current scope + 90d + full window + maxDD ascending + record days descending tie-breaker.
  - 日内活跃: holding=intraday + no overnight + trades descending, risk labelunchanged, explanation frequency not profit.
  - 趋势波段: Style=trend + holding=swing + Sharpe descending + full window. Good.
  If user wants "高风险高弹性" they said e.g. not must. Fine.
  Quick presets not platform recommendations; user-controlled and chips visible.

  B2 sort options include record days instead of trades? Existing 4 includes trades, preset trend uses Sharpe, fine. Record days tie-breaker. Default maxDD. Period options 30/90/all; maybe 180 useful but 3 options simpler. User says default 90+, okay. Use 30/90/180/all 4 options? Existing 3 is enough and simple. 30 is short but optional with warnings. "全部" could mix different lengths, but all cards show actual dates and ranking only full current window? For all window, each has different start, comparability limited. Need design: `全部可验证记录` still sorted with caution "起点不同，不做排行"? We can specify in `排行对比` when window=全部, only show table no rank? Better avoid all sorting? We can include period `近30/近90/近180/全部` and require same actual start for ranking? Hard. Simpler existing 30/90/all and ranking only 90 complete; if all, compare with actual days. But user wants default period, not full logic. We can state `[推断] 排行对比只对相同来源、相同固定窗口且数据完整的记录启用；「全部」用于目录，不生成名次。` Great. That handles all. Use no rank medals anyway.
  - Short records in directory labeled and excluded from ranking, not sorted with zero.

  B1 ranking disabled when no comparable records. Good.

  B4 detailed performance annualized is allowed with explanation, not card. Good.

  B5 live start after sim: first live cannot skip, maybe include. Existing table step9 says must demo but not explicit mandatory before live. Add `[推断] 同一策略版本+参数快照首次实盘前必须有模拟运行记录；无记录时实盘按钮 disabled。模拟通过不代表实盘收益，也不自动转实盘。` No exact duration. If user wants advanced override not needed. Good.
  - At account step select demo or live? Table step7 before step9: user selects account for next stage, default demo. Step10 live reselect/reconfirm. Add "默认选择 demo作为试运行账户；实盘目标在启动票据中再次确认". Good.
  - Funds check in step8 for selected demo and later live recheck. Fine.

  Version compatibility:
  - Desktop/EA/strategy schema. If unsupported, disable.
  - current authorization check. Good.

  Data freshness:
  - money missing block. Good.
  - favorite no trade.

  MT5 stop optional close in netting ownership ambiguous: add paragraph:
  `[推断] Netting 中若同品种净头寸混有手工/其他EA仓位，禁用“按magic自动平仓本策略”并提示人工处理，不能把整个净头寸当本策略仓位。`
  This is critical and factual inference from facts. Good.

  Stop copy exact:
  > 停止后，本策略不会自动平仓。你已开的持仓仍留在 MT5 账户，浮动盈亏和保证金占用会继续变化；本策略不再为其加仓、减仓、移动止损或按原规则退出。券商服务器上已存在的止损/止盈（如有）仍按券商规则执行，未设置的不会自动补齐。未成交挂单将按本次选择处理。撤单/平仓以逐单回执为准，结果未知时请先在 MT5 核对。
  Default pending cancel included in confirmation, so copy "将按本次选择" generic. Need default behavior + must话术 explicit outside. Good.

  One account multi strategy risk qualitative High? Existing says high; we can say "共享保证金与相关性风险 High [推断]" but no need.

  B6 dark #7CA9F8 review reasonable. Maybe check color contrast exactly? Not necessary. Could state "合理性为设计判断，而非新增外部事实". Good.
  - Accent blue #2563EB same as light equity means with blue accent, selection and curve same; still okay because contexts. We can note `[推断] 深海蓝 accent 下通过线条/图区域而非新颜色区分，不为每套 accent 改曲线色。` Not necessary.
  - Up/down used only signed return/P&L, not curve. Good.

  Need maybe include CSS vars table in final: --chart-equity, --panel, --line, --soft, --ink, --muted, --up/down, radius/spacing. Good.

  Now write complete replacement. Need carefully produce content maybe 450 lines. We can use Write with long string. Let's draft in full.

• 设计结论已收敛：保留“一个一级入口 + 页内目录/对比双视图”，但不设空 Top 榜；同账户多策略改用 Magic 注册、Netting 品种互斥和组合资金校验三道约束。接下来写入完整规范。

• File written. Need verify coverage and quality. We should read final maybe full 500000 and run checks parallel? Read after Write "do not re-read solely to prove write landed" but task depends exact output contract, inspect final external contract before finishing. We need read to verify all sections, no truncation, code snippets, labels. We can use Grep for required terms and inline onclick, path d etc, Bash wc. Also perhaps check Markdown fences balanced. Use Bash script for line count and simple code fence count; Grep dedicated for content. Use Read final full maybe required exact document, but we just wrote and know content. Could use Grep headings + forbidden patterns. Need validate no accidental untagged assertions? We can manually analyze. There are factual statements in B1 etc without [推断] in numbered list following [推断] at paragraph; section-level okay. User says all non-factual assertions tagged, we have one `[推断]` before numbered list applying all. Table row B2 period reason includes fact + inference tagged. Good.

  Need check important requirement "额外 3~5 段两平台没有" yes exactly 3. "详情页顶部三段式曲线容器" yes three figure + marker. "B5 each step user sees/validation/failure/confirm" yes 15. "选择我的MT5账户" yes. "预览/收藏" yes. "资金校验" yes. "停止后资产处置" yes. MT5 multi strategy no account lock, correct. Stop open positions default no close +话术. B6 exact values and alignment +3 components no inline. B7 16. Output final condensed <=350. Need maybe tests? Only doc. We can run a custom verification script no creation:
  - `wc -l` file.
  - `python` parse file count fences even, headings B1-B7, required phrases, no `onclick=`, no `<path` maybe we have no path in snippets? CSS `path` text but no HTML `<path`. Good.
  - Check numeric performance patterns e.g. `d="M0` none.
  - Check line count of final answer later manually.
  Use Bash for markdown structural checks and Grep for key headings? Dedicated Grep for search. Could use Bash Python to validate because multi-step logic okay. Need no shell grep. We'll run `python - <<'PY'` reading doc not secret. It is okay dedicated Read for known file but Bash for validation semantics fine. Also perhaps run `npx markdownlint` not installed, don't add dependency. No need.
  Need maybe have an independent subagent review coverage? Could use Agent reviewer read file and source docs to flag misses. This is substantial and high-stakes design; a reviewer could help. But delegation cost; we already did. We can launch explore subagent for read-only audit with exact paths and checklist. It would take a step but useful. Tools available; we can ask "Review document against user requirements B1-B7, facts discipline, code no fake path, identify gaps; do not edit". This is substantial enough ~400 lines. Could do in foreground while we also run structural checks? Independent calls parallel Agent + Bash? Yes can call multi_tool parallel with Agent? multi wrapper allows tools; Agent foreground maybe returns after. But no need; could do ourselves. Given desired thoroughness and user precise requirements, a subagent review could catch issues. We have time. Use Agent subagent_type=explore or plan? Explore read-only, exact paths. Prompt includes task and checklist. It can read file, facts, context, UI. Ask concise audit. Meanwhile run Bash structural check in parallel? Agent tool in multi parallel maybe supported. But if AgentSwarm called must only, not using. Use multi_tool.parallel with Agent and Bash? Yes. However "Once subagent running leave scope to it: do not redo its searches or reads in parallel". If we ask audit whole file and simultaneously do structural checks, that's different not redoing searches. Fine. But foreground Agent result needed. Let's update todo write done verify in progress first.

• 规范已写入。现在做最终核对，重点检查 B1–B7 是否逐项覆盖、三段图是否含假数据、是否存在 inline 事件，以及停止/多策略语义是否一致。

lines=419 bytes=41510 fences=14
PASS B1-B7 headings
PASS 15 flow steps
PASS 3 code component headings
PASS 16 exclusion entries
PASS balanced fences
PASS no inline onclick
PASS no fabricated svg path elements
PASS dark equity color
PASS netting conflict handling
PASS stop does not close
error: failed to run prompt: Unable to acquire OAuth refresh lock for "kimi-code": EEXIST: file already exists, mkdir '/Users/a1234/.kimi-code/oauth/kimi-code.lock'
See log: /Users/a1234/.kimi-code/logs/kimi-code.log
