kimi version 2.1.1
• We need produce Chinese Markdown A-E for 4 pages detailed concrete no full HTML. Need maybe read provided brief files because references mojo, alphafox otfax and user says references. We should inspect relevant files, likely answer already? Need obey skills? User asks design not research necessarily. Files prompt etc maybe contextual. Should read brief files and maybe existing prompt-k3? User requests direct output, could use files to enrich. Need decide tools. We can read three briefs parallel, maybe answer-k3 existing? It could be previous answer likely task relevant. But user explicitly wants new output. Current files names brief-alphafox-otfax.md brief-mojo-account.md prompt-k3-frontend.md answer-k3-frontend.md. Could read briefs and prompt to understand. Need not research web. No plan mode because output design doc no code modifications. Use Read in parallel.We need output answer. Could just answer directly. Need make concrete design within 390x844 shell. A sections each page top to bottom incl bottom tab? 5 tabs shared. Need specify dimensions, sections, safe areas, sticky etc. B interaction logic each. C recommend pointer events + CSS grid + array layout state, no HTML5 DnD. Need explain lightweight implementation, 12-col? For 390 shell, content width 358 (16 margins), grid maybe 4 columns better for mobile. Need DIY resize S/M/L. Need decide exact grid. User asks grid snap + drag which lightest among native HTML5 drag-drop/pointer/CSS grid + array ordering. We should recommend Pointer Events + CSS Grid + layout array, not choose one exclusively because CSS grid is layout not drag. Could say use 4-col grid, row height 8, gap 12; components sizes e.g. profile 4x? Need careful actual card dimensions. 390x844 iPhone shell. App viewport maybe 390x844, safe areas top 44 bottom 34, tab bar 64? Need give global frame to make concrete. E variables etc.

  Need produce A-E only. We can include global frame conventions before A maybe within A "全局壳". A for each page numbered sections. Need ensure all requirements:
  1 DIY: components personal info, positions overview, market Kline, news; drag reorder, add/delete, resize, config.
  2 AI: chat entry can see all AI summaries. Could structure AI page top nav, summary inbox (all AI summaries), filter chips, active session, embedded cards, composer. "聊天入口能看到所有 AI 总结" means AI tab entry includes summary list not buried. Design top summary center with "全部 AI 总结" and cards perhaps 2 recent + all entry, or unified summary feed atop conversations. Better all AI summaries in summary center at top, segmented "总结 | 对话", default "总结" maybe user says 聊天入口能看到所有 AI 总结. Could design page default has "AI 总结" section (latest 3 + 查看全部) plus conversation list? But "所有" not just latest. Could have top tab "总结 / 对话", default "总结" showing all summary feed. Yet AI copilot chat entry should see all summaries. Maybe top "AI 总结收件箱" as horizontally? All AI summaries means all types not necessarily every item. Need concrete: default "总结"tab list with infinite scroll all summaries and filter chips (全部/持仓/行情/策略/风控), "对话" tab for chat. But then embedded cards in conversation. Section list can account dynamic views. Interaction chain open summary -> generate context card -> continue ask in chat. AI summaries types daily account, position risk, market, strategy. Need include unread dot and timestamps.

  Strategy cards metrics, follow flow. Card HTML skeleton D single card DOM hierarchy annotate fields. Include buttons accessible and data fields. E CSS variables, card common style, numbers, colors. Could include actual snippets but not full HTML. They want skeleton and CSS key specs. We can include CSS blocks for variables/card/numeric. No full HTML.

  Personal account 8 items grouped sorted:
  - profile header? They say 8 items. We can include compact user header (avatar nickname ID) not one of 8 maybe okay. Minimal.
  Group 1 账户与额度: 授权状态 (status badge + chevron), AI 网关 (status + remaining credits + chevron), 充值入口 (amount or "充值" button maybe row with orange text + chevron). Should recharge next to AI gateway.
  Group 2 邀请与偏好: 邀请链接 (copy button), 主题 (segmented control maybe tap row action sheet with 自动/浅色/深色; since design light but theme item), 设置 (chevron). Or grouping "分享与偏好" weird. Better 4 groups:
  1 账户与授权: 授权状态
  2 AI 服务: AI 网关, 充值
  3 通用: 邀请链接, 主题, 设置
  4 帮助与支持: 使用教程, 客服联系方式
  But invitation in general weird. Could group "账户与服务" (authorization, AI gateway, recharge), "分享与偏好" (invite, theme, settings), "帮助与支持" (tutorial, support). 3 groups. This is reasonable. High frequency auth and quota top; invite lower; destructive none. Settings maybe general before invite? Sorting within group: 邀请链接 (growth but user task), 主题, 设置. More logical "偏好与分享": 主题, 设置, 邀请链接. But user asks group ordering, not fixed. Need choose high-frequency and task flow:
  Section account: compact profile header
  Group 1 交易与 AI 服务: 授权状态 → AI 网关 → 充值入口Group 2 偏好与分享: 主题 → 设置 → 邀请链接 (but invite likely before preferences? Brief suggested "付费与额度", "个性化", "帮助"). Could do 4 groups for clarity:
  - 账户状态: 授权状态
  - AI 服务: AI 网关, 充值入口
  - 通用: 邀请链接, 主题, 设置
  - 帮助: 使用教程, 客服
  This creates one-card single row for auth, maybe okay. "极简" fewer group headers/cards maybe 3 groups better:
  1 账户与服务 (授权/网关/充值)
  2 偏好与分享 (主题/邀请链接/设置) but odd order. Could label "通用" and order 主题/设置/邀请链接. Invite at bottom before help. Good.
  3 帮助与支持 (tutorial/customer).
  Need list all 8 and controls. Theme could use "自动 ›" row opening action sheet with radio options, not inline segmented to preserve compactness. User asks specific control forms; a row with current value and chevron plus half modal segmented/radio. AI gateway "已连接 · 剩余 2,340 积分" status badge/chevron. Recharge row with orange "充值" pill button; pressing row maybe same. Invitation link row with "复制" bordered button and optional share icon; no full URL shown (shorten niuniuai.app/i/AB12CD). Authorization status with green? But green reserved for decline/fall? They specify跌绿 #17995B. Semantic success could use same green but E says semantic colors separated? We can define --success maybe #17995B but then confusion with down. Better authorization status uses deep blue/gray dot? Typically connected uses success green, same as down acceptable but E color discipline says green only negative/down, avoid success to preserve trading semantics? Need consider. Use --color-success: #17995B maybe but user says跌绿. Could use deep blue "已授权" with blue dot to avoid semantic conflict. Or define `--success:#17995B` but E says 涨跌 use only data; state can use neutral? We can explicitly: 交易数字涨跌 only red/green, button not use red/green; authorization state use `--success` same hue? This violates strict "跌绿" but not necessarily. Better define `--up:#E23B2E; --down:#17995B; --success:#17995B`? In Chinese trading apps green often success too but could confuse. To be concrete, use neutral/blue for normal status, red only errors? Error red same as up. Need separate semantic `--danger:#D92D20` but not requested; extra colors maybe unnecessary. E "涨跌色用法" should specify not use red/green for primary buttons or positive/negative account status? Usually can use success green. We can say:
  - `.up`, `.down` only on quote/PnL/return/drawdown? Max drawdown should be negative and green? In Chinese market, drawdown is risk metric, often green if negative? Strategy card max drawdown -12.4% could be green because negative. But semantically drawdown should maybe neutral/negative green per涨跌. Need specify annual return positive red, negative green; net PnL same; max drawdown shown as positive magnitude e.g. `12.4%` with label最大回撤, use neutral/dark or green? Requirement only show max drawdown. Best use `−12.40%` green to obey sign color, but risk emphasis maybe deep blue. We can specify: "收益/涨跌/净值变化按正负着色；最大回撤始终用绝对值 + 中性深灰（不因是负数而当跌涨信号），避免误导". But then numeric field `-8.4%` maybe no. Use `8.42%` with label最大回撤 and neutral #5B6474. For card skeleton include `8.42%`. Annual return red if positive. Sharpe and trades neutral. Sparkline red if period net positive, green if negative, no orange. Follow button orange, followed state light orange or neutral? "已跟单" state maybe deep blue tinted with check, button disabled? Could be secondary "已跟单 · 管理" not disabled, tap opens management. Need chain final state. D button data-state following, text已跟单 with check and maybe manage. Need include risk disclaimer near follow button or footnote "历史收益不代表未来表现". Fine.

  B strategy follow flow detailed numbered:
  1 tap follow, if not authorized -> auth interstitial then resume; maybe mention risk disclosure first time.
  2 bottom sheet with strategy summary + risk notice, default amount etc.
  3 amount input with available balance, min/step, percent chips, risk params (max loss stop, copyratio, max position) maybe simple required amount/risk.
  4 validate real-time, estimated allocation and stop-loss; button disabled if errors.
  5 submit with confirm (maybe Face ID not needed). prevent duplicate, loading.
  6 result API success update card by strategyId in list/detail and show "已跟单"; failure keep values, toast retry.
  7 tap followed opens manage sheet to adjust/stop. Not requested stop but useful.
  Need no overly long.

  Home DIY interactions:
  1 view mode default; tap编辑 or long press card enters edit.
  2 edit mode: grid outlines, drag handles, each card overlay config and delete; tab bar maybe hidden? Could keep. Sticky nav changes to取消/保存.
  3 add component via + opens bottom drawer with four components and disabled existing if singleton.
  4 drag: pointerdown on handle, long press 180ms? To avoid scroll, drag handle immediate vs card long press. Use handle for light implementation. Set pointer capture; transform ghost, compute target; update preview placeholder; on pointerup commit to draft array; on cancel restore snapshot.
  5 resize: tap size control in config sheet S/M/L options with allowed per widget. Layout auto compact; no free resize on 390.
  6 config: symbol, timeframe etc per component; draft apply.
  7 delete confirm maybe no confirmation if undo toast? Use delete -> toast撤销 5s, better lightweight. Save persist localStorage for HTML preview.
  8 cancel restore initial.
  Could be 6 steps. Include per-widget config list in A or B:
  - profile: show account, hide balance, currency?
  - positions: account, sort, P&L period
  - Kline: symbol, interval, indicators
  - news: topics, sources, unread only
  We can put in A section descriptions or B configuration step.

  A home sections:
  1 status bar + top nav (title 牛牛AI, account status? edit +).
  2 edit toolbar only editing (layout instructions, undo? save/cancel).
  3 widget canvas in order default: personal info, position overview, Kline, news.
  4 add component tile at end in edit mode.
  5 bottom tab. Each section one sentence. The request "每个页面的区块划分（从上到下的 section 清单，每个 section 一句话说明）". We can list 6 with one sentence. Include dimensions? global frame intro:
  - 390×844, page content width 358, 16 padding, 12 gap; status 44, nav 44, tab 64+34? Need not exact but helpful.
  "全局骨架：状态栏 44 / 顶部导航 44 / 内容区滚动 / Tab 64 + Home Indicator 34; content padding 16; tab labels etc." iPhone 390x844 actual status bar 47? iPhone 14/15 390x844 has top safe area 47, bottom 34. Use 47 and 34. Single file preview could use status 44? Better accurate iPhone 13/14 390x844: safe-area-inset-top 47px, bottom 34px. Nav 44. Tab bar 56 + 34? Total 90. 5 tabs each 78 wide. Content bottom padding 106. Include in A "共用壳". Not overdo.

  AI sections:
  1 Nav "AI 副驾驶", right "新对话".
  2 Segmented control "AI 总结 / 对话" default summary? If all summaries visible and chat entry. Maybe use top two tabs. "AI 总结" page shows all summary feed, "对话" shows conversation history. But user asks conversation embedded cards. We need describe chat detail sections separately.
  3 summary filter chips.
  4 summary stream cards (all).
  5 recent conversation entry maybe when summary view. Alternatively default "对话" view has pinned "AI 总结" horizontal panel? Hmm.

  Could design single scroll AI home:
  - Top nav
  - "AI 总结" inbox card/list (latest 2 plus "查看全部 N"—but not all visible, fails all)
  - Segment all summaries with full feed.
  Better: AI page itself is a chat list with top tab "总结" and "消息"; default "总结", all summaries. On selecting summary, detail has "继续追问" opens chat with summary context. New chat/chat history via second tab. In A we can show two states:
  AI 入口页:
  1 nav
  2 segmented summary/dialogue
  3 filters (summary) or search (dialogue)
  4 content list (summary all / dialogue all)
  5 composer only chat detail
  6 tab
  AI 对话详情:
  1 nav back/strategy title
  2 message stream with cards
  3 quick prompts
  4 composer
  This is more than one page but acceptable. User asks 4 pages; AI detail subview. We can list page section with dynamic states. Need one sentence each. Maybe A 2:
  - 顶部导航：...
  - 二级分段：总结 / 对话，默认总结。
  - 总结筛选条 ...
  - 总结流/会话列表 ...
  - 对话详情消息区（进入会话后替换列表）...
  - 快捷提问 + 输入栏（仅对话详情）...
  - bottom tab (entry only; detail can hide tab to give keyboard space). Could be concrete.

  AI summaries content: each card icon/type, title, 3-line digest, time, unread, related symbols, action. All AI summaries loaded paginated. "所有" means all categories and history, include "全部" filter default and chronological paginated.
  AI chat embedded quote card: symbol name, price, change red/green, mini sparkline, time, action "查看K线"; equity card: period P&L, current equity, mini curve, period selector. Cards insert below AI bubble and are horizontally full width 286? Need in A or B. B AI interactions:
  1 enter default all summaries; filter.
  2 tap summary expands detail (or bottom sheet) with full summary and evidence cards; mark read.
  3 "继续追问" opens chat and inserts context chip.
  4 send prompt -> user bubble, AI streaming with stop; structured data renders as quote/equity card not image; loading skeleton/error retry.
  5 tap quote card -> home Kline or symbol detail; tap equity -> positions; card actions "加入看板" maybe optional.
  6 new chat/history persisted local preview. Avoid scope creep.
  Need specify market card can be interactive? tap to expand.

  Strategy A sections:
  1 nav title strategy square, search maybe.
  2 hero? Avoid marketing. Filter chips (全部/趋势/震荡/套利 etc) and sort.
  3 featured? Not required; skip.
  4 strategy card list.
  5 risk footer.
  6 bottom tab.
  Could include sticky filter/sort.
  Each card layout fields per D.

  D DOM skeleton should be HTML-ish indented no full file. Need show `<article class="strategy-card" data-strategy-id data-following>`:
   header:
    div title row (icon, name, tags, favorite button)
    div meta (provider, running days, followers)
   section main:
    div annual return label/value
    sparkline svg (equity curve + baseline optionally)
   ul metrics:
    li sharpe
    li max drawdown
    li trades
   footer:
    small risk/updated maybe
    button details (whole card clickable? Nested interactive issue). If card whole click plus favorite and follow button, accessibility use separate details button. Could have card body link details with stretched-link but nested buttons tricky. Better `<a class="strategy-card__main" href="#detail">` around header/main/metrics and footer separate? But D expects single card DOM. Use `<article>` with `<button class="card-hitarea" aria-label>`? No. Simpler `<article>` click handler ignoring buttons; but semantic accessibility not ideal. Could include `<a class="strategy-card__detail">查看详情</a>` in footer. Then card not entire clickable? B says tap non-button area opens details; implement article onClick with checks. Could use `<a class="strategy-card__body">` wrapping display content only; footer outside contains follow. Header favorite can't nest inside a. Put favorite separate absolute. D can be accessible:
  article
    a.card__detail (header+body+metrics)
    footer (updated risk, button follow)
  But header contains favorite, cannot nest button in a. Could omit favorite as not required, but brief says operations optional. We can include trailing chevron rather than favorite. The user didn't require favorite. Better card DOM:
  article
    a.card__main (aria-label details)
      header title etc
      section performance
      ul metrics
    footer
      small disclaimer
      button follow
  No nested interactions. But user may expect favorite? Not needed. Strategy provider etc. Include badges. Footer details link inherent entire main. Follow button state. Funds curve SVG with path and baseline. Annual return and curve hierarchy: left 112 wide value, right chart. On 358 card inner 326, chart 160. Need maybe `<svg role=img aria-label=...>`. Good.

  D fields:
  - strategy name "趋势猎手 Pro"
  - tags "趋势 / MT5"
  - author "AlphaFox · 实盘 428 天 · 1,286 人跟单"
  - annual return "+38.26%" as main.
  - curve period "近 12 个月" and svg path.
  - Sharpe "1.82", max drawdown "8.42%", trades "326".
  - Follow button "跟单" or "已跟单".
  - data-update.
  Maybe risk text "历史业绩不代表未来收益". The whole main anchor links detail.

  E CSS:
  `:root` variables:
  --brand-orange #FF6A1A; --brand-navy #0E2A5C; --bg #F5F6F8; --surface rgba(255,255,255,.86); --surface-solid #fff; --text-primary #17233B? use navy? Could set #152238; --text-secondary #667085; --text-tertiary #98A2B3; --line rgba(14,42,92,.08); --up #E23B2E; --down #17995B; --radius-card 20px; --radius-control 12px; --shadow-card 0 8px 24px rgba(14,42,92,.06); --page-x 16px; --grid-gap 12px; --tab-height maybe 56px; --ease-ios cubic-bezier(.22,1,.36,1); --blur 20px.
  Could include font stack `-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", sans-serif`. Number `font-family: "SF Pro Display", ...` but `SF Pro Text` not publicly available? iOS preview on browser uses system. `font-variant-numeric: tabular-nums lining-nums; font-feature-settings:"tnum" 1,"lnum" 1;`.
  Card:
  ```
  .card {
   background: var(--surface);
   backdrop-filter: blur(20px) saturate(160%);
   -webkit-backdrop-filter...
   border:1px solid rgba(255,255,255,.75);
   border-radius:20px;
   box-shadow...
   padding:16px;
  }
  ```
  Need note backdrop-filter on actual scroll cards can performance; prefer solid white with subtle blur only sticky nav/tab? User requests frosted glass cards, so okay. Could specify fallback `@supports not` white. Use `background: rgba(255,255,255,.88)` on #F5F6F8.
  Interactive press `transform: scale(.985)` only buttons not whole card maybe.
  Numbers sizes:
  - primary asset/return 28/34 700
  - price 24/30 700
  - card metric 16/22 600
  - label 12/16
  - align right, use non-breaking, plus sign.
  - currency and decimals fixed. Need not full CSS.
  涨跌:
  - `.up {color:var(--up)}` `.down{...}` `.flat{color:...}`.
  - background badges use 8-10% alpha. CSS hex alpha maybe `#E23B2E14`, `#17995B14`.
  - Kline candles filled red up, green down; curve based on period net change, not orange brand.
  - orange only brand CTA active tabs highlights; navy headings/icon anchor.
  - don't use red/green for follow button or tabs; focus outline navy/orange.
  - positive returns with `+`, negative with `−` (U+2212), neutral no color. Drawdown magnitude neutral? Include clear.
  Could define `--color-danger`? Not necessary. Authorization statuses maybe use navy/orange. But error state red can use `--up`? E "涨跌色只用于行情/收益，授权异常用 icon+文字，不仅靠色" and define `--danger:#C4320A` maybe adds non-brand. Could avoid discussion. For personal status, use text badge deep blue for authorized, orange for pending/unauthorized? Unauthorized is warning not error. "未授权" gray + orange action. Good.

  C implementation detail:
  - Layout model:
  ```
  layout = [
   {id:'profile', type:'profile', x:0,y:0,w:4,h:14,config:{...}},
   ...
  ]
  ```
  Need choose grid metrics. 4 columns, `grid-auto-rows: 8px`, gap 12. Height in units tricky CSS grid row gap causes total h*8+(h-1)*12 if spanning rows, requiring height calculations. Better use CSS grid 4 cols with named size presets and `grid-auto-rows: 8px` where gap included in track sizing; height of widget spanning n rows = n*8+(n-1)*12. For h=14 gives 112+156=268, too large. Could use 8px rows with gap 12 and spans e.g. profile 10 -> 80+108=188. Position overview h=12 -> 96+132=228; Kline h=20 ->160+228=388; news h=20 etc. But resizing drag computations with `y` in row units and auto-placement complex. Could simplify use CSS Grid with 4 columns and fixed card heights per size, `grid-auto-rows: 96px` and cards span rows; gap 12. Sizes:
  - S: 2 columns × 1 row = 173×96? content width 358, gap 12 -> col width (358-36)/4=80.5, 2col=173. S good for compact stat, not for all four.
  - M: 4 columns × 1 row = 358×? 180? grid-auto-rows fixed 96, can't.
  Could set `grid-auto-rows: 80px`; S 2x1 (173x80), M 4x2 (358x172), L 4x3 (358x264). Kline L 264 maybe too short but okay. News L maybe 264. Profile M 172, positions L 264, Kline L 264, news L 264. "尺寸调整 S/M/L" with component-specific options:
  S = 2×1 compact (only profile/positions? Kline maybe not S)
  M = 4×2 full width
  L = 4×4 full width 356? 4*80+3*12=356.
  But all required components likely full-width on mobile. Drag swap vertical plus half-width mini. Maybe simpler 2-column grid with fixed size presets:
  - S: span 1 col, height 120
  - M: span 2 cols, height 180
  - L: span 2 cols, height 320
  CSS grid `grid-template-columns:repeat(2,minmax(0,1fr)); grid-auto-rows:120px; grid-auto-flow:dense;` M can't height 180 with row spans. Use `grid-auto-rows:8px` size presets easier.
  Alternative 4-column 8px row grid and component presets heights independent of actual span using `grid-row: span n`, as above. We can give just width columns + row unit and sizes mapping:
  - S: `w:2,h:12` → height 12*8 + 11*12 = 228, not small.
  If gap counted only between rows, to get small height h=4: 32+36=68. M h=12:96+132=228. L h=20:160+228=388. So S 2col×4rows = 173×68, M 4×12=358×228, L 4×20=358×388. Good. Profile could M 228 too big but okay. Positions M 228, Kline L 388, news L 388. Size S for summary only. We can state sizes not same across types:
  `S=2×4`, `M=4×12`, `L=4×20`. That's very jump from 68 to 228. Could choose M=4×8 ->64+84=148, L=4×16 ->128+180=308. Better. S=2×4 68 high; M=4×8 148; L=4×16 308. Profile M 148, positions L 308, Kline L 308 (maybe Kline 308 fine), news L 308. Good. M positions maybe 148 compact 2 positions. Fine. Use 8px row +12 gap, formulas. Drag target x/y conversion needs account grid gap: `colWidth=(containerWidth-3*gap)/4`, `rowUnit=8+12=20` for pointer step. But actual card height formula works. Layout `x` 0-3, `y` integer rows, `w`, `h`. Auto placement no explicit y? Need collision. Simplest mobile use ordered list + width/height spans and CSS auto-placement; drag reorders array not arbitrary x/y. User asks grid snap + drag. We can do layout array order with `w/h` and CSS grid auto-flow dense; pointer calculates nearest insertion index based element under point. This is lighter than full x/y collision. But "网格吸附" means snapping into grid. Could use layout array with order and spans; CSS grid auto place, pointer snap to target card/insertion. Recommended "Pointer Events + CSS Grid + ordered layout array" with no x/y free coordinates. This avoids collision and is lightweight. State:
  ```
  [{id,type,size:'M',config:{}}]
  ```
  CSS class size maps `grid-column:span 2/4; grid-row:span 4/8/16`. Auto-placement. On pointermove use `document.elementFromPoint` or compute target index by card rect centers; live reorder draft array throttled rAF. This is adequate. For half-width S and full-width M/L auto placement can fill holes with dense; but dense can change visual order unexpectedly (tab order mismatch). Avoid `dense`, use `grid-auto-flow:row` and auto placement; S pairs can sit same row, M starts next row leaving gaps maybe acceptable. Use 2-column grid? 4 columns with S 2, M/L 4. Without dense, two S can share, M moves next row. Order preserved. Good.
  Drag steps:
  - only drag handle with `touch-action:none`; rest scroll.
  - pointerdown record, setPointerCapture, after 120ms? handle can immediate; long press 160ms prevents accidental.
  - elevate dragged card via `position:fixed` clone? Lightweight use original with `transform:translate3d` but grid layout? Need keep placeholder. Could use placeholder same span and dragged element fixed/absolute. Implementation no library:
    1. on pointerdown store source index + rect, insert placeholder, class dragging, `position:fixed; width rect.width; pointer-events:none; transform`.
    2. pointermove rAF set transform and `document.elementFromPoint` find `.widget`, compare pointer to rect midpoint, calculate target index; reorder preview array or only placeholder. If rerender whole array on every move might expensive; 4 widgets only fine but live DOM reorder could be okay. Better only move placeholder on target change; update layout array on pointerup.
    3. pointerup commit target index and animate FLIP; pointercancel restore.
  - resize via config action sheet not drag corner; avoids pointer resize complexity. user asks adjust size not necessarily resize handle. Good.
  - persist after save `localStorage('niuniu.dashboard.v1')`.
  - CSS grid auto layout with array order. Reason: mobile touch support, native HTML5 DnD poor on iOS and requires polyfill; no dependency; CSS grid alone doesn't handle pointer. Use pointer events setPointerCapture compatible iOS Safari 13+? PointerEvents supported iOS 13. Fine.
  Need maybe mention pointer events prevent scrolling only on handle and passive? `touch-action:none` on handle. Use `pointercancel`.
  - accessibility alternative up/down buttons in config to reorder. Could mention keyboard not necessary for iOS but good. Not required.

  Need A home default order and sizes maybe:
  1 personal info M: avatar, name, MT5 account, total assets, today's P&L, eye toggle.
  2 positions overview L? list top 3 positions with symbol, direction, P&L; footer all positions.
  3 market Kline L: symbol selector, price, timeframe, 280? chart.
  4 news L or M: 5 items with time/source/title, filters.
  Global info card "通用个人信息卡" maybe user profile not trading account. Include avatar, nickname, account status, total assets? "通用个人信息" can be avatar, greeting, ID, membership. But home trading dashboard should include assets. Yet positions separate. Design personal card: avatar, nickname, account no, authorization badge; right assets and today P&L? That overlaps account. Could include user + total equity. Fine.

  A "每个 section 一句话" we should keep each bullet one sentence. We can provide semicolon lists. B numbered steps.

  A 我的 sections:
  1 nav "我的" no extra icons maybe settings is item.
  2 user header compact avatar nickname ID and authorization? Authorization is separate row. Could avoid duplicate: header avatar/name/ID only.
  3 group 账户与服务 (3 rows)
  4 group 通用 (invite/theme/settings)
  5 group 帮助与支持 (2)
  6 version footer (not 8 item; minimal version optional)
  7 tab.
  Need explicit order of 8:
  授权状态 → AI 网关 → 充值入口 → 主题 → 设置 → 邀请链接 → 使用教程 → 客服. But maybe invite should before theme? The user gave order but asks us to group. Let's choose:
  Group 1 账户与服务: 授权状态, AI 网关, 充值入口.
  Group 2 通用: 主题, 设置, 邀请链接.
  Group 3 帮助与支持: 使用教程, 客服联系方式.
  Why invite after settings? Low frequency at bottom, yes.
  Controls table maybe A only sections; B personal interactions can include item-by-item control table? User specifically asks "给分组排序 + 逐项控件形态". A grouping plus table in B or A? A section one sentence, then a compact table under A 4 with 8 rows columns order/item/control/tap result. But A is区块划分; controls belong B? Could add after group list within A "逐项控件（按出现顺序）" table. B then key interaction chains including auth/recharge/invite/theme. This meets. The output needs A each page section, B interaction logic. Could include controls in A 4 after sections or B 4 as numbered plus table. Better B 4 has "逐项控件与行为" table plus key chains numbered. But B required numbered steps for key interactions; table okay in addition. Keep concise but detailed.

  Maybe output length 4000-5000 Chinese characters. Desired 4 but task demands thorough. We can aim ~5500-7000 Chinese chars. Need not use tools more. Could inspect answer-k3 maybe existing answer to ensure no missing, but not necessary and could bias. User expects answer only. No need.

  Let's design exact response outline:

  # A. 页面区块划分
  "共用壳（390×844）" bullet dimensions and bottom tab.
  1. 首页 DIY
  numbered list 1-7 each one sentence. In default canvas list components as nested bullets? Requirement each section one sentence. We can make section 3 "DIY 组件画布：默认依次为..." and nested list each widget with content/config maybe that makes more than one sentence but okay. Could structure:
  - 顶部导航...
  - 编辑条...
  - DIY 画布...
    - `个人信息 M` ...
    - ...
  - 新增组件...
  - tab...
  One sentence each.

  2 AI:
  - nav...
  - segment...
  - filters...
  - summary list/conversation list...
  - chat detail...
  - composer...
  - tab...
  Need "所有 AI 总结" explicit: "总结视图默认‘全部’，按时间倒序分页展示全部 AI 总结，不只展示未读". Good.
  Summary card contents one sentence.
  Chat cards contents one sentence.

  3 strategy
  - nav...
  - filter...
  - list...
  - risk footer...
  - tab...

  4 account
  - nav...
  - profile header...
  - group...
  - tab...
  Controls table maybe in B.

  # B interaction
  1 home 1-7.
  2 AI 1-6.
  3 strategy 1-7.
  4 account table and key flows maybe 1-5.
  Table columns 顺序/项目/控件形态/点击结果.
  Rows:
  1 授权状态: left link icon, title; right badge 已授权 (navy pale) + chevron. Tap auth detail bottom sheet showing account/server/broker and button reauthorize.
  2 AI 网关: status dot + "正常 · 剩余 2,340" + chevron; tap usage details.
  3 充值入口: right orange capsule "充值"; tap amount sheet 300/500/1000 custom; maybe no actual payment implementation but design.
  4 主题: right "自动" + chevron; action sheet 自动/浅色/深色 with radio, preview immediate.
  5 设置: chevron; subpage notifications, privacy, security etc (not in scope).
  6 邀请链接: short link + copy icon button; tap copy feedback, row share? If whole row tap copy maybe no chevron. "复制" button + share icon could be two controls but minimal. Use right `复制` text button; tap copies; long? no.
  7 使用教程: icon + chevron; tutorial list.
  8 客服联系方式: right "在线客服" + chevron; sheet with WeCom/Email/copy. User wants contacts.
  No duplicate settings nav.
  Key chains account:
  1 unauthorized -> tap auth -> sheet -> jump auth -> return refresh -> badge.
  2 recharge -> amount -> pay -> result -> update AI gateway credits.
  3 invite copy -> clipboard success toast; theme -> choose -> root data-theme immediate + persist.
  Could combine 3 numbered. B already long. Maybe table tap results enough; no extra chains? "关键交互用编号步骤" applies each page. Need at least numbered chain for account. Do 3 chains.

  # C detailed recommendation and layout.
  Could include code-ish schema and sizes, drag sequence maybe redundant B but C implementation specifics.
  "推荐：Pointer Events 负责拖拽 + CSS Grid 负责吸附布局 + 一个有序数组作为唯一数据源；不要原生 HTML5 DnD。"
  Reasons bullet.
  "数据与网格": 4 col etc.
  State example no full HTML.
  Sizes table maybe inline:
  S `grid-column:span 2;grid-row:span 4` (compact only)
  M `span 4 / span 8`
  L `span 4 / span 16`
  8px rows 12 gap; actual heights as above. Does CSS `grid-row: span 4` etc work with card content? Yes. Need width calc 80.5, S width 173, M/L 358. Heights 68,148,308. Personal info M 148; positions L 308; Kline L 308; news L 308. Good.
  However 390 shell with content width 358, 4 columns 80.5. Fine.
  `grid-auto-rows:8px; gap:12px;` column gap also 12. If `row span 4` height = 4*8+3*12=68. M 8*8+7*12=148. L 16*8+15*12=308. Good. Cards heights maybe enough.
  Sizing per component:
  - profile supports M only? User expects adjust size each. We can say all have presets but Kline disable S. For profile S would show only assets maybe hides avatar; personal info can compact. Positions S show total position count/P&L. News S show 1 headline. Kline S meaningless so only M/L. This is good but extra detail.
  - Auto layout no x/y. Array order defines placement, CSS grid auto flow row. Snap to widget midpoint. "不使用 dense，保证视觉顺序与数组顺序一致."
  - pointer flow specific.
  - persist.
  Reason no drag library.

  # D skeleton
  Use code block `html` but it's fragment not full. Include comments annotations. Comments okay because requested annotations, code comments appropriate. Could do plaintext indented skeleton to avoid full HTML. Example:
  ```
  article.strategy-card[data-strategy-id="sf_001"][data-following="false"]
  ├─ a.strategy-card__main[href="#/strategy/sf_001"]
  │  ├─ header...
  ...
  └─ footer...
  ```
  They specifically "HTML 结构骨架（单个 card 的 DOM 层级缩进，标注每个元素放什么字段）". Tree with tags is perfect. Include SVG path etc. Could show:
  ```
  article.strategy-card
    a.card-main (href...)
      header.card-head
        div.strategy-title
          h3 策略名
          span.tag 策略类型
        span.risk-tag 中风险
      p.strategy-meta 策略方 · 运行天数 · 跟单人数
      section.performance
        div.annual
          span.label 年化收益
          strong.num.up +38.26%
        figure.equity-mini
          figcaption 近12个月资金曲线
          svg
            path.baseline 初始净值虚线
            path.equity 资金曲线（涨红跌绿）
      ul.metric-list
        li ...夏普
  ...
    footer.card-actions
      small.updated 数据更新时间 / 风险披露? 
      button.follow ...
  ```
  Could include footer small "最大回撤..."? Already metrics.
  Need follow button full width maybe footer layout risk text + button 104x40. Card action: main detail, follow separate.
  `data-state="idle|confirming|submitting|following"` helpful.
  `aria-live` maybe not needed.
  Annual return main visual, curve right. Metrics 3 columns. Card meta includes auxiliary.
  Card fields all required.

  # E CSS
  Code variables plus card and number classes. Need no full file. Could present 3 code blocks.
  `:root` variables including dimensions.
  Maybe `--font-sans` variable with font stack. `--tab-h:56px; --safe-top:47px; --safe-bottom:34px;`.
  "卡片通用样式" CSS.
  "数字排版" CSS and font sizes bullet.
  "涨跌色用法" bullets.
  Need define surface border and shadow. Use `background:var(--glass)` etc.
  `color-scheme:light`? Theme includes dark but current design light. Could add `color-scheme: light` not necessary. Theme item can choose but only light spec now. Avoid dark variables.
  `-webkit-font-smoothing:antialiased`.
  Use `font-variant-numeric: tabular-nums lining-nums;`.
  `font-feature-settings: "tnum" 1, "lnum" 1;`.
  `white-space:nowrap`.
  `letter-spacing:-.02em` for large numbers only, not all numeric.
  `text-align:right` metric values.
  For positive negative classes, color. Up/down background badges.
  Use currency and percent examples: `+12.36%`, `−8.20%`, `¥128,560.00`; zero neutral. Note Chinese fonts use minus sign. Annualized positive red. Max drawdown positive magnitude neutral. "资金曲线按所选区间首尾收益着色；K线空心/实心?" Could specify up red down green no orange. No need fill style.
  - Orange only CTA, active tab, focus, selected chip; navy title, key icon, links maybe.
  - Do not use color alone: plus/minus and arrow icons. Accessibility contrast? #E23B2E on white good ~4.2? Might be around 4.3. #17995B ~3.6 maybe large text. But no need.

  Need ensure final no mention files. Could be maybe direct answer as requested. No need citations because no web used.

  Let's formulate polished Chinese with specific actionable. Need avoid over-nesting deep. Use headings A-E and subheadings. Use tables moderately (D tree). A each section one sentence. We can have global dimensions.

  Potential issue "单文件 HTML 预览" user wants design only not complete HTML. We can mention localStorage and hash routing as implementation in preview. Maybe B interactions include all views in single file with `data-page` show/hide. Not asked, but could be useful. Don't need.

  Potential issue "通用个人信息卡" maybe not "profile with total assets". Could include "头像、昵称、账号 ID、授权状态、总资产" enough.

  Potential issue "总行情页（K线）" means market overview not just one symbol. We can include symbol tabs and Kline with watchlist row. In A: "总行情/K线 L：自选标的横向切换 + 最新价/涨跌 + 分时/1D/1W + K线，默认全宽大卡". Fine.

  Potential issue "所有 AI 总结" could mean entry sees all summaries not only categories. Our default summary view with all and pagination satisfies.

  Potential issue "对话里能嵌入行情卡片（股票行情、资金曲线小图）" include both card structure in A:
  - quote embedded card: logo, name/code, latest, change, mini K line, as-of.
  - equity embedded card: total equity, period return, curve.
  Maybe these are within chat details. Good.

  Potential issue "策略卡片展示交易笔数" yes D and A.
  "跟单按钮" yes.
  "跟单状态变已跟单" B success only, not optimistic to avoid false.
  "金额/风险参数" B bottom sheet include amount, risk (copy ratio, max loss). Confirmation sheet and params maybe one sheet or two steps? User chain point follow -> confirm sheet -> select amount/risk -> submit. We can design single bottom sheet with two stages:
  1 tap follow
  2 bottom sheet "确认跟单" shows strategy and risk disclosure; click "设置跟单"
  3 second step same sheet amount/risk
  4 review & submit.
  But user says 点跟单 -> 确认弹层 -> 选金额/风险参数 -> 提交. We can have bottom sheet initially contains both confirmation and inputs. Step 2 open sheet, step3 select, step4 submit. Enough. Include first-time risk agreement checkbox, min amount, available funds, risk preset low/medium/high. "确认弹层" title确认跟单, amount input and risk params within. Good.
  Follow CTA disabled until valid; submit API; success card status.
  No actual payment chain too deep.

  Potential issue DIY "拖拽换位" our algorithm insertion reorder not direct swap but effect换位. Good.
  "增删组件" add drawer, delete with undo.
  "配置单个组件" config sheet with fields.
  "调整尺寸" size presets in edit mode.
  "保存" localStorage.

  We should perhaps specify edit mode draft vs saved to support cancel. Good.

  A bottom tab on AI chat detail maybe hide to prevent keyboard; no need but can mention "AI 对话详情隐藏 Tab，键盘弹出时输入栏随 safe-area 上移". This is interaction and concrete. Shared tab 5. Strategy follow bottom sheet overlays tab with dim. Account.

  E "磨砂玻璃卡片" use backdrop-filter. But many cards on #F5F6F8 with no colorful background blur effect subtle. We can note nav/tab use stronger blur, cards use 0.92 white. No need.

  Let's draft final around 6000 Chinese chars. Need no status preamble. Ensure section A each page block section list from top to bottom, one sentence each. Could make bullet with semicolon.

  Let's compose.

• # A. 页面区块划分

  **共用 iPhone 壳：**390×844，顶部安全区 47px、底部安全区 34px；页面左右边距 16px，内容宽 358px；底部 Tab 高 56px，5 项等宽，当前项橙色、其余灰色。

  ## 1. 首页：DIY 看板

  1. **顶部导航**：左侧“牛牛AI”与账户状态，右侧依次为“新增组件 +”和“编辑”按钮。
  2. **编辑工具条**：仅编辑态显示，提供尺寸提示、撤销及“取消 / 保存”，并固定在导航下方。
  3. **DIY 组件画布**：默认按以下顺序排列，用户可调整顺序、尺寸和配置。
     - **个人信息卡·M**：头像、昵称、账号 ID、授权状态、总资产、今日盈亏及余额隐藏按钮。
     - **持仓总览·L**：持仓数、总浮动盈亏、保证金占用及前 3 个持仓，底部进入完整持仓页。
     - **总行情 / K线·L**：自选标的横滑切换、最新价、涨跌幅、周期切换和 K 线图。
     - **快讯流·L**：按时间倒序展示快讯，包含时间、来源、标题、相关标的和未读点。
  4. **新增组件入口**：编辑态在画布末尾显示虚线“添加组件”卡片，非编辑态不占位。
  5. **底部 Tab**：首页保持橙色高亮，编辑态仍可切换页面，但切换前需提示保存或放弃草稿。

  ## 2. AI 副驾驶

  1. **顶部导航**：标题“AI 副驾驶”，右侧为“新对话”，对话详情页则显示返回、会话标题和更多操作。
  2. **二级分段控件**：提供“AI 总结 / 对话”两个视图，默认进入“AI 总结”。
  3. **总结筛选条**：包含全部、持仓、行情、策略、风控，默认“全部”并支持横向滑动。
  4. **AI 总结流**：按时间倒序分页展示全部历史总结，每张卡包含类型、标题、三行摘要、关联标的、时间和未读状态。
  5. **会话列表**：切换到“对话”后替换总结流，展示会话标题、最后一条消息、时间和关联标的。
  6. **对话消息区**：进入会话后展示用户气泡、AI 流式回答及嵌入式数据卡片。
     - **股票行情卡**：股票名 / 代码、最新价、涨跌额、涨跌幅、迷你走势和数据时间。
     - **资金曲线卡**：统计周期、累计收益、当前净值、迷你资金曲线和“查看持仓”入口。
  7. **快捷提问与输入栏**：输入框上方放“解释今日盈亏”“分析持仓风险”等快捷问题，底部为输入框、语音和发送按钮。
  8. **底部 Tab**：AI 入口页显示 Tab，对话详情及键盘弹出时隐藏 Tab，为消息区让出空间。

  ## 3. 策略广场

  1. **顶部导航**：标题“策略广场”，右侧为搜索和“我的跟单”入口。
  2. **筛选与排序条**：第一行是全部、趋势、震荡、套利、低风险分类，第二行按综合、年化、回撤、夏普排序。
  3. **策略卡片列表**：每张卡依次展示策略名与标签、策略方信息、年化收益、资金曲线、三项指标和跟单按钮。
  4. **列表状态区**：加载时显示同尺寸骨架屏，无结果显示清空筛选入口，分页加载失败时原位重试。
  5. **风险提示**：列表末尾固定展示“历史收益不代表未来表现，跟单可能产生本金损失”。
  6. **底部 Tab**：策略保持橙色高亮，跟单弹层出现时覆盖 Tab 并保留页面滚动位置。

  ## 4. 我的：极简账户页

  1. **顶部导航**：仅显示“我的”，不重复放设置、客服等图标。
  2. **用户信息头**：小号头像、昵称和账号 ID 左对齐，不放营销 Banner、资产图表或等级信息。
  3. **账户与服务组**：依次为授权状态、AI 网关、充值入口，承载交易连接和额度相关高频任务。
  4. **通用组**：依次为主题、设置、邀请链接，将偏好设置与低频分享放在中部。
  5. **帮助与支持组**：依次为使用教程、客服联系方式，固定在页面下部。
  6. **版本信息**：仅显示小号灰色版本号，不放额外运营入口。
  7. **底部 Tab**：我的保持橙色高亮。

  ---

  # B. 页面交互逻辑链路

  ## 1. 首页 DIY 看板

  1. **进入编辑**：点击“编辑”或长按组件 180ms，保存当前布局快照，并切换到可取消的草稿布局。
  2. **拖拽换位**：
     1. 按住组件右上角拖动手柄，其他区域仍用于页面滚动。
     2. 原位置显示同尺寸虚线占位框，拖动卡片以 92% 缩放和加深阴影浮起。
     3. 手指经过其他组件中线时，占位框移动到目标网格位置。
     4. 松手后组件吸附到占位框；收到 `pointercancel` 时回到拖动前位置。
  3. **新增组件**：点击“+”→ 底部抽屉列出四类组件 → 预览尺寸和说明 → 点击添加 → 插入画布末尾并滚动到该组件。
  4. **删除组件**：编辑态点击左上角“−”→ 组件移除 → 显示 5 秒“已删除，可撤销”Toast；保存后才真正持久化删除。
  5. **调整尺寸**：点击组件尺寸按钮 → 选择 S / M / L → 组件内容按预设重排 → 后续组件自动补位；K 线不开放无意义的 S 尺寸。
  6. **配置组件**：点击齿轮打开底部配置层。
     - 个人信息：显示账号、显示资产、隐藏金额。
     - 持仓总览：交易账户、盈亏周期、排序方式、展示条数。
     - K 线：默认标的、K 线周期、均线 / 成交量开关。
     - 快讯流：资讯类型、相关标的、仅看未读。
  7. **保存或取消**：保存时将顺序、尺寸和配置一次性写入本地布局；取消则恢复编辑前快照，避免每个组件单独保存。

  ## 2. AI 副驾驶

  1. **查看总结**：进入 AI Tab 默认展示“全部”总结 → 点击类型筛选 → 列表仅过滤类型，不清除已加载历史。
  2. **阅读总结**：点击总结卡 → 展开总结详情，展示完整结论、依据和关联行情卡 → 同时标记已读。
  3. **基于总结追问**：点击“继续追问”→ 创建或打开关联会话 → 在输入框上方插入“引用：今日持仓总结”上下文 Chip。
  4. **发送消息**：输入问题或点击快捷提问 → 插入用户气泡 → AI 区域先显示骨架 → 流式渲染文本，期间发送按钮变为停止按钮。
  5. **嵌入数据卡**：AI 返回结构化 `quote` 或 `equity` 数据时，在对应文字后渲染行情卡或资金曲线卡，而不是把数据截图塞进聊天气泡。
  6. **卡片联动**：点击行情卡进入对应标的 K 线，点击资金曲线卡进入持仓页；返回后保留原会话和滚动位置。
  7. **异常处理**：流式失败时保留已生成内容并显示“继续生成 / 重试”，数据卡加载失败只重试卡片，不重发整段对话。

  ## 3. 策略广场与跟单

  1. **浏览详情**：点击卡片非按钮区域进入策略详情，点击“跟单”则只打开跟单弹层，不触发详情跳转。
  2. **前置校验**：未授权交易账户时先进入授权流程，成功后恢复原策略的跟单弹层；已跟单则直接打开管理弹层。
  3. **打开确认弹层**：展示策略名、策略方、近一年收益、最大回撤、可跟单余额及风险披露。
  4. **填写跟单参数**：
     - 金额：数字输入框，显示最低金额、可用余额和快捷比例 25% / 50% / 100%。
     - 风险：低 / 中 / 高分段控件，联动默认跟单比例和最大亏损停止线。
     - 高级项：跟单比例、单笔上限、最大亏损停止金额，默认折叠。
  5. **实时校验**：金额不足、低于最低限额或风险参数冲突时，在字段下显示原因，并禁用“确认跟单”。
  6. **提交**：点击确认后按钮进入 Loading 并锁定表单，防止重复提交；服务端确认后才更新状态。
  7. **成功与失败**：
     - 成功：关闭弹层，当前卡片按钮变为“已跟单 · 管理”，同步更新详情页和“我的跟单”。
     - 失败：弹层不关闭、参数不丢失，显示失败原因和“重试”。
  8. **管理跟单**：点击“已跟单 · 管理”可调整金额与风险参数，或经过二次确认停止跟单。

  ## 4. 我的：逐项控件与行为

  | 顺序 | 项目 | 控件形态 | 点击结果 |
  |---|---|---|---|
  | 1 | 授权状态 | 连接图标 + 标题；右侧“已授权 / 未授权”状态徽章和 Chevron | 打开授权详情层，显示账号、服务器、授权时间及重新授权按钮 |
  | 2 | AI 网关 | 状态点 + “正常 · 剩余 2,340 积分”；右侧 Chevron | 进入网关状态、额度和使用记录 |
  | 3 | 充值入口 | 普通列表行 + 右侧橙色小胶囊“充值”按钮 | 打开充值金额弹层，不跳转到无关营销页 |
  | 4 | 主题 | 右侧当前值“自动 / 浅色 / 深色”+ Chevron | 底部弹层显示单选项，选择后立即预览 |
  | 5 | 设置 | 齿轮图标 + 标题 + Chevron | 进入通知、隐私、安全等二级设置 |
  | 6 | 邀请链接 | 标题下显示短链 `niuniuai.app/i/AB12CD`，右侧“复制”文字按钮 | 复制完整链接并显示“已复制”Toast |
  | 7 | 使用教程 | 问号图标 + 标题 + Chevron | 进入新手、授权、AI、跟单教程列表 |
  | 8 | 客服联系方式 | 对话图标 + 标题；右侧“在线客服”+ Chevron | 弹层提供在线会话、企业微信和邮箱复制入口 |

  关键链路：

  1. **授权**：点击授权状态 → 查看当前账号 → 重新授权 → 返回后主动刷新状态 → 更新徽章和首页个人信息卡。
  2. **充值**：点击充值 → 选择固定金额或自定义金额 → 确认支付 → 成功后同时刷新 AI 网关余额。
  3. **主题与邀请**：主题选择后立即修改根节点主题并本地持久化；邀请链接复制只写剪贴板，不自动跳转分享。

  ---

  # C. DIY 看板实现方案

  ## 推荐组合

  **Pointer Events 负责拖拽 + CSS Grid 负责网格吸附 + 有序数组负责布局状态。**

  不建议把“原生 HTML5 Drag & Drop”和“CSS Grid”当成二选一：前者在 iOS Safari 触摸场景支持差，后者只负责布局，本身并不提供拖拽。

  ## 布局模型

  ```text
  dashboardLayout = [
    { id: "profile",   type: "profile",   size: "M", config: {...} },
    { id: "positions", type: "positions", size: "L", config: {...} },
    { id: "market",    type: "market",    size: "L", config: {...} },
    { id: "news",      type: "news",      size: "L", config: {...} }
  ]
  ```

  - **容器**：4 列网格，`grid-auto-rows: 8px`，行列间距均为 12px。
  - **S**：`grid-column: span 2; grid-row: span 4`，约 173×68，仅显示摘要。
  - **M**：`grid-column: span 4; grid-row: span 8`，约 358×148。
  - **L**：`grid-column: span 4; grid-row: span 16`，约 358×308。
  - **自动补位**：使用普通 `grid-auto-flow: row`，不开启 `dense`，避免视觉顺序与数组顺序不一致。
  - **尺寸策略**：S/M/L 是组件预设，不做自由拉伸；390px 宽度下自由拖拽缩放的收益低、误触成本高。

  ## 拖拽落地步骤

  1. 手柄设置 `touch-action: none`，在 `pointerdown` 后调用 `setPointerCapture()`。
  2. 记录源索引和卡片矩形，生成同尺寸占位元素，拖动元素转为固定定位浮层。
  3. `pointermove` 通过 `requestAnimationFrame` 合并更新，只修改 `transform: translate3d(...)`。
  4. 用指针位置与目标卡片矩形中线计算插入索引，仅移动占位框，不在每一帧重排整个数组。
  5. `pointerup` 时将源项移动到目标索引，提交一次数组更新并执行 FLIP 位移动画。
  6. `pointercancel`、页面隐藏或编辑取消时恢复源索引。
  7. 点击保存后写入 `localStorage["niuniu.dashboard.v1"]`，包含 `order + size + config`。

  **推荐理由：**无第三方依赖、触摸和鼠标共用一套事件、动画只改 `transform`，四到十余个组件时性能足够，也比完整碰撞式自由布局更容易维护。

  ---

  # D. 策略广场单卡片 DOM 骨架

  ```text
  article.strategy-card[data-strategy-id="sf_001"][data-following="false"]
  ├─ a.strategy-card__main[href="#/strategy/sf_001"]
  │  ├─ header.strategy-card__header
  │  │  ├─ div.strategy-card__title-row
  │  │  │  ├─ h3.strategy-card__title
  │  │  │  │  └─ 策略名：趋势猎手 Pro
  │  │  │  └─ span.strategy-card__tag
  │  │  │     └─ 类型标签：趋势 / MT5
  │  │  └─ span.strategy-card__risk[data-level="medium"]
  │  │     └─ 风险等级：中风险
  │  │
  │  ├─ p.strategy-card__meta
  │  │  └─ 策略方：AlphaFox · 实盘 428 天 · 1,286 人跟单
  │  │
  │  ├─ section.strategy-card__performance
  │  │  ├─ div.strategy-card__annual
  │  │  │  ├─ span.metric-label
  │  │  │  │  └─ 年化收益
  │  │  │  └─ strong.metric-number.up
  │  │  │     └─ +38.26%
  │  │  └─ figure.strategy-card__equity
  │  │     ├─ figcaption
  │  │     │  └─ 近 12 个月资金曲线
  │  │     └─ svg[viewBox="0 0 160 64"]
  │  │        ├─ line.equity-baseline
  │  │        │  └─ 初始净值基准虚线
  │  │        ├─ path.equity-area
  │  │        │  └─ 低透明度面积填充
  │  │        └─ path.equity-line
  │  │           └─ 资金曲线；区间盈利红色、亏损绿色
  │  │
  │  └─ ul.strategy-card__metrics
  │     ├─ li
  │     │  ├─ span.metric-label └─ 夏普比率
  │     │  └─ strong.metric-number └─ 1.82
  │     ├─ li
  │     │  ├─ span.metric-label └─ 最大回撤
  │     │  └─ strong.metric-number └─ 8.42%
  │     └─ li
  │        ├─ span.metric-label └─ 交易笔数
  │        └─ strong.metric-number └─ 326
  │
  └─ footer.strategy-card__footer
     ├─ small.strategy-card__updated
     │  └─ 更新于 10:30 · 历史收益不代表未来表现
     └─ button.follow-button[data-state="idle"]
        └─ 跟单
           状态值：idle=跟单 / submitting=提交中 / following=已跟单·管理
  ```

  - **主视觉**：年化收益 28px，资金曲线占据右侧约 160×64。
  - **次级指标**：夏普、最大回撤、交易笔数三等分排列。
  - **点击分工**：`a.strategy-card__main` 进入详情，底部跟单按钮独立，避免嵌套交互元素。

  ---

  # E. 关键 CSS 规范

  ## 1. CSS 变量

  ```css
  :root {
    --brand-orange: #FF6A1A;
    --brand-navy: #0E2A5C;

    --page-bg: #F5F6F8;
    --card-bg: rgba(255, 255, 255, 0.90);
    --card-solid: #FFFFFF;
    --glass-border: rgba(255, 255, 255, 0.78);

    --text-primary: #17233B;
    --text-secondary: #667085;
    --text-tertiary: #98A2B3;
    --divider: rgba(14, 42, 92, 0.08);

    --up: #E23B2E;
    --down: #17995B;
    --up-bg: rgba(226, 59, 46, 0.09);
    --down-bg: rgba(23, 153, 91, 0.09);

    --radius-card: 20px;
    --radius-control: 12px;
    --radius-pill: 999px;

    --shadow-card: 0 8px 24px rgba(14, 42, 92, 0.06);
    --shadow-drag: 0 16px 36px rgba(14, 42, 92, 0.16);

    --page-x: 16px;
    --section-gap: 20px;
    --card-gap: 12px;
    --card-padding: 16px;

    --ease-ios: cubic-bezier(0.22, 1, 0.36, 1);
    --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text",
                 "PingFang SC", "Helvetica Neue", sans-serif;
  }
  ```

  ## 2. 卡片通用样式

  ```css
  .card {
    box-sizing: border-box;
    padding: var(--card-padding);
    overflow: hidden;
    background: var(--card-bg);
    border: 1px solid var(--glass-border);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
    -webkit-backdrop-filter: blur(20px) saturate(160%);
    backdrop-filter: blur(20px) saturate(160%);
  }

  .card + .card {
    margin-top: var(--card-gap);
  }

  .card-dragging {
    z-index: 20;
    box-shadow: var(--shadow-drag);
    transform-origin: center;
    will-change: transform;
  }
  ```

  - 页面区块标题间距 20px，卡片之间 12px，卡片内部元素间距以 8 / 12 / 16px 为主。
  - 按钮按下使用 `opacity: 0.72` 或轻微 `scale(0.98)`，不要给所有卡片加持续弹跳动画。
  - 不支持磨砂时回退为纯白卡片，不能影响数字和边框可读性。

  ## 3. 数字排版

  ```css
  .num,
  .metric-number,
  .price,
  .pnl {
    font-variant-numeric: tabular-nums lining-nums;
    font-feature-settings: "tnum" 1, "lnum" 1;
    white-space: nowrap;
    text-align: right;
  }

  .num-lg {
    font-size: 28px;
    line-height: 34px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .num-md {
    font-size: 20px;
    line-height: 26px;
    font-weight: 650;
  }

  .num-sm {
    font-size: 15px;
    line-height: 20px;
    font-weight: 600;
  }
  ```

  - 金额统一千分位和两位小数：`¥128,560.00`。
  - 百分比统一两位小数，正数显式带 `+`：`+38.26%`。
  - 负数使用真正的减号：`−8.20%`，不要混用连字符。
  - 夏普保留两位小数，交易笔数、跟单人数使用整数千分位。
  - 标签与数值分行，数值右对齐；多个指标列的末位小数必须对齐。

  ## 4. 涨跌色与品牌色纪律

  ```css
  .up   { color: var(--up); }
  .down { color: var(--down); }
  .flat { color: var(--text-secondary); }

  .badge-up {
    color: var(--up);
    background: var(--up-bg);
  }

  .badge-down {
    color: var(--down);
    background: var(--down-bg);
  }
  ```

  - **涨红跌绿**用于价格、盈亏、收益率、K 线和资金曲线，不能按国际品牌习惯反转。
  - 资金曲线按当前展示区间的首尾收益决定整条曲线颜色，不要一段红一段绿。
  - 最大回撤展示正值幅度，如“最大回撤 8.42%”，使用中性深色，避免被误读为当期下跌收益。
  - 橙色只用于主按钮、当前 Tab、选中筛选项和关键焦点，不用于表示上涨。
  - 深蓝用于标题、重要图标和锚定信息；普通正文使用中性深灰。
  - 涨跌不能只依赖颜色，必须同时保留 `+ / −`、箭头或“涨 / 跌”文字。

To resume this session: kimi -r session_38eae458-ddcd-408e-9649-9d59d4428a0c
