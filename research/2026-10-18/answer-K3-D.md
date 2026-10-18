kimi version 2.1.1
• We need fulfill substantial task in Chinese, read files, existing template if exists, produce detailed markdown file and stdout <=400 lines Chinese condensed with required content. Need follow instructions source-based assertions non-facts inferred mark [推断], no fabricated precise numbers, uncertainties "待确认". Need likely use plan? User explicitly asks deliver file, multi-file only read and write report, not implementation modifications except file. Could avoid plan mode pure research design and write requested file. Need tools. Need read initial docs and source. Need check answer-A exists via Read direct given path. We have known paths can parallel reads. Need likely todo since multi-step. We should do concise status notes and final stand-alone condensed maybe file + stdout content? They explicitly require stdout Chinese condensed <=400 lines including many things. Our final answer must contain that (tool outputs not necessarily user visible) and file. Need deliver comprehensive maybe final 250-350 lines. File can be detailed. Need carefully inspect code. Let's initialize todo and parallel reads.

• 我先核对研究材料、真实源码和 K3-A 模板产物，再按“现状—数据流—可测 MVP—安全—商业—里程碑”形成可复现方案。

• We have all except answer-A missing. Need assume own minimal schema and say. But might be produced later by subagent concurrently? We should check near end maybe exists. Need read bridge and EA real code for D1 implementation who main/bridge/EA and security specifics. User says source must read specific, but also D1 needs bridge/EA, and D4 details signatures etc. Should read src/bridge/index.js and ea/NiuNiuBridge.mq5, license.js, package.json maybe test scripts. Also ai-gateway config/src for billing? Need enough. We should inspect directory names with Glob known. Use Glob for src/bridge, ai-gateway etc and research files maybe B/C outputs for dependencies? User says dependencies K3-A/B/C outputs. Need know if files exist to reference actual. Can glob research. Also verify package scripts. Let's read main bridge, EA maybe large.Interesting answer-K3-A.md exists not requested answer-A-templates.json. User specifically other subagent K3-A output template system in same dir answer-A-templates.json. There is answer-K3-A.md maybe contains schema and possibly path. Need read to get actual schema? They said if file exists read and assume schema. It doesn't. But we can read answer-K3-A.md as actual output perhaps relevant and not violate; if no JSON, use own min schema and state. Yet better read K3-A md and B/C for milestone deps. Also answer-K3-D.md exists maybe another output? Could be previous version or subagent concurrent? User wants answer-D-ecosystem.md, different. We can read brief-K3-D maybe same user, no need. Read answer-K3-A.md, B/C maybe useful and avoid contradictions. Need maybe answer-A-templates.json appears later. We'll note as of initial reading absent, but by final check maybe created. We should not ignore actual K3-A schema if md includes. Let's read all three in parallel, plus protocol.js and maybe ai gateway README/billing to ground commercial. User didn't require but helpful. Need output file only no code changes. We should maybe run existing verify-main to confirm current 30/30 and potentially create no test file because asked assertions design not implementation. D3 "最小可测 MVP（最重要，必须可执行）设计一个用现有代码就能跑起来验证的最小闭环（可以先用桩数据）... 借鉴并扩展现有 ... 列出至少25条可自动化断言" likely they want plan not actual code implementation, document with commands. We can run existing test for baseline. May need no new code. Need ensure "用现有代码就能跑起来验证" perhaps manual existing app + test script, stub UI strategy flow not existing can't run. Need design smallest closed loop using existing actual capabilities with stub strategy template/instance in test script only; since no code changes requested except report, provide exact manual steps and proposed extensions. But "必须可执行" could require commands and click paths with expected phenomena. We can formulate two layers: Layer A today execute verify-main (actual 30 assertions) and manual MT5 with stub instance mapping to manual UI; Layer B M1 automated harness additions. Must be explicit true vs stub and what cannot test. Need maybe include a copy-paste stub driver? They ask not necessarily code. But to be "可执行" need step by step with existing commands and

• 已确认 `answer-A-templates.json` 当前不存在；我会按任务要求采用最小模板 schema，并明确标注。仓库另有 K3-A/B/C 的 Markdown 产出，我会读取用于对齐依赖，不把它误当成约定的 JSON schema。

• The K3-A/B/C files are transcripts not outputs, perhaps still running. answer-K3-D also maybe transcript. We shouldn't rely. Need maybe wait for answer-A-templates later? We can proceed own schema per instruction. Could check at end.

  Critical discovered actual bug protocol: app sends payload.tag, EA reads comment; protocol drops tag and ticket. Need include D1 gaps explicit. This is important. Also main `sendCommand` returns bridge result ok true? yes. `sanitizeCommand` only checks license and type/path/volume, not account, epoch, ttl, side, symbol etc. `terminalPath.includes('MetaQuotes')` case-sensitive and path traversal? bridge path joins arbitrary path but main contains MetaQuotes only, could path with MetaQuotes anywhere. Don't overstate secure; mention existing check as specified. Need maybe main no sender validation (e.senderFrame) despite comment "来源校验", actually no source check in IPC handler. User says based on existing safety design includes main double check etc not sender. We should not assert sender validation. Could note IPC白名单 only and no arbitrary commands. Preload exposes methods to renderer; any renderer with XSS could invoke sendCommand but main gate still only coarse. We can recommend stronger per-instance grants and confirmation tokens.

  Need understand license expire behavior: licenseState set at activation/load and not refreshed periodically; daysLeft computed only verify. Once ok, remains ok until app restart or reactivation? load once startup, refreshLicense just returns state no reverify. So expiry while app remains open doesn't automatically revoke. User asks "到期/过期/唤回" behavior. Need distinguish current vs proposed. Offline license no revocation ("唤回" maybe召回) mechanism. Current no recall. Need state "到期：仅 verify 时判断，运行中未见定时重验；过期/唤回：无在线撤销机制" sourced. Then proposal fail-closed and require-human states. EA old version: no version in heartbeat/status (only v:1 protocol maybe). No compatibility checks. bridge crash: main exit sets bridge null; pending promises? pending map not rejected on exit, only 15s timeout. No automatic restart. UI snapshot calls error returns, refresh if !r.ok returns leaving stale UI possibly. Need mention current behavior and proposed "REVIEW_REQUIRED". For bridge crash restart: current no auto restart, in-flight pending timeout, state.commands in memory lost, receipts not recoverable after restart because commands map empty; EA archive persists but bridge doesn't reload. Need require reconciliation onrestart. Main on bridge exit only logs and null. Should include failure modes.

  Need think D2 architecture. We need design end-to-end realistic with existing IPC and additions. Need decide where strategy runs: user says "在本机 EA 上试运行（模拟盘）", "EA 拿模板规则算信号". So deterministic strategy engine in EA, not desktop. Current NiuNiuBridge EA only command executor no indicator strategy. Need extend EA or add StrategyRunner EA? Could choose same EA to reduce installs and magic? They specifically EA gets template rules. Need one bridge EA per chart/terminal. Current magic is input global `InpMagic` for entire EA, not per command. To support multiple strategy instances and attribution, must make magic per command and per instance, but MT5 EA can attach multiple charts each with own magic? Existing file bridge dir fixed "niuniu" per terminal, multiple EA instances would share inbox/outbox/heart/status causing collisions. So current architecture effectively one EA per terminal sandbox (or needs per-instance bridge dir). Need choose single EA strategy runner managing multiple instances? User wants magic unique per instance; MT5 netting account cannot reliably attribute by magic because position magic maybe? Need carefully avoid false claims. MT5 order/deal magic exists, positions have magic, but netting mode consolidates positions per symbol and multi-strategy same symbol attribution ambiguous. We can state [推断] M1/M2 limit one active strategy per account? AlphaFox constraint known external fact one account only one strategy but that's their design not MT5 requirement. We can recommend initial one instance per terminal/account? User goal "运行位" implies multiple eventually. Need decide MVP: one running strategy instance per MT5 account/terminal to avoid magic conflicts, netting hazards. Later multi-instance only hedging and per-symbol or subaccount. But magic release/account unbind stage asked, implies possibly multiple. Need magic allocation robust even with one active: allocate from persisted registry, no reuse until history retention? They specifically stop magic release. We need say stopped magic can be released to free pool but never immediately reuse while historical/open positions/pending orders remain; released into quarantine/cooldown, only reallocate after no exposure and no unreconciled deals and new epoch? Magic is 64-bit long in MQL5? `InpMagic` input int currently 32-bit, req.magic is ulong? MqlTradeRequest.magic ulong. Need choose safe range and not fabricate precise limitation. Could use positive nonzero 32-bit signed integerto match current `input int InpMagic` and JSON number safe. Range e.g 100000–2147483646, reserved manual 20261015? Existing default 20261015. If strategy instance magic allocated dynamic, protocol needs `magic` as integer; current EA input int fixed, so need change to per-command magic, validate against instance grant. For magic allocation use cryptographic random 31-bit with collision check against persisted registry and MT5 open orders/positions/history lookback. Random collision possible; deterministic allocator via monotonic counter better. Need account+server+terminal scope registry. Format maybe `NN` prefix impossible numeric. Use monotonic `next_magic` per installation persisted in `userData/strategy-registry.json`, starting at configurable base (recommend no exact numeric unless design). But cross reinstall/client and multiple desktops on same account collision. Need check MT5 history/open positions before assigning. Best use random 31-bit generated in main using crypto.randomInt, check against local registry and EA `checkMagic` snapshot of open/current/recent history, retry; allocation record persisted before RUNNING. Since random collision with old history outside lookback possible, never absolute guarantee. Need central platform allocation? Could platform-issued magic ranges per license/user to avoid across devices; but offline client must work. Use per-install `allocator_id` + sequence hashed into 31-bit, plus EA collision check; platform can assign range when online. Too complex MVP. Since M1 one strategy per account, magic still distinguish from manual. Use magic registry in main + EA scan, full history since strategy feature launch or retention. Rebalancing.

  Maybe choose magic as `uint31` derived from instance_id (UUID) hash with collision resolution. Since instance_id random UUID, `magic = 1 + (SHA256(instance_id || binding || allocator_nonce) mod (2^31-1))`; deterministic across restart, collision checked against registry and MT5 open positions/orders/history. Store actual mapping, don't recompute as sole source. On stop `RETIRED`, don't reuse ever (simplest, 31-bit space large enough; no precise capacity claims needed). But user explicitly "停止后 magic 释放与账户解绑" expects release. We can say "释放的是运行占用，不是立即回收 magic 数值；magic 进入 retired 永久/至少在数据保留期内不复用". This is safer and decisive. If they require release magic maybe wording "停止后 magic 释放" couldbe addressed by two-phase: active lock released; numeric magic quarantined, not available until no history required. We can say `active_allocation` released, `magic` retained for attribution; never reuse in MVP. That fulfills "magic 释放" concept by explaining not literal reuse.

  Strategy instance schema minimal:
  ```
  {
   "v":1,
   "instance_id":"si_...",
   "template":{"id":"tpl_ema_cross","version":"1.0.0","sha256":"...","payload_hash?"},
   "binding":{"terminal_id":"...","account":"123","account_server":"Demo","symbol":"EURUSD","timeframe":"M15","mode":"demo"},
   "magic":123456789,
   "params":{...},
   "params_hash":"sha256...",
   "risk":{"volume_lots":0.01,...},
   "state":"DRAFT|AWAITING_USER_CONFIRMATION|APPROVED|INSTALLED|RUNNING|PAUSED|STOPPING|STOPPED|REVIEW_REQUIRED|REJECTED",
   "approval":{"approval_id","params_hash","binding_hash","approved_at","expires_at","user_confirmed":true},
   "entitlement":{"license_id":"NN1...","plan":"template_run","run_slot_id":...},
   "created_at":...
  }
  ```
  No real precise values? Examples can use placeholder IDs and sample demo numbers sourced from verify stubs maybe use 12345678 and EURUSD existing, volume 0.01 from UI. That's source or example design. Use `"<...>"` placeholders to avoid numeric claims. JSON examples with placeholder strings may not be actual valid types but JSON valid. Could use existing stub values explicitly labelled "示例/桩，不是绩效或生产配置". Need payload examples each phase. Many. We can choose one canonical template `tpl.fixed_lot_signal.v1` minimal schema since K3-A missing:
  ```
  {
   "schema_version":"nn.strategy-template/1",
   "template_id":"tpl_demo_fixed_lot",
   "version":"1.0.0",
   "name":"固定手数信号演示",
   "engine":{"kind":"EA_DSL","min_ea_version":"1.1.0","min_protocol":2},
   "bindings":[{"symbol":"EURUSD","timeframe":"M15"}]? 
   "parameters":{
     "volume_lots":{"type":"number","default":0.01,"min":0.01,"max":0.01?}
   }
   "signal":{"event":"TEST_SIGNAL","side":"BUY"} 
   "risk":...
   "execution":{"command":"ORDER_MARKET",...}
  }
  ```
  Need minimal but general enough. Maybe schema with `params` and `rules` not define exact DSL, K3-A will eventually provide. We need explicitly "临时最小 schema，仅用于本方案，不与 K3-A 最终 schema 兼容保证；待 answer-A-templates.json 出现后以其为准". But user says if nonexistent own design and explain. Good.

  Template distribution: platform service vs local packaged? Decision recommend M0/M1 local signed manifest packaged or test fixture, M2 platform signed template service, always cache. They ask "模板 JSON 从哪来（平台服务？本地打包？）" need decisive maybe phased acceptable but D2 data flow stage. Say production source platform template service, initial MVP local packaged fixture; both same envelope/signature validation. Client verifies schema version, template id/version, sha256, Ed25519 signature using separate template public key (not license private), min app/EA/protocol compatibility; fail-closed. EA only receives canonical rules package via new `STRATEGY_INSTALL` command? Existing command whitelist has no strategy install; should not use `SYNC_STATE` to write arbitrary. New IPC methods:
  - `templateList`, `templateGet` maybe main reads local or platform (renderer no remote fetch except https CSP but better main)
  - `strategyCreate` (create draft + magic reservation but no trade)
  - `strategyApprove` (explicit user confirmation; main generates approval token tied to immutable hash and expiry)
  - `strategyDeploy` (send new EA command `STRATEGY_INSTALL` / file signed config)
  - `strategyStart`, `strategyPause`, `strategyStop`
  - `strategyList`, `strategyStatus`, `strategyEvents`
  - `equitySeries`, `dealHistory` etc maybe combined telemetry.

  But "用什么数据格式、走哪个已有 IPC、需要新增什么". We should map:
  Template JSON service -> main new `strategy:listTemplates` etc. No existing IPC suitable.
  Instantiation new main persisted registry; snapshot existing used binding verification.
  Execution: existing `window.nn.sendCommand`/`bridge:sendCommand` + `bridge:commandStatus` reused for actual trade, but not directly called by renderer for auto strategy; main StrategyController invokes internal `ALLOWED.sendCommand` with approval and magic. Add `payload.magic`, `instance_id`, `strategy_version`, `signal_id`, `tag`, `params_hash`; must be signed in protocol v2. Current v1 signs only subset and drops tag/ticket. Need critical: can't justadd params in main, protocol v1 canonical doesn't cover them and protocol build strips unknown. Need protocol v2 with explicit per-type payload serialization and canonical JSON sorted keys? Better design canonicalization robust. Use canonical JSON for entire command excluding sig with stable key ordering and numeric rules, but MQL5 mini parser cannot parse nested/canonical easily. Still design could define v2 fixed ordered fields including new ones; avoid arbitrary JSON canonicalization mismatch. Could say protocol v2: whitelist per command type and stable serialization; sign all execution-relevant fields including magic/instance_id/signal_id/ticket/comment/ttl, and EA verifies same. No silent unknown fields. `v` mismatch reject. Old EA receives v2 must reject/quarantine, UI compatibility before deploy. Current old EA `PumpInbox` ignores `v` and may verify signature based subset; if new fields signed with old algorithm? If client accidentally sends v2 with v1 signature old EA could execute ignoring magic and use InpMagic, dangerous. Need version-compatible design: main must handshake EA protocol and not send v2 to old EA. Also old EA should be updated to reject `v != 1`; currently it doesn't check `v`. For old unpatched EA, main only sends v1 and no strategy features. New commands `STRATEGY_INSTALL` sent to old EA currently HMAC may verify? If v1 with same fields could reach else "暂不支持" after autoTrade; but do not rely. Compatibility preflight based on EA version heartbeat. Current heartbeat has v:1 and no EA build version. Need add `ea_version`, `protocol_versions`, `features`, `schema_versions`. Old EA doesn't report, main assumes legacy and disables strategy deploy. Good.

  Safety red line "未经用户确认，EA 不得下单". Current manual UI requires button but renderer can call sendCommand programmatically; EA InpAutoTrade true will execute signed command, no unforgeable approval. Main license gate only. So currently cannot prove "user confirmation" at EA. Need propose `approval_id`/grant capability generated by main on explicit native confirmation? Renderer can call `strategyApprove` programmatically too. Need ensure actual user confirmation through main-native dialog (`dialog.showMessageBox` in main) not renderer DOM only, and single-use approval token stored in main tied to exact plan hash, binding, magic, expiry. But compromised renderer could invoke `strategyApprove` causing dialog, user could be tricked but must physically confirm. For manual trades, existingUI button click is renderer; to enforce red line automatically for strategy, all auto commands must carry grant created by native main dialog. EA should not accept `ORDER_MARKET` with `origin:"STRATEGY"` without valid grant? EA cannot verify main-generated random grant unless grant shared via signed strategy package. Design: main deploys signed `strategy_package` containing `approval_token` random and plan hash; HMAC with bridge secret to EA; subsequent ORDER_MARKET includes approval_id and strategy config revision; EA checks active approved instance exists, state RUNNING, matching magic/binding/params hash. But if renderer can call strategyDeploy without click, main native dialog gating prevents. Manual commands continue with existing UI? Red line broadly "未经用户确认，EA 不得下单" for any order. Existing manual order button confirmation counts as user confirmation but not cryptographically provable. Automated negative tests can assert no `sendCommand` before approve in new strategy controller. At EA level negative test write signed strategy command with no active approval => rejected. Need say current code lacks such approval object, so red line new mechanism not current feature; M0 test uses stub, real EA not verifiable until protocol v2. For existing manual path test can assert button disabled until license etc but not actual user confirmation security. Need be explicit.

  Could alternatively use `strategyApprove` IPC shows native dialog and returns short-lived `approval_token`, renderer passes to `strategyStart`, main consumes. AI never gets approval token and has no IPC sendCommand? AI through main tools not arbitrary. Current preload exposes sendCommand to renderer, but AI code not present. New AI tools only read-only summarized and `requestStrategyDraft`, no direct trade. Redline tests:
  1 no approval call strategyStart => no command file.
  2 approve then mutate params => hash mismatch no command.
  3 expired/revoked/used approval => rejected.
  4 AI `chat` content "buy" => zero trade tools called.
  5 valid signed ORDER_MARKET directly injected into EA inbox with `origin=STRATEGY` but no active approved instance => REJECTED/quarantine no OrderSend.
  6 approval for account A used account B => rejected.
  7 stop/rebind epoch => no further orders.

  MVP with existing code: We can test main's sanitizeCommand not exported. Could run via Electron IPC in verify script? Existing verify replaces IPC with stubs so doesn't exercise real main validation. To test real sanitize, could require main? side effects. Need recommend refactor export functions? They want using existing code no new codemaybe can use IPC stub to test UI only and EA actual real for safety. Existing tools verify-main stubs all, cannot test main gate. Could write proposed new `tools/verify-ecosystem.js` that imports pure modules if refactored, but that's not current. Need distinguish assertions A01-A?? some runnable today, some after minimal implementation. User says "借鉴并扩展现有...列出至少25条可自动化断言" not all must run today, but MVP must be executable. Could list 32 with levels "现可跑 / M1". Need at least 25, each object expected failure meaning. Could include 30 exactly and mark baseline vs new. We can say "当前可自动跑的是 UI 桩和协议/E​​A 仿真，不是完整真实闭环". They specifically "哪些部分现在测不了" need clear. Maybe provide MVP that uses existing `verify-main.js` and existing `test/ea_sim.py` to test EA command handling without MT5? Need inspect test/ea_sim.py and gen_vectors, make-cmd to know available testing. They may allow EA simulation. Read them.

• 源码盘点发现两个会直接影响方案的现实缺口：`protocol.js` 当前会丢掉 `ticket`，且 `tag` 与 UI/EA 使用的 `comment` 不一致；另外现有 HMAC 并未覆盖策略归属字段。因此不能仅靠“给 payload 加 magic”就宣称闭环安全，需要协议升级和旧 EA 拒新/主进程禁发策略。

• Need maybe run tests now baseline to verify. Commands: `node_modules/.bin/electron tools/verify-main.js`, `node test/gen_vectors.js && python3 test/ea_sim.py test/vectors.json`, `node ai-gateway/test/smoke.js` (this modifies vectors.json IDs/timestamps! gen_vectors writes file, it's tracked maybe modifying existing file undesirable? It's generated test vector with times, would change working tree. We can run ea_sim on existing vectors without regen to avoid modifications. It tests existing commands signature no changes. AI smoke writes data-test then removes, okay. Electron verify modifies userData prefs (actual test app userData maybe same? verify script app name? Could affect user prefs? Existing test does remove prefs in Electron app userData maybe niuniu-ai? Since main not loaded app name from package maybe "niuniu-ai" same as production and could delete user's real prefs. But running on macOS test environment user project, may be okay but risk. It says doesn't touch real license, but does prefs. We can run standard test per requirement. Need check git status before to avoid overwriting user changes? We're only writing new report. Run `git status --short` to know existing changes. Also baseline test maybe no sandbox on mac. Could run in parallel tests independent? electron and ai smoke and ea_sim yes. But `ea_sim` reads vectors; no modifications. Do./Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/tools/verify-main.js:16
app.commandLine.appendSwitch('no-sandbox');
    ^

TypeError: Cannot read properties of undefined (reading 'commandLine')
    at Object.<anonymous> (/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/tools/verify-main.js:16:5)
    at Module._compile (node:internal/modules/cjs/loader:1484:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1564:10)
    at Module.load (node:internal/modules/cjs/loader:1295:32)
    at Module._load (node:internal/modules/cjs/loader:1111:12)
    at c._load (node:electron/js2c/node_init:2:16955)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:188:12)
    at node:internal/main/run_main_module:28:49

Node.js v20.18.3

EA 侧验签: 10 PASS / 0 FAIL  (共 10 条)
== 冒烟测试（按 token 计费 · mock 上游）==
  ✓ 健康检查 200
  ✓ 不带 token → 401
  ✓ 伪造 token → 401
  ✓ 零积分 → 402 且未扣
  ✓ 充值 10000 → 余额 10000
  ✓ 快问按 token 扣 2 分 · 余额 9998 · 有回复
  ✓ 深度按 token 扣 98 分 · 余额 9900
  ✓ 余额查询 = 9900
[chat] 失败已退款 user=u3 reason=mock upstream 500
  ✓ 上游失败 → 502 且全额退款（余额仍 500）
  ✓ 超过每分钟上限 → 429
  ✓ 流水记录成本与毛利（收 ¥0.1 / 成本 ¥0.03）
  ✓ 退款有独立流水（对账可查）
  ✓ 用户之间余额隔离（u2 仍为 0）
  ✓ 非法 messages → 400
  ✓ 输入超长 → 413 且不扣分

全部通过：15 项
fatal: not a git repository (or any of the parent directories): .git
Electron error app undefined usually electron binary launches node because ELECTRON_RUN_AS_NODE env set? Need investigate standard way blocked do not route around quietly. We can check env `env | grep ELECTRON` but Grep dedicated not for env output; Bash `printenv ELECTRON_RUN_AS_NODE; node_modules/.bin/electron --version; which node...` allowed. Why require('electron') returns path string when run as node normally, then destructuring app undefined. Running node_modules/.bin/electron should set electron binary, unless ELECTRON_RUN_AS_NODE=1 environment. Could be. Need run `env | sort` maybe huge, not. `printenv ELECTRON_RUN_AS_NODE || true`. Also electron may not installed proper? `node_modules/.bin/electron --version` with env might print node version. Use Bash.

• 基线结果：EA 验签仿真通过，AI 网关 mock 冒烟通过；真 Electron UI 校验启动失败（`require('electron').app` 为 undefined），我先检查运行环境，不把这次失败写成“30/30 通过”。1
v20.18.3
v22.22.2
lrwxr-xr-x 1 a1234 staff    18 2026-10-16 10:46 node_modules/.bin/electron -> ../electron/cli.js
-rwxr-xr-x 1 a1234 staff 50472 2026-10-16 10:51 node_modules/electron/dist/Electron.app/Contents/MacOS/Electron
33.4.11


• ELECTRON_RUN_AS_NODE=1. Can run `ELECTRON_RUN_AS_NODE= node_modules/.bin/electron tools/verify-main.js`? Electron docs env var presence maybe =1 only. Setting empty likely disables. Use `env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron ...` standard fix, not workaround, proper approach. Do.
=== 牛牛 AI 客户端 UI 校验 ===
PASS  默认落在概览页
PASS  导航高亮唯一
PASS  导航 p-overview 切页正确
PASS  导航 p-terminal 切页正确
PASS  导航 p-trade 切页正确
PASS  导航 p-strategy 切页正确
PASS  导航 p-ai 切页正确
PASS  导航 p-settings 切页正确
PASS  KPI 余额渲染
PASS  买价渲染 5 位
PASS  持仓渲染 2 行
PASS  下单按钮可用
PASS  授权条已激活态
PASS  AI 条显示且充值可用
PASS  终端列表 2 个
PASS  深色 data-theme
PASS  深色页面底色 #0B1220
PASS  深色分段按钮同步
PASS  配色 data-accent
PASS  深海蓝主色值
PASS  配色名同步
PASS  深色下按钮用 deep 档
PASS  色板选中唯一
PASS  深色+品牌橙 主色仍 #FF6A1A
PASS  深色下涨跌色提亮
PASS  重载后主题保持深色
PASS  重载后配色保持 orange
PASS  重载后回到上次页面
PASS  重载后设置控件回显一致
PASS  无 JS 报错

共 30 项，通过 30，失败 0
Great. Need update todo first done, next in progress. We have enough source. Need design detailed doc. Let's organize.

  Need perhaps verify answer-A missing again later. Not now.

  D1 table capability rows:
  - 终端发现 `nn.discover` → `bridge:discover` → bridge discoverTerminals, EA heart. Gap: only Windows root, heartbeat fresh file mtime not seq? Code comment says seq changes but discover only freshness not compare seq; snapshot freshness too. Could mention no terminal/account binding registry, no EA build/capability version.
  - EA安装 `installEA` main -> bridge copy ex5/mq5 and secret. Gap no signature/hash/version compatibility or auto compile/restart; manual MT5 attach.
  - 重绑 `rebind` epoch+secret. Gap no strategy instance state migration/stop/revoke approvals; epoch global bridge state across terminals? state.secret/epoch global for all terminals, rebind one increments global secret epoch and writes only one terminal secret; other terminal mismatch potential. This is important but maybe not necessary. Could mention binding is bridge-global secret/epoch, not per instance; multi-terminal strategy needs per-binding key/epoch. Source shows state global, yes.
  - snapshot `snapshot`: main/bridge read heart/status; EA writes account quote positions orders. Gap only current chart quote/current snapshot, no history/equity series/strategy attribution (positions include comment but no magic in status! EA status positions doesn't include magic; orders doesn't include magic). Need add magic field and instance mapping.
  - market order `sendCommand ORDER_MARKET` main sanitize + bridge protocol + EA execute. Gap need payload magic/instance/signal/tag; protocol v1 strips unknown; current fixed `InpMagic`; AI no approval capability; volume only >0 <=1000 main, EA broker checks.
  - close `POSITION_CLOSE`: app, main whitelist, EA. Gap protocol build drops ticket; current end-to-end close blocked/needs fix; strategy attribution missing. Mention this as code-verified, not just inference.
  - receipt query `commandStatus` + onEvent: bridge memory + EA receipt. Gap command history not persistent across bridge restart; no instance/deal attribution; no signature verification of receipts in bridge? protocol.verifyReceipt only checks id, but pollReceipts doesn't call it or authenticate. Could note receipt file unsigned/unverified, so not sufficient for billing/performance. Source: WriteReceipt no sig, poll reads JSON no verify. Good for D5.
  - license status/activate: main license.js offlineEd25519; no template/run slot entitlements, no revocation, no periodic reverify.
  - AI status/connect/recharge: `aiStatus`, `aiConnect`, `aiDisconnect`, `openExternal` for recharge; main + gateway; no AI chat IPC in preload, no read tools/analysis; current app says not open.
  - version `app:version`: app only, no EA/protocol/template compat.
  - external open `app:openExternal`: https only; no host allowlist (any https). Gap if payment/template links need host allowlist, no ipc sender? mention optional.
  - prefs/saveLog maybe not required but could include.
  - command types whitelist pending/cancel/modify/position modify: main allows but EA rejects, gap. Important to explicitly list not supported.
  - strategy templates/instances/history/equity missing complete.
  - authz user roles platform no integration.
  - AI chat not exposed.

  D2 phase table:
  Phase 1 Template:
  Production platform service API GET `/v1/templates` and `/v1/templates/{id}/{version}` maybe [推断]. Signed envelope:
  ```
  {
   "schema_version":"nn.template-envelope/1",
   "template_id":"tpl_demo",
   "version":"1.0.0",
   "sha256":"<hex>",
   "signature":"<Ed25519>",
   "template": { ...}
  }
  ```
  Local MVP `assets/templates/tpl_demo.json` + fixture, no remote. No existing IPC; new `templateList/templateGet`, main fetch over HTTPS, cache userData/templates; signature verify. EA delivery via new signed `STRATEGY_INSTALL` command / `strategy_package` in file; not existing sendCommand until protocol v2. We can define `STRATEGY_INSTALL` new type, `STRATEGY_START` etc. Need note new EA strategy engine not existing.
  Failure modes: malformed schema, hash/sig fail, incompatible version, stale cache, unknown fields, duplicate id/version; UI shows unavailable reason, no install/run.
  Observability: template card source "本地/平台", version, verification status, no performance if none.

  Phase2 instantiation:
  User selects template params -> new `strategyCreate` returns DRAFT with instance_id, magic reserved, binding from `snapshot` existing, params hash. `strategyApprove` native confirmation and entitlement check. Need magic allocation and conflict detection detail.
  Magic scope `(account_server, account, terminal_id)`; current InpMagic global per EA, new per-command magic. Registry persisted atomic in mainuserData `strategy-instances.json`; check active registry and EA open orders/positions plus deal history. `magic=0` reserved no strategy/manual; current default `20261015` reserved for legacy/manual; do not allocate. Nonzero positive int31 for v2. Instance ID ULID/UUID random. On create reserve `RESERVED`; on stop active lock release, magic retired not reuse during retention; account unbind requires stopped and no exposure/reconciling. If change account/server/terminal/symbol? Symbol change maybe new instance because binding hash changes; account change rebind epoch and new approval, old instance REVIEW_REQUIRED then stopped. To avoid multi-strategy netting, MVP one running instance per account+server, and only demo; no multiple on same symbol/netting. This is recommendation [推断].
  Failure: collision, binding mismatch, account changed, no entitlement, params out of range, magic exhausted (unlikely no precise), restart crash. UI blocks start.
  Payload example as above.

  Phase3 execution:
  EA strategy engine calculates signals from deterministic rules and market data. Who calculates lot/SL: deterministic EA with symbol specs, free margin etc; main checks risk limits and approval, EA final. AI not involved. Need flow signal→command→main validation→receipt. But if EA itself computes signal and sends command to main? Existing file IPC direction is main writes commands to EA, EA can't call main except writing outbox events. Need new `signal.json`/outbox event `STRATEGY_SIGNAL` from EA to bridge; bridge forwards to main; main validates then writes signed command back to same EA inbox; EA executes. That's a loop but consistent with "信号 → 命令 → 主进程校验 → 回执". New EA outbox `signal_<id>.json` unsigned? It is local EA file, bridge reads; main shouldn't trust signal for volume; strategy package approved determines. Need HMAC signal? EA has secret, can HMAC signal too. Design: EA writes signed `strategy_signal` event with `instance_id`, `magic`, `signal_id`, `template_hash`, `params_hash`, `binding`, `side`, `requested risk` maybe no volume? Deterministic program calculates volume in EA but main needs validate. Could main recompute or clamp? mojo principle deterministic program, can be EA; main verifies against approved risk and snapshot. Use `volume_lots` computed by EA, SL/TP converted by EA or command points? Current protocol uses sl_points/tp_points; EA converts toprice. For strategy, risk engine calculates lots based on equity, stop distance, tick value, contract size, volume step. Main does not ask AI. Main `StrategyController` checks signal corresponds to active instance and approval, no duplicate signal_id, command within limits; then calls internal existing `sendCommand` after v2 extension. EA final preflight again. `ORDER_MARKET` payload example includes:
  ```
  "origin":"STRATEGY",
  "instance_id":"si_demo",
  "signal_id":"sig_demo",
  "magic": "<assigned>",
  "template_id":..., "template_version":..., "params_hash":...,
  "symbol":"EURUSD","side":"BUY","volume_lots":0.01,
  "sl_points":250,"tp_points":500,
  "max_deviation_points":30,
  "comment":"si_demo"
  ```
  tag vs comment choose `tag`? Existing UI uses tag but protocol comment. We can recommend unify `tag` and map to comment? User explicitly example magic/tag. Use payload `tag:"strategy:si_demo"` and also protocol comment? Better avoid duplicate. Define v2 canonical field `tag` and EA builds comment `NN1-<id8>-<tag>`; migrate UI from tag to protocol. No `comment` arbitrary from renderer for strategy. Or retain `comment` as derived server-side only. Need state `tag` not signed now; v2 signs. `magic` per command must be authorized equals instance registry; EA no longer blindly InpMagic for strategy; legacy manual v1 uses InpMagic. New protocol supports `ticket` for close and signs it.
  Receipt example:
  ```
  {"v":2,"id":"cmd_...","stage":"EXECUTED","account":"...","order":"...","deal":"...","price":...,"instance_id":"...","magic":...,"signal_id":"...","ts":"...","message":"已成交","sig":"<HMAC>"}
  ```
  EA must include attribution and HMAC sign receipt to support trusted cues. But deal price numeric example can placeholders.
  Failures: duplicate signal, stale approval, TTL, rebind, license expired, margin insufficient, trading off, old EA, result unknown. UI signal→command stage timeline, RECONCILING blocks instance and requires human.
  Observability UI strategy card status and last signal/order/receipt.

  Phase4 observation:
  Minimum fields tables:
  - equity_samples: `account_server, account, terminal_id, instance_id?` Account equity cannot be attributed per instance ifmultiple; for strategy performance need strategy equity based on allocated capital + realized+unrealized PnL attributed by magic. In MVP one instance per account simpler account equity = strategy account equity but still deposits/withdrawals confound. Need include `sample_ts`, `account`, `server`, `balance`, `equity`, `margin_free`, `currency`, `source_seq`, `instance_id` nullable, `cash_flow_adjustment` maybe external cash flows. To make performance credible, track `balance_operations` (deposits/withdrawals) from deals. Fields minimal:
    - `ts_utc`, `account_key_hash` (pseudonym), `instance_id`, `magic`, `balance`, `equity`, `currency`, `open_pnl`, `source`, `epoch`, `seq`.
  But account-level balance/equity should not duplicate per instance if multiple. MVP one running instance. Need define performance curve per instance based on strategy-specific `allocated_equity` maybe not actual separate funds. Better: For template marketplace aggregated performance across users, cannot expose individual account data, need consent and normalized returns, privacy. For MVP no public performance claims, only "本机模拟运行" curve. Public template performance later needs verified live-forward data from EA with deal events and equity samples; backtest separately. User asks "需要哪些新数据才能让策略广场上的绩效曲线真实可信（净值时序、成交明细、每笔归因到 instance_id）". We can list minimum:
    equity sample: event_id, ts_utc, account_key, instance_id, magic, equity, balance, currency, cashflow_delta, open_pnl, source_seq.
    deal: deal_ticket, order_ticket, position_id, command_id, signal_id, instance_id, magic, account_key, server, symbol, side, entry_in_out, volume, price, commission, swap, profit, deal_time_utc, epoch, receipt_sig.
    run lifecycle: instance_id, template_id/version/hash, params_hash, binding, state, started/stopped, approval_id, EA/app/protocol versions.
    data provenance: source=EA/MT5, signature, received_at, gap indicators.
  Need not include exact formulas, but performance must exclude deposits, separate backtest/demo/live, no interpolation across gaps, no annualizing short windows, publish marker. These are design recommendations based on Minara facts.
  New IPC `strategy:equitySeries`, `strategy:listDeals`, `strategy:listEvents`;new EA files `equity.jsonl`, `deal.jsonl` or outbox events. Existing `snapshot` only latest not enough. Need avoid JSONL with MQL5 file writing complexity but design okay. Use outbox JSON per event + archive. Data uploaded only opt-in pseudonymized to platform. For public performance require server verification signed EA reports plus receipt and reconciliation; still client can be modified, so not fully trust. Mark residual risk.

  Phase5 monitoring and stop:
  Existing refresh 1500ms UI, bridge receipt poll 500ms, EA input default 250ms, heartbeat 1s. User says复查间隔, can state current exact source values and proposed strategy health checks every existing snapshot refresh, not new precise. Avoid set new numeric intervals; reuse existing cadences for MVP; no auto-trading decisions based solely on UI timer. Anomalies: heartbeat stale, signed false, trading_allowed false, account/server/epoch mismatch, magic conflict, data gap, receipt RECONCILING, drawdown/risk limit breached (deterministic). On anomaly -> `REVIEW_REQUIRED` no new signals; user options stop only (leave positions), pause, close selected positions with separate confirmation. Stop never auto closes (Mojo fact), explicit. Stop flow `STRATEGY_STOP` stops new signals, cancel pending orders optional separate confirmed, open positions left default; after no pending commands and exposure disposition, state STOPPED; release active run slot and account binding, magic retired for attribution. If rebind, epoch invalidates old commands.
  UI shows running, paused, review_required, stopped; positions labelled "策略持仓/非本策略/归属未知"; unknown cannot auto close.
  Failure: EA offline stop cannot reach -> local state STOP_PENDING but EA may still run; need fail-safe EA lease/heartbeat. Important: if desktop/bridge crashes, EA strategy engine could continue trading autonomously. Need dead-man switch lease: EA only RUNNING while valid renewable run lease from main; lease expiry stops new trades, no auto close. Current EA has no lease. Add signed `run_lease_until` refreshed via existing? new `STRATEGY_LEASE` command; not set too short to avoid clock issues. User wants bridge crash behavior. We can propose on bridge crash, main marks unknown after restart; EA lease expires -> no new orders; require reconciliation. No exact lease duration "待确认" or [推断] short time. Need not invent precise. Use "租约时长待真机压测确认". Good.
  Monitoring cadence existing numbers source okay.

  Phase6 billing:
  Decision D5 subscription/license. Template entitlements monthly/yearly and run slots; AI credits separate meter. No profit share now. Platform service returns signed entitlement with license_id, subject user_id, template scopes, run_slots, expires, revocation generation maybe offline license cannot dynamic. Existing license key has seats only; use `seats` as run slots? Better not overload; new signed entitlement JWT-like or same NN1 payload schema v2 with `entitlements` but license.js v1 rejects v2. Could keep existing license as app activation and platform online entitlement for template/run slots with offline signed cache. MVP use existing licenseStatus gate only, stub `entitlement` in test; no real subscription linkage until Supabase mapping. Payment website existing but backend actual callback not in repo; mark 待确认. Need not claim already fully integrated. Entitlement payload example:
  ```
  {
   "schema_version":"nn.entitlement/1",
   "subject":{"license_id":"NN1-TEST","user_id":"u_demo"},
   "scope":{"templates":["tpl_demo"],"run_slots":1,"mode":"demo"},
   "expires_at":"...",
   "revocation_generation":"...",
   "sig":"..."
  }
  ```
  No precise pricing. Before create show price/billing period/run slots/AI credits separately (AlphaFox billing preview fact). On expired no new starts; running -> stop new signals at expiry? Need choose safe behavior. Subscription expiry should not immediately stop risk management/closing. Fail-closed trade commands currently all license gated including close! If license expires and reverify, `sanitizeCommand` blocks POSITION_CLOSE too, preventing risk reduction. Current gate blocks all command types including SYNC_STATE actually because license check before type, despite comment unauthorized can view snapshot (snapshot separate). For safety, proposal: expiration blocks new exposure and strategy start, allows POSITION_CLOSE / cancel / reduce-only and SYNC_STATE; existing main currently blocks close if licenseState not ok. Need flag change necessary. User asks沿用公道到期/过期. Recommend grace? No exact. "到期：禁止新开/加仓，允许平仓/撤单/修改止损与同步，运行实例进入 EXPIRED_HALT 并提示续费；不自动平仓". If running expires while no periodic check current doesn't detect; new periodic reverify needed.
  "唤回" likely revoked template or license: online revocation -> no new start, stop new signals at next check, allow risk reduction; offline cached entitlement until expiryis risk, so short-lived entitlement and template revocation list; actual revocation offline impossible immediate, mark. For revoked template due security, platform push revocation if online and EA lease short; if offline cannot instant, UI show last verified. No fabricated.
  AI credits: charge only for AI explanation, not trade signals; insufficient credits must not stop strategy risk controls; AI unavailable degrade to deterministic alerts. Strategy subscription and AI credit ledger separate but same user account.
  Payment link with `openExternal` existing https, real payment callback integration 待确认.

  D3 MVP design:
  Need clear real vs stub:
  Real today:
  - Electron UI actual app.js/index/preload, verify-main 30/30 (ran).
  - bridge protocol build/sign, EA Python verification 10/10 (ran).
  - AI gateway mock billing 15/15 (ran; README says 14 but actual output 15, source code results 15; report actual run).
  - MT5 bridge/EA source real, but no real MT5 test performed on macOS; cannot claim.
  - no strategy templates UI, instance registry, DSL engine, per-command magic, history/equity, subscription entitlement integration, AI chat.
  Stubs for M0:
  - template local fixture one "test_signal" fixed small demo (parameters not investment strategy).
  - instance registry in test memory or JSON temp dir.
  - terminal and account SNAPSHOT from stub-ipc.
  - signal emitted manually by test harness, not market indicator.
  - MT5 execution optionally real manual path or simulated receipt stub.
  - entitlement valid fixture, AI reply mock.
  M0 goal: UI simulation only no real trade, verify full state machine no order before approval.
  M1: actual MT5 demo with v2 EA and test template fixed signal. "用现有代码就能跑起来" perhaps current code can't do strategy; M0 can use stubs injected without business modifications like verify-main. Need operations:
  0 environment note `ELECTRON_RUN_AS_NODE=1` must unset.
  1 `env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tools/verify-main.js` expected 30 pass.
  2 `python3 test/ea_sim.py test/vectors.json` expected 10 pass.
  3 `node ai-gateway/test/smoke.js` expected 15 pass.
  4 run app `env -u ELECTRON_RUN_AS_NODE npm start` on Windows MT5? `npm start` with env on mac; for real MT5 use Windows. Need not actually run app becauseit opens UI, no. Manual:
  - activate valid license (cannot provide key; use test stub for M0). In real MT5 step requires valid key user-owned.
  - Terminal & EA rescan, select demo terminal, install EA, attach to chart enable Algo, set InpDemoOnly=true and InpAutoTrade=false initially. Expected EA online signed true.
  - M0 strategy stub not present in UI, can't click nonexistent. Could instruct DevTools execute? Not good and CSP. Could use new test harness planned. Since user asks "逐步操作手册（命令、点击路径、每一步预期）", can have two tracks: current baseline manual existing UI + proposed M0 harness click paths after minimal stub. But "用现有代码就能跑起来验证" no new strategy UI. Could map "选模板/调参数" to test script stubs only not actual click. We can clearly state no actual strategy click path exists, so don't pretend; operation manual for verifiable minimal closed loop uses existing "交易" manual order to represent approved instance execution:
    - Use template fixture as JSON external not loaded by app? Without new code, user can't select. Could test via `node -e` reading fixture but file not exist. We could include in report payload, not create actual fixture because only requested report. M0 "paper walkthrough" not executable end-to-end. Need satisfy better by designing an executable harness with code snippets? They didn't ask implement tests, just design. "可执行" likely means detailed enough to execute, not necessarily already implemented. We can describe files to add (tools/verify-ecosystem.js, test fixtures) and commands after implementation, while clearly saying current cannot run until those stubs added. But phrase "用现有代码就能跑起来验证的最小闭环（可以先用桩数据）" implies use existing code plus test harness, no production strategy implementation. So yes new test-only harness can inject stubs into real UI but existing UI has strategy placeholder so needs at least minimal UI implementation. Unless harness can executeJavaScript DOM to replace placeholder at runtime, but that's not real app. Could still verify state machine separately without UI. We can propose test-only driver around real main/bridge/protocol and fake EA, plus existing UI tests; no production UI change needed for core closed loop. Manual click path covers existing manual execution not template selection. Hmm.

  We should design MVP slices:
  - M0 "可演示" includes minimal code additions not purely current? But userD3 says use existing code able to run with stubs, likely test stubs accepted, not new engine. Need explicitly "复用真实 app/preload/main/bridge/protocol/EA；只新增测试夹具和最小 strategy controller；没有这些新增就不能称为策略闭环". This is honest and executable plan.
  - Step operations after M0 fixture implemented. But they asked current manual commands and expected; include baseline commands actually run and M0 commands proposed, labels.
  Maybe document file can include full operations for both.

  At least 25 assertions. We can provide 32 with ID, object, expected, failure meaning, level. Need concise but complete. List:
  Baseline existing (B01-B10):
  1 template catalog? Not existing. Need new assertions 30:
  A01 template signature valid accepted; fail means integrity gate broken.
  A02 tampered byte hash/signature reject; no instance.
  A03 unsupported schema/EA version -> INCOMPATIBLE no deploy.
  A04 invalid params -> DRAFT rejected no magic/run slot consumed.
  A05 create instance -> persisted instance id/binding/params hash/magic unique.
  A06 two instances same scope no same active magic; conflict.
  A07 magic 0/negative/noninteger/out of range -> reject.
  A08 no confirmation start -> no sendCommand and no inbox file (red line).
  A09 AI text trade request -> no approval/no order (red line).
  A10 approval mutated params/binding/magic -> hash mismatch no order.
  A11 expired/revoked/replayed approval -> reject no order.
  A12 entitlement missing/no run slot -> start reject no order.
  A13 unauthorized license -> existing sendCommand reject; negative.
  A14 terminalPath lacking MetaQuotes -> reject.
  A15 volume 0/NaN/>1000 -> reject.
  A16 command type not whitelist -> reject.
  A17 strategy command without magic/instance/tag -> main reject and EA reject.
  A18 v2 fields tampered after signature -> EA HMAC reject/quarantine.
  A19 v2 sent to legacy EA capability absent -> main blocks before inbox.
  A20 account/server/epoch mismatch -> EA rejects no OrderSend.
  A21 valid approved test signal -> exactly one command with ORDER_MARKET and attribution.
  A22 duplicate signal_id/command id -> no duplicate order.
  A23 EA InpAutoTrade=false -> REJECTED no order.
  A24 demo only on live account -> REJECTED no order.
  A25 receipt EXECUTED -> UI timeline and deal attribution instance.
  A26 no receipt timeout ->RECONCILING and no auto replay.
  A27 stop -> no new signals; existing position remains absent separate close confirmation.
  A28 stop + explicit close -> only selected magic position close command; but current ticket bug fixed v2.
  A29 rebind -> epoch increments old commands EXPIRED and instance review.
  A30 bridge crash/restart -> no auto restart trading, run lease expires, recovery review, no duplicate.
  A31 equity samples/deal events -> curve only actual samples, gaps marked, no synthetic performance.
  A32 backtest/demo/live labels -> never mixed.
  A33 AI context redaction -> no secret/token/license key/path/full identity.
  A34 AI credit failure -> no impact trading/stop; AI refund maybe gateway test.
  A35 subscription expired -> new exposure blocked, close allowed.
  A36 revoked template -> new start blocked, risk reduction allowed.
  A37 old instance persistent restart -> state and magic registry restored no reallocation.
  A38 unauthorized roles matrix? creator cannot price/settle, admin cannot trade.
  Could list 32-36. Need each expected and failure meaning. User wants at least25, no max. Final <=400 lines can fit 30 rows one line each. Document maybe 36.

  Need separate "current automated" vs "M1 after additions". Assertions that existing main sanitization isn't easily tested with stub UI need harness using real main. Mark tests:
  - `UI` can run now baseline
  - `P` protocol can run now + new v2 later
  - `M0` stub controller to add
  - `M1` real EA/MT5.
  Could have 30 exactly, with status "现可" for 6 existing and "新增" for rest. But user wants safety redline automatic including negative test. We can define test harness with fake EA OrderSend spy, file inbox. Need explicit negative test implementation mechanics:
    - `strategyStart` without approval; assert `sendCommand` spy count 0 and no `cmd_*.json`.
    - AI call returns "BUY" and attempts tool? assert no approval tool available and count 0.
    - Forge v2 command with valid HMAC but no approval in EA active registry; assert REJECTED and OrderSend spy 0. This requires EA strategy runner or simulator; until implemented only stub, real MT5 risk.
    - Mutate volume after approval; assert no file.
  Need include "未经用户确认 EA 不得下单" at three layers and negative cases. Main native dialog approval ensures actual user gesture; test can autoanswer native dialog? Electron `dialog.showMessageBox` stub responses, but then test simulates click. Negative no response/cancel.

  D4 security:
  Command-suite validation additions:
  - command type-specific schemas required fields, reject unknown fields, no generic payload passthrough.
  - magic nonzero safe integer range, allocated/active/exact instance/binding, conflict scan, no reuse.
  - instance_id/tag/signal_id ASCII length/charset (specific lengths design maybe no need exact), template id/version/hash params hash.
  - template params JSON Schema, unknown fields reject, min/max/step/enum, cross-field risk constraints.
  - approval binding exact plan hash, expiry, single-use? Strategy approval should allow multiple orders over running period, not single-use approval for whole run. Earlier I said single-use approval token for `strategyStart`; the run approval can be consumed once to activate instance; subsequent commands authorized by active run lease not approval each trade. `approval_id` one-time start, run lease thereafter. Good. Each manual order confirmation separate; strategy user approves strategy card allowing multiple trades within constraints. Red line "未经用户确认 EA不得下单" means strategy-level confirmation counts. Need clarify: approval per run, not per trade, with immutable params and risk. AI can't change. `run_lease` authorizes multiple commands while running. Approval token single-use at start, plan hash.
  - account+server+terminal binding, demo mode, symbol/timeframe, netting restrictions.
  - volume existing + broker spec + strategy risk, SL/TP nonnegative finite integers? Current sl points Number can negative main doesn't validate, EA only if >0 else 0. New reject negative and nonfinite all numeric fields. `ttlMs` finite positive max to avoid no expiry, `epoch` current, `max_deviation` nonnegative.
  - position close ticket required and signed, magic ownership check.
  - version negotiate, unknown `v` reject, old EA no v2.
  - receipts HMAC and monotonic seq, replay detection.
  - resource limits payload size, string length, pending commands rate? New strategy signal rate/cooldown.
  - no arbitrary file path/template path from renderer, main resolves IDs.
  - separate internal strategy controller from preload; don't expose generic `sendCommand` to AI. Existing UI needs manual sendCommand; keep but `origin=MANUAL` native confirmation? For strategy no direct generic.

  AI data matrix:
  Can see with consent minimization:
    - template public metadata/rule descriptions/risk labels/version, anonymized aggregated metrics.
    - redacted runtimestate: instance alias, symbol, state, last event stage, numeric positions maybe only selected user-initiated context; current equity maybe user-provided.
    - AI user token stays main, not renderer? Current token persisted main, preload connect takes token input. AI gateway receives token in Authorization, not model upstream. Model should not see token.
  Cannot see:
    - bridge secret, HMAC signatures? Signatures not secret but no need; private keys, AI token, license key, unredacted terminalPath/file paths, payment/admin credentials.
    - customer identity: exact name/license id/account login/server? Server maybe less sensitive; user says customer identity classification. Use full customer identity never by default; account login+server pseudonymized; exact account history sensitive and only on explicit consent minimal window. Need categorize:
      - secret paths/keys: never AI, never gateway model.
      - customer identity (name, license id, exact account login, terminal path): never to model; gateway auth user id only as needed, not in prompt.
      - complete trade history: not by default; sensitive, explicit per-request consent, minimized aggregated/redacted window; raw full history remains local. "绝不能看到什么" could say complete unabridged history never for MVP; later opt-in. 
      - payment details, recharge token/admin secret never.
  AI cannot call sendCommand/strategyApprove/strategyStart/stop/close; can produce draft/explanation; trade action displayed as card requiring user native confirm. AI credits not safety control.
  Permissions matrix 4 roles vs view/subscribe/run/publish/change price/settle:
  Unauthenticated: view public template metadata and aggregated verified performance? yes, no subscribe? Usually can view, subscribe requires auth. "看" can mean public templates, no private. Subscribe no, run no, publish no, price no, settle no.
  Authorized user: view all entitled public/subscribed, subscribe yes own, run own within slots demo (live later), publish no (unless also creator role), price no, settle no (can view own billing not settle).
  Creator: inherits authorized? Need role stack. Can publish own templates subject review, change own price within bounds maybe after review/version, settle own creator earnings? But recommendation no profit share now; creator subscription revenue settlement maybe platform admin only. "结算" define execute settlement. Creator can request/view own statements, cannot execute settlement; platform admin settles. subscribe/run own yes if licensed.
  Admin: view metadata and necessary audit, not customer secretsby role alone; subscribe maybe no need, run no on customer account (never), publish review/approve rather than own? Table can "审核/上下架" rather than publish. Change price platform fee/own? admin can change platform pricing with audit, creator own price proposal. Settlement yes with dual control? Design [推断] "复核后执行". Admin cannot approve trade or run as user.
  Need avoid two account systems: single `user_id` tree, roles are many-to-many `user_roles`, referral tree `referrer_user_id`, creator_profile same user_id; subscription/referral/AI credit ledger all user_id. Node can be both referrer and creator, commissions separate ledger types not separate wallets maybe one account with ledger tags. Prevent cycles/self-referral, one root tree, not multi-level? Existing distribution recommendation system details 待确认. Design: `parent_user_id` for referral, creator attributed separately? They ask merge as one tree. Use one account and one relationship tree: each user has `referrer_id`; creator is role on node; template sale allocates creator revenue and referral commission according to one order's policy; no separate creator login. Need avoid double counting and circular referral. Prices and settlement admin. For now creator fixed subscription share? This is a form of revenue share not profit share. We can recommend creator gets template subscription revenue share later/now? D5 says subscription/unlock templates/run slots, can have creator revenue share from subscription fees (not profit) which avoids trade data trust. Need decide: Creators can earn fixed revenue share from net template subscription receipts; platform referral from remaining according to policy. No exact percentages, "待确认". This supports ecology. Need no two account systems. Could include "分润推后" refers profit share; creator revenue share of subscriptions can still be implemented M3 after invoices. In MVP creators internal only.

  Fault behaviors:
  - expiry: current vs target as above, require_human? Expiry can auto halt new exposure deterministic no human required to stop, but open positions require human disposition; state `EXPIRED_HALT` plus `REVIEW_REQUIRED` if position/unknown order.
  - old EA: disable deploy/run, prompt upgrade; no strategy commands; if running version becomes incompatible/heartbeat lost -> lease expires and review. No automatic update/restart.
  - bridge crash: current no restart, pending timeouts; target UI disconnected, EA lease stops new orders; restart restore registry, reload command/receipt archive, reconcile MT5 before resume; `REVIEW_REQUIRED`; noclose automatically.
  - recall/revocation: block new, stop new signals on next lease, allow close.
  - global halt current renderer-only and not persistent/main gate; important source: state.halted only app.js, can be bypassed by direct IPC and doesn't stop EA. Need mention not sufficient for strategy kill switch. Add main+EA halt signed, persistent? Stop new trades, fail-closed. Current button text "全局停用" but only renderer. D1 gap maybe include "一键停用" row. This is vital safety.

  D5 business:
  Recommend "订阅/授权制（平台计划 + 模板订阅 + 运行位） + AI积分按量；不 profit share, not per-hour initially". Why:
  - fits existing license/credits/payment and offline activation.
  - revenue predictable and billing independent of client-reported PnL.
  - client funds self-hosted so no need flow funds.
  - easier entitlement and tests; transparent billing preview.
  - creators compensated via subscription revenue share from actual payment receipts, not trading profits (later). Avoid per-hour because offline/client clock manipulation, disputes and encourages shutdown; not buyout because ongoing template updates/support and run slots. Need choose not list but can explain rejected alternatives briefly.
  "可以先用订阅制，把分润推后？理由与代价" yes. Costs: creator upside capped, less aligned with performance, subscription churn/refunds, need entitlement/revocation and customer value, user may dislike stacked fees. Mitigate unified bill, plan includes run slots and template allowances, AI credits separately itemized, no performance promises.
  If profit share later:
  - Only closed realized PnL after commissions/swap/fees, high-water mark, loss carryforward, no share loss periods, cash flows excluded, per instance/account/magic currency.
  - Signed EA event reports with per-install key? Current HMAC secret shared main and EA, client controls both, so signature only detects transport tampering, not malicious client. Need explicit cannot solve fake client. EA-side signing key in client still accessible; not strong trust. 
  - Triangulation: MT5 trade transaction/receipt (OrderSend result) + HistoryDeals + equity/balance time series + command archive, deterministic reconciliation, sequence gaps and duplicates, challenge-response, server consistency checks. "只认 MT5 撮合回执" insufficient because OrderSend can timeout and not include all later deals/swap; use deal history as source of truth after reconciliation. Real broker server not directly accessibleto platform, so all data from client remains self-reported. Only broker read-only investor password/API/server-verified statements or broker integration gives stronger evidence; MT5 investor password still user-provided data but platform retrieves directly maybe better. Do not request credentials in MVP. Manual statement audit for high amounts.
  - Dispute: if gaps or mismatches, no settlement (hold), no estimates, no negative clawback? Use "进入待核对，不结算". Never trust AI to calculate.
  - "EA 侧签名上报?" yes for integrity/replay only, not authenticity against user controlling device.
  - "客户端 cues 对账?" likely "cues" maybe cues = 回执? They wrote cues maybe queues? We can say "客户端回执/队列对账". Need not assume exact.
  - "只认 MT5 撮合回执?" no, receipts alone insufficient; combine history and equity. 
  - Settlement only realized profit with high-water mark and loss carry, no open PnL.
  Three things not now:
  1 realized profit share/auto creator settlement based on client reports.
  2 live auto trading/multi-instance same account/copy trading at scale/public leaderboard with unaudited performance. Need exactly three; combine.
  3 AI auto-approval/auto-order/AI-based position sizing, or per-hour billing and independent creator account system? They ask three things "现阶段不建议做" likely profit share, real-money auto trading, AI direct trade/public performance. Could list:
    1. 分润/按盈利自动结算 and public yield rankings maybe separate.
    2. 实盘全自动、多策略同账户跟单 (MVP demo only).
    3. 让 AI 直接下单/算手数/止损 or build two account systems? Need business focus maybe "按运行时长计费" not now. They explicitly ask three no-dos overall, choose high impact:
      - 不做基于客户端盈亏的分润结算
      - 不做未经可验证数据的公开收益榜/保本宣传（combine）
      - 不做 AI 无确认交易或 AI 参与手数/止损计算
  Real live maybe milestone M3 public includes live? Could recommend public launch still demo only? Goal stop/continue maybe real eventually. M3 public online perhaps controlled real? Boss wants focus, this quarter no real auto trading likely wise. But user expects MT5 trading product current manually supports live if InpDemoOnly false, UI says simulation. Strategy should only demo M2and maybe M3? We can state "本季度不做策略实盘自动交易；M3公开上线仍为模拟盘策略 + 现有人工交易链，实盘策略准入另行立项". This is decisive. Then three no-dos: profit share, live auto/multi-account copy, AI direct. Public unaudited performance can be part of milestone no launch without data. We can add additional no-hour billing maybe not "three" exactly? They ask three things, keep exactly three in section, elsewhere say not recommended per-hour as decision rationale but not counted? Fine.

  D6 milestones:
  M0可演示: local template fixture, stub instance registry + mock signals/receipts, strategy UI simple, AI mock explanation, entitlement fixture; dependencies K3-A schema+one template, K3-B cards/confirm, K3-C Review/AI boundary. Assertions new template validation, approval redline, state flow, stop etc maybe 12. Completion debt if skip: UI demo detached from real protocol, fake performance risk.
  M1内部可测: protocol v2, fix ticket/tag, main StrategyController+native approval+registry/magic, EA deterministic runner one fixed signal/template, per-command magic, telemetry, real MT5 demo, crash/rebind tests, subscription entitlement still stub/local signed; AI gateway read-only redacted tools. Dependencies K3-A execution DSL + compatibility; K3-B run detail/monitor; K3-C event taxonomy/redaction. Adds assertions ~? User says "完成时会多出哪些自动化断言" can refer IDs not exact counts to avoid fake precision. Use A01-A36 IDs groups. Each milestone assertion IDs.
  M2小范围客户试用: signed platform template service + entitlement linking Supabase existing website/payments (integration actual待确认), run slots, audit logs, telemetry opt-in, creator internal publishing, subscription payment preview, revocation, support/recovery, real customer demo only. No profit share. Add billing expiry/revocation/permissions/privacy/restart tests. Dependencies A template signing/publish lifecycle, B subscription/price pages, C audit/export/AI degradation. Debt if skip: cannot enforce paid access or verify customer outcomes.
  M3公开上线: reviewed templates, payment callbacks/reconciliation, creator subscription revenue share maybe not necessary; public performance only sufficient verified demo/live-forward data (no live auto). Operational monitoring, refund policy, security review, upgrade rollback. Adds upgrade/rollback, payment idempotency, public data separation, load/soak tests. Dependencies all final. Debt: public claims/support/security/regulatory risk.
  No dates precise because user asks time & dependencies maybe milestone table without actual dates? "时间与依赖" implies time estimates needed. We should provide relative calendar ranges [推断], e.g M0 1周, M1 2-4周, M2 4-6周, M3 8-12周? "禁止编造精确数字" applies facts, estimates can be design with [推断], but maybe safer use weeks as planning estimates explicitly [推断] and "待确认人力". Need give time. Could use "第1–2周", "第3–6周", "第7–10周", "第11–13周" this quarter. Precise but recommendations not factual. Mark [推断] and dependencies. Maybe one engineer team unknown, say "排期以 1 名客户端/EA 负责人 + 1 名平台/测试负责人为假设，人力未确认" but exact staffing invented. Better "相对排期（待确认人力与 EA 真机环境）：M0 第1–2周; M1 第3–6周; M2 第7–10周; M3 第11–13周". No claim, planning. Boss says not too many threads: this quarter only one mainline "demo strategy closed loop + subscription entitlement"; not doing profit share, live auto, public creator self-service, multi-strategy, DIY? K3-C DIY maybe other mainline; explicitly "DIY看板只保留现有/设计，不进入本主线" this quarter. They ask which not do this quarter: profit sharing, real auto strategy/copy trading, public creator self-service and revenue leaderboard, multi-instance/netting, DIY board full build, per-hour billing. Could list 4 categories but D5 exactly three no-dos separate. Fine.
  Need note K3-A/B/C files are transcripts incomplete? Don't mention in doc maybe "依赖其正式产物，当前 answer-A-templates.json 缺失；B/C正式交付待确认". We read answer-K3-A.md etc and they're logs, not final. Could say "K3-A/B/C 的最终产物均待确认；本方案只定义接口，不假设已完成." Good.

  Need source references in doc. Include code references `src/main.js:214`, etc. Facts unmarked; design paragraphs tagged [推断]. We can define at top:
  "标注规则：‘源码事实’均有路径；来自00-FACTS标‘外部事实’；所有方案、默认值、排期、风险判断均[推断]；待确认 explicitly. JSON是建议格式，整体[推断], no need every line." This might satisfy non-fact assertion marking by putting `[推断]` before each section/table row. Need not tag every JSON line individually; code block heading `[推断] Payload`. For final, same. Current source facts no inference.

  Need maybe produce file ~800 lines. User stdout <=400 lines, file no limit. We can create document detailed ~700 lines. Final condensed <=400 lines. We need ensure file output not too big per Write call max not specified, can Write large maybe 60-80k. We have token budget ~? currently used 42k? left 79k? Plenty. Need plan content fully.

  Could use subagent to review? Not necessary but perhaps have agent-mesh? User didn't ask second opinion. No.

  Need update todo after reading.We should maybe inspect existing answer-K3-D.md? Could contain requirements or previous work maybe not needed. It may be transcript similar. No need.

  Need careful exact statements:
  - verify-main test initially failed due env, then succeeded with env unset. Include command robust.
  - AI smoke output 15 not 14. Existing `ai-gateway/README` says 14, but actual test 15; report actual run 15. No need highlight mismatch.
  - EA vector test 10 pass existing vector generated maybe dates future but irrelevant.
  - No git repo, so can't status; no need mention unless final maybe not.
  - `answer-A-templates.json` absent; maybe now exists from other agent after time. Need check again before write. If exists, must read and use schema. We'll check directly near start of drafting maybe now.Still absent. Good.

  Need maybe D1 capability table implementation exact return for `sendCommand` main `call` returns `{id,type:result,ok:true,command}` with secret? command includes sig and main response to renderer includes full command with sig! bridge sendCommand returns `{id, command: cmd}` where cmd includes `sig`; main returns to renderer. Preload sendCommand resolves r and app only uses id but renderer can inspect r.command.sig. Comment "密钥不进入渲染进程" true but signature does. HMAC signature for command can be seen, not secret. Could this allow renderer modify? Not directly. No need.

  Protocol canonical doesn't sign `max_deviation_points`, comment, ttl_ms, issued_at? Canonical excludes issued_at and ttl too! It signs id,type,account,server,epoch,symbol,side,volume,sl,tp. Thus TTL, deviation, comment can be tampered without signature. Important D4: v2 sign all execution fields including issued/ttl/deviation/ticket/tag/magic. Current ticket dropped. Mention.
  `protocol.buildCommand` `issuedAtMs` param ignored in make-cmd then overwritten and resign if secret. Fine.
  `sendCommand` sanitize license before allowedTypes means even SYNC_STATE requires license, but snapshot free. Good.
  `main sanitizeCommand` `epoch` defaults 1; if app snapshot heart missing default 1, could mismatch. New binding validation.
  `rebind` returns secret to main only via bridge call; main ALLOWED.rebind returns r including secret to renderer! In main:
  ```
  const r = await call('rebind'...)
  if r.ok persist secret...
  return r;
  ```
  bridge rebind sends `{id,result,ok,epoch,secret}`. So `window.nn.rebind` response includes secret. verify stub rebind returns secret too. Preload comment says "密钥不进入渲染进程" but actual rebind returns secret to renderer. This is serious source fact and relevant AI data/security. Need highlight! User specifically current security says random key not exposed? 01 says bridge holds secret renderer zero direct access. But actual code returns secret on rebind to renderer. We must not ignore. We should state source-verified gap: `bridge:rebind` result includes `secret` (`src/bridge/index.js:251-254`) and main returns whole `r` (`src/main.js:220-224`), so rebind response exposes new secret to renderer despite preload comment. This must be fixed before strategy/AI. Very important. Also `installEA` result doesn't include secret. `sendCommand` returns signed command including HMAC sig but not secret. Rebind secret actual exposure. Include D1 row and D4 "先修复". Does user expect design based on code maybe appreciates. Need be precise not overclaim "secret can enter renderer" yes. `rebind` ipc handler returns r to renderer. Should recommend main return `{ok,epoch}` only, keep secret in main persist; bridge to main is okay. Also `persistSecret` writes mode 600. Good.
  - `app:saveLog` renderer can export arbitrary text with save dialog, no major.
  - `shell.openExternal` any https could be phishing if AI controls URL; new AI recharge URLs from server validated only https. For AI links, host allowlist. Mention.
  - `license.js` private key in repo keys but package files excludes keys; not relevant.
  - AI token load saved file mode default not 600, maybe sensitive; not needed.

  Current main global halt renderer-only as noted.
  - `snapshot` read heart/status if stale returns data null but `eaLive` based only heart; statusAgeMs undefined always if data else null. No actual age. Could mention monitoring gap "statusAgeMs未实际计算" code line 210. Useful for monitoring.
  - discover heartbeat comment says seq but only freshness. Could avoid overloading.

  Strategy engine in EA with main loop signals requires new IPC from bridge to main events. Existing bridge sends any non-id message to `bridge:event`; can reuse this channel for `strategy_signal`, `telemetry`, `run_state`. So D2 "走哪个已有 IPC": EA->bridge file outbox new event -> bridge stdout no id -> existing `win.webContents.send('bridge:event')` for UI; but main StrategyController must intercept events before forwarding to execute commands. Current `startBridge` else just sends to window; need add main event handler for strategy signals. New method not IPC channel, reuse `bridge:event` for UI notifications; not let renderer approve via event.
  - `bridge:call` internal not exposed arbitrary; strategy controller can use call.
  - Template service fetch in main using global fetch (Node/Electron) similar refreshAI.
  - Data upload to platform new main service with user token; no renderer remote.

  Need decide file structure:
  Title
  0 Reading scope and decision summary
  - inputs & missing K3-A
  - verification run results
  - recommended architecture one sentence
  - temporary minimalschema.

  D1 table with 16 rows and notes critical code gaps.

  D2 data flow:
  2.0 state and IPC map maybe table "阶段/来源/已有IPC/新增/落点"
  2.1 template with payload envelope+minimal template JSON (could combine).
  2.2 instance payload + magic rules.
  2.3 execution signal payload, command payload, receipt payload.
  2.4 observation field table + event payload.
  2.5 monitoring stop payload.
  2.6 billing entitlement payload.
  Each with failure & observable maybe table per phase. To avoid huge file can one common failure table with six rows and payload examples each.

  D3:
  - real/stub table
  - operation manual current baseline + M0 harness (commands and UI click).
  Need proposed test file `tools/verify-ecosystem.js` not actually created. To be executable after adding harness, maybe steps:
    1. Baseline commands actual.
    2. M0 test harness to add test-only (exact scope) `env -u ... electron tools/verify-ecosystem.js --mock-ea` expected assertions A01... Maybe user asked "用现有代码就能跑" and we haven't created script. Could document "以下 M0 命令是目标接口，当前会失败因为文件尚未存在；不把它列为现可运行" but then not satisfying "必须可执行". Could instead actually implement `tools/verify-ecosystem.js`? User only asks write file answer-D, not code; creating test script would be beyond deliverables and nontrivial code changes. We should not. The task is design, so "可执行" likely means operational plan not actual run. We can be honest.
  Maybe design manual with only current existing code and no new script:
  - Step A UI baseline, B protocol baseline, C AI billing baseline, D real MT5 manual order with approval. This is an end-to-end closed loop "template" represented by a manual fixed parameter card? We can define "MVP strategy template = a fixed manual test vector" and use existing `test/make-cmd.js` to deliver command with user confirmation. But no template selection UI/instance persistence/magic attribution. Can't claim full loop. Could call it "最小可测闭环（不等同完整生态）": user manually chooses documented test template from research JSON, sets existing trade ticket fields accordingly, binds demo MT5, clicks order, monitors, AI gateway mock explains not connected to trade, license gate. Instance_id/magic stub tracked externally by test script? Existing EA uses fixed InpMagic so one instance can use that as magic. We can assign instance_id in a local JSON manually but app doesn't know. This can validate the physical trade path and user confirmation but not strategy automation. The user likely expects design of MVP, not current full capability, so okay to define M0 with stubs. Need avoid watering deliverable.

  We can phrase "最小闭环分两层：L0 今天即可执行（真实 UI/协议/AI计费 + 可选真实 MT5 人工单），L1 测试专用策略桩（新增一个测试脚本但不改交易语义），L1 才是生态闭环。本方案不把 L0 包装成策略闭环。" This meets honesty and gives executable path. Then "M0 实施手册" includes exact files to create and commands after; but not verified by us. In doc current tested commands separate from target.
  The user wants "哪些是真实现/哪些是桩" and "哪些现在测不了". This layered approach ideal.

  Maybe final condensed operation manual 12 steps:
  1 run baseline UI test expect 30 pass (verified)
  2 run EA sim expect 10 pass (verified)
  3 run AI smoke expect 15 pass (verified)
  4 M0 add test-only harness (not existing) inject `TEMPLATE_FIXTURE`, mock strategy controller, use real preload/app etc. command `... tools/verify-ecosystem.js` expected A01-A... (target, not run)
  5 open strategy page select "固定手数信号演示", expected template version signature "已验证（测试公钥）" no performance.
  6 adjust within range, bind stub terminal demo, create instance, expect DRAFT and magic reserved.
  7 click start without native confirmation/cancel, expect no order.
  8 click confirm, expect RUNNING and one mock signal; deterministic volume and SL values not AI.
  9 check receipt executed stub and curve actual samples only.
  10 AI mock explanation and credits; no order buttons in AI.
  11 click stop, expect no new commands, positions remain; click close separately to close.
  12 real MT5 optional: Windows, install EA, DemoOnly true, AutoTrade true only after test, manual approval; expected actual MT5 order. Current v1 cannot carry instance/magic so only verifies physical chain, not strategy attribution.
  Need not provide exact future command if script not exists as runnable today; mark "M0 验收命令（实现后）".

  Assertion table maybe 32, with `层` "M0/MT5". Need current tests not counted? We can list 30 new plus 3 baseline. Each has expected and fail meaning. We can choose 30 exactly for final compact. File can 36. But user at least 25, 30 enough. Let's craft 32:
  A01 valid template
  A02 tamper
  A03 incompatible
  A04 params
  A05 instance persist
  A06 magic conflict
  A07 invalid magic
  A08 no approval (red)
  A09 cancel approval (red)
  A10 AI request (red)
  A11 hash mutation
  A12 approval replay/expiry
  A13 entitlement no slot
  A14 unlicensed
  A15 terminalPath
  A16 volume/type invalid (could split to 2)
  A17 command missing attribution
  A18 signature tamper
  A19 legacy EA
  A20 binding/epoch mismatch
  A21 approved signal exactly one
  A22 duplicate signal
  A23 AutoTrade false
  A24 live when demoOnly
  A25 receipt attribution
  A26 timeout reconcile no replay
  A27 stop leaves positions
  A28 separate close ownership
  A29 rebind invalidates
  A30 bridge crash lease/review
  A31 equity/deal curve no fabrication
  A32 performance source labels
  A33 AI redaction
  A34 AI failure no trading impact + refund
  A35 expiry blocks open allows close
  A36 roles admin cannot trade/creator no settle
  36 is fine. File long but okay. Final can list all 36 in table one line each ~36 lines. Need include object expected failure meaning, yes.

  D4 failure states and permission matrix.

  D6 time and debt.

  Need maybe source facts vs [推断] marking in table rows. We can set "D1全部为源码事实，缺口中直接影响由源码可见；风险判断[推断]" but some gap statements are interpretations. Tag gap cells [推断] where design. For example "需新参数" is recommendation, mark [推断]. Current missing fields factual. We can put column "现状与缺口（源码事实；建议以[推断]标）". Might be verbose. Top convention "所有‘需要新增/应/建议/推荐/ MVP/里程碑’内容均属于[推断]，标题已统一标注；不再重复每字" but user says non-fact assertions all marked. Section heading `## D2 · [推断] 端到端数据流` marks whole section as inference. D3 test expected not factual, but design section marked [推断]. D4 current facts unmarked,recommendations marked. D5 entire recommendation [推断]. D6 entire [推断]. This is acceptable. In final, label each major section [推断] except D1.

  Need no "stdout" literally tool? Final answer is stdout. Include condensed content within 400 lines. We can write file then final summary maybe not repeat entire file? User explicitly stdout includes all sections, so final must be long. Fine.

  Before writing, update todo D1 done D2 in progress.Need now compose file. Could Write one big content around 50k. Need ensure no unverified claims. Let's draft carefully.

  Potential issue using exact `magic` range design. We can specify "正整数、安全整数、非 0；MVP 兼容现有 input int，限制在有符号 32 位正整数，实际可用上下界待 EA 编译与券商测试确认". Current input int definitely 32-bit in MQL5, source language fact external? Code uses int; can infer. To avoid needing external fact, "为兼容当前 `input int InpMagic`，MVP 仅分配正的安全整数，并先按 EA `int` 可表示范围校验；精确边界待真机确认". But magic allocation needs clear. Could say use crypto random 31-bit positive as design, not external claim. `crypto.randomInt(1, 0x7fffffff)` max exclusive; range 1..2147483646. This is a chosen design, allowed. Exclude current default 20261015. Use exact numeric design not fabricated. Mark [推断]. Clear conflict detection:
  1 instance_id UUID, magic derived random from crypto not model.
  2 atomic registry with unique scope+magic active/retired.
  3 before RUNNING, EA returns used magics for open positions/orders + all retrievable history since feature launch; if collision regenerate.
  4 no reuse retired magic in MVP; active run slot released but numeric retired.
  5 multiple devices same account residual collision risk, platform allocation later; if detected require-human.
  This is clear.

  Current `status.positions` no magic; need add. `HistoryDeals` Reconcile uses fixed InpMagic. New strategy runner needs history scan all assigned magics. Good.

  "模板落到 EA" through new command `STRATEGY_INSTALL` includes signed template? EA HMAC command from main plus template Ed25519 signature? EA shouldn't need platform public key maybe main verifies then HMAC package. For defense in depth EA stores `template_sha256` and checks package hash, does not need verify Ed25519. Main is trust boundary. However if main compromised, HMAC secret accessible anyway. Fine.
  Template package canonical JSON `template_sha256` computed over canonical template bytes. HTTP envelope signature over `template_sha256 || template_id || version || schema_version` with platform Ed25519. Exact canonicalization needed to avoid signature ambiguity. Define signature base string:
  `nn-template-v1\n{template_id}\n{version}\n{sha256}\n` where sha256 hex of canonical JSON (RFC8785?) Could mention deterministic canonical JSON, but current EA parser not full. For client main JSON string stable; use " canonical JSON（键排序、数值格式规范，规范待 K3-A 对齐）". To be implementable choose UTF-8 raw `template` payload bytes and envelope includes raw? JSON can't easily preserve raw bytes. Could distribution envelope contains `template_b64` and signature over bytes, but less readable. Simpler:
  ```
  {
   "envelope_version":"nn.template-envelope/1",
   "template_id":...,
   "version":...,
   "template_json":"<canonical JSON string>",
   "sha256":"...",
   "signature":"..."
  }
  ```
  But user expects template JSON object maybe string awkward. Better envelope `payload` object and define canonical serialization. Use JSON Canonicalization Scheme (JCS/RFC8785) external fact not in source; would need [推断] as design choice, okay. No internet needed. We can say "[推断] 采用 JCS  canonicalization; 若 K3-A 另定则以其为准". MQL5 doesn't need verify Ed25519, only hash of bytes; main sends extracted package. Good.
  - platform public key separate from license public key, private stays server.
  - local test fixture signed with test key, production cannot trust test key. Important security test.

  Minimal template schema:
  ```
  {
   "schema_version":"nn.strategy-template/1",
   "template_id":"tpl_fixed_signal_demo",
   "version":"1.0.0",
   "name":"固定信号演示（非投资建议）",
   "engine":{"type":"EA_RULE_V1","min_ea":"2.0.0","protocol":2},
   "binding":{"symbols":["EURUSD"],"timeframes":["M15"],"account_modes":["demo"]},
   "parameters":{
    "volume_lots":{"type":"number","default":0.01,"min":0.01,"max":0.01},
    "sl_points":{"type":"integer","default":250,"min":0},
    "tp_points":{"type":"integer","default":500,"min":0}
   },
   "rules":[{"on":"TEST_BUTTON","when":{"event":"BUY_TEST"},"do":{"command":"ORDER_MARKET","side":"BUY"}}],
   "risk":{"max_open_positions":1,"allow_add":false},
   "execution":{"tag_prefix":"strategy","requires_approval":true}
  }
  ```
  Exact max=default makes fixed demo no param adjust except sl/tp. User wants调参数; can adjust SL/TP. `TEST_BUTTON` isn't automatic market signal but M0 stub; production engine doesn't allow arbitrary TEST_BUTTON. Need note M0 only, removed from production templates. Template not investment strategy. For M1 replace with K3-A real deterministic template. `min_ea 2.0.0` arbitrary design; current EA property version 1.00. Fine. Could avoid exact by placeholders `<min-ea>` but schema example needs valid. Use `2.0.0` as proposed protocol v2. Mark.
  Template schema K3-A absent; this is own minimal.

  Instance example uses `"magic": 104729` exact arbitrary design maybe no need, use 123456789. Could be current default? no. Use `<allocated-int>` string violates numeric but example JSON can use 123456789 labelled test. Fine.
  Times use `"2026-10-18T00:00:00Z"` fixed current date but not actual event; examples marked fictional. Better `"<iso8601>"` string, clear placeholders. IDs `"si_demo_01"`, account `12345678` from existing stub. Server `ICMarkets-Demo` from stub. Good.

  Signal payload includes HMAC maybe `"sig":"<hmac>"`.
  Telemetry field table minimal plus signature. Need no actual curve values.

  Billing entitlement example run_slots 1 (MVP design). Expires placeholder. `signature` Ed25519.
  "payment callback integration待确认" based ai gateway README says not connected; website Supabase given context but actual payment integration outside repo. State "官网支付事实来自01-CONTEXT；本仓库未见策略模板权益/支付回调实现，联调状态待确认."

  MVP assertions expected no exact `OrderSend` spy count in real MT5? For M0 fake EA, yes. For real MT5 check deal count. Table can use test level.
  Baseline `30/30` run with env unset. Current verify script default command fails in environment because env set; final include robust command only and maybe note if env absent can use documented command. Good.

  Need "可观测信号出了问题 UI看到什么" common failure table includes:
  template signature -> card "完整性校验失败", details hidden, run disabled.
  instance conflict -> "magic冲突/账户已变更", start disabled.
  execution rejected -> timeline stage, message.
  receipt reconcile -> amber "待核对", no retry.
  telemetry gap -> curve dotted/gap "数据缺失", no ranking.
  stop EA offline -> "停止未确认/等待 EA", review.
  billing expired -> "授权已到期，仅允许平仓/撤单", top banner.
  AI unavailable -> no AI summary, deterministic alerts remain.
  Need include per phase failure modes list, maybe table covers.

  "监控复查间隔" specify current numbers:
  - EA `InpPollMs=250` command pump timer, heartbeat 1s
  - bridge `POLL_MS=500` receipts
  - UI `refresh` 1500ms and AI 60000ms
  - heartbeat/status freshness 15000ms in bridge.
  These are exact source facts, allowed. Proposed reuse no new numbers, strategy health at 1500ms UI and EA lease each timer. Lease duration待确认. Good.

  D4 existing `licenseState` no periodic verify. Include.

  Potential legal/financial advice? It's software design for trading, allowed. No need disclaimer except "非投资建议" template.

  Let's now Write. Need large content maybe 60k. We'll create in one call if manageable.

• 方案已收敛为一条主线：模拟盘单实例先行，平台签名模板 + 主进程原生确认 + EA 确定性执行 + 订阅权益；公开绩效与盈利分润不作当前承诺。接下来写入完整文档并校验结构、行数和事实标注。

• File 47.9k bytes. Need verify content and structure, assertions count, JSON parse examples maybe some placeholders okay. Need check line count and heading list, at least25 assertions. Use Grep not shell for content counts? Grep count matches with pattern `^\| A[0-9]` on file. Use Grep count. Read file maybe not re-read solely prove write; but task depends exact output shape, inspect final external contract allowed. We can run scripts for markdown validation: count lines, JSON code blocks parse. Bash can run python read file? Dedicated Read for known file, but for validation processing Bash okay not cat/grep. We can use Python script to extract JSON blocks and json.loads, count headings, tags, D sections. This reads file via Bash but dedicated tools preferred for reading; using parser is legitimate. No new file. Also maybe `wc -l` allowed text processing, but dedicated Read gives total lines if read. Could use Bash `python3 - <<...` for parse. Need no `cat`. Use `Read` perhaps first and last sections? We wrote entire content so not need re-read except final contract. But to verify exact JSON, script appropriate. Also check answer-A existence maybe at final? Already two checks sufficient. Need maybe check [推断] all non-facts not automatable.

  Need identify issues in file:
  - A03 `M0` "旧 EA 能力" requires mock, okay.
  - M0 assertion list in milestone says A01-A17 includes A14-16 existing etc. A18 etc M1. A35 M0 in D3 but milestone M1 says A35; inconsistency: D3 A35 M0/M1 but M0 milestone list excludes A35, M1 includes "A35 到期..." fine M1 does both.
  - M0 step 1 says A01-A36中M0项, okay.
  - Security redline EA negative test with valid HMAC but no approved instance; v2 EA main secret? okay.
  - D2 template minimal `template` in envelope only `schema_version` and `rules`: not complete valid template (envelope example truncated but no ellipsis) could confuse. It is example with only two fields, but could be interpreted full. Could use `"template": { "schema_version": "...", "...": "..." }` invalid semantics but JSON valid. Better envelope use full minimal template? File already has full above; envelope can say `"template": { "schema_version": "...", "template_id": "...", "version": "...", "rules": [] }` still incomplete name etc not necessarily required envelope example. Fine.
  - JSON placeholders `"ttl_ms": "<bounded-ttl>"` type string not actual numeric; clearly test format placeholder, okay but payload examples should be realistic maybe better numeric 30000 from current default, but exact design not issue. `<execution-price>` string not number also placeholder. Clearly examples with placeholders.
  - "magic from positive nonzero 31-bit integers" exact design good.
  - AI data "客户 license id 绝不进入模型" okay.
  - Admin can configure entitlements but not subscribe, table maybe okay.
  - D5 "现阶段不建议 three" third combines AI direct and unverified leaderboard two things, user asked three things maybe okay but could be seen as 4. Better separate exactly three and move no收益榜 elsewhere. It currently third "不让 AI ...，也不发布..." is two. They said明确三件事, combined category could be acceptable but to be precise we should change third to only AI, and include unverified leaderboard in second or other sections. Second already public copy not leaderboard. Could make three: 1 profit share, 2 live auto/multi/public copy, 3 AI direct. Then unverified leaderboard covered elsewhere and milestone. Remove "也不发布无证据的收益榜" from third, add sentence after list? That would be fourth. We already elsewhere say no public unverified; no need repeat. Do Edit after Read required. Need read relevant part before Edit. Also "本季度不做按小时" appears D5 and D6, fine.
  - D3.2 step 5 says ticket not fixed no expected close, honest.
  - D2.7 existing main gate all sendCommand incl close yes.
  - Source `rebind` returns secret to renderer: true. Need perhaps mention this in final prominently.
  - current source `UI sendCommand` uses tag but protocol reads comment, yes.
  - current POSITION_CLOSE ticket dropped, test vectors confirms, critical.
  - `main` no current periodic license verify true.
  - `unknown v` old EA no explicit check true.

  Need maybe line count final not yet.

  Need file has 480 lines maybe Read total. Let's run validation and read D5 section for edit.lines 559
json_blocks 8 all_valid
assertions 36 unique 36 first_last A01 A36
D1 · True
D2 · True
D3 · True
D4 · True
D5 · True
D6 · True
Need Edit requires Read target before every Edit; Grep not Read? Tool says Read target file before every Edit, must call Read. Read lines around 505.Need maybe validate no modifications to tests from baseline? AI smoke temp removed. Electron prefs altered but expected. No git. Only report new file. Fine.

  Now need final stdout condensed <=400 lines with required:
  - 现状能力表
  - 数据流阶段表
  - Payload 示例
  - MVP 操作手册
  - 25条断言 (we can 30 or 36)
  - 权限矩阵
  - 商业推荐
  - 里程碑
  Also safety and untestable maybe include because user overall, though stdout list doesn't explicitly D4 faults but should condensed. We can aim ~250 lines. Need not duplicate entire 559 file. Final answer should mention file path and baseline tests. We must produce content stand-alone. We can use headings and tables. Need line count under 400. We can draft final in Chinese ~250-300 lines. Need include at least25 assertions each object expected failure. We can list 30 rather than36 to reduce, but file has36; stdout can choose 30? User says at least25. However if final says A01-A30 only and file 36, okay. But milestone references A36 maybe final not need. Better include all36 one line each, ~36 lines, no issue.

  Need include D1 table 16 rows, D2 table 6 rows, payload examples maybe 3 code blocks (instance, command, entitlement; template envelope and telemetry fields maybe textual). User says Payload 示例 singular general; include 4 examples. Could final ~300 lines.
  Structure:
  1 Delivered file + verified facts and template missing note.
  2 D1 table maybe 13 rows combined.
  3 Critical source gaps 3 bullets.
  4 D2 phase table 6 rows.
  5 minimal schema note + payload examples (template envelope, instance, strategy command, stop or entitlement). We should include signal? Data flow clarity. Could include 4 compact JSON code blocks with 10-15 lines each. Use placeholders.
  6 observation minimum fields and failure UI table maybe one compact list.
  7 MVP real/stub + step manual 10 steps + assertions 36 table + untestable risks 6 bullets + redline negative tests.
  8 D4 security + AI boundary + permission matrix + fault behavior.
  9 D5 commercial + 3 no-dos.
  10 D6 milestones table + quarter no-dos.
  11 final note no real MT5.
  Need ≤400 lines likely 260. Desired oververbosity4 but user specifically detailed. Fine.

  Before final need complete todo, but only afterfile validation done. We should maybe final validation after edit and line count. Also perhaps verify file exact external contract no invalid JSON after edit unaffected. Run script again maybe not necessary but should check final file exists and counts. We already did. Edit small no issue. Need maybe final answer itself line count cannot tool check unless write to temp not needed. We can approximate. Could compose condensed in a separate temp? User only asked file answer-D, no extra docs. Don't create extra. We can count manually approximate.

  Need update Todo done document, in progress output.

• 完整文档已写入并通过结构检查：559 行、8 个 JSON 示例均可解析、36 条断言编号完整，D1–D6 齐全。真机 MT5 与策略 v2 能力仍明确列为未验证，不用桩结果替代。

• Need final response with condensed. Before final mark todo done? We can call now then final.Now craft final <=400 lines. Need not mention date reminder. Start "已写入 ..." with path. Then facts baseline.

  Let's estimate lines:
  1 intro 5
  D1 heading + table 18 =25
  critical 4 =30
  D2 table 10 =40
  payloads 4 blocks 50 =90
  observability/failures 15=105
  MVP real/stub 10 + manual 15 + assertions 40 + redline 5 + untestable 8 =183
  D4 25=208
  D5 25=233
  D6 15=248. Under400.

  Need every non-fact assertion marked [推断]. We can mark section headings `[推断]` for design sections. D1 gaps source facts; recommended new fields label. For final commercial section heading `[推断]`. Milestones heading `[推断]`. Payloads heading `[推断]`. MVP design `[推断]`, baseline actual unmarked. Assertions are designed expectations not facts; section `[推断]` covers. Good.
  D1 "完全缺口" current source facts no [推断]. `需要新增` recommendations maybe in D1 table text with `[推断]` where appropriate or heading table "缺口（源码事实；需新增项属于[推断]）". Add note before table: "以下‘现有’为源码事实；‘需新增’为[推断]." That marks all.
  K3-A missing note factual.
  Baseline results actual.

  D1 table compressed:
  能力/IPC/实现/缺口:
  发现, install, rebind (include secret leak), snapshot, market, close, receipts, license, AI, version/openExternal, other commands/halt, strategy/performance.
  At least required external open separately maybe combine version/external but user says cover each; same row can show both? Better separate 14 rows.
  AI status/connection/recharge one row.
  "终端发现 etc" all covered.
  D1 no current exact line refs maybe include major ones in critical bullets, table no line refs okay since file has refs. But user wants based source, final could cite paths. Include `src/main.js:214-231` etc in implementation cells? Keep concise.
  Mention preload method names.

  D2 stage table with existing/new IPC.
  Payload examples include template envelope minimal; instance; command; entitlement. Need stop maybe not necessary. "每一阶段 Payload示例" user requested each phase in file; file has stage1,2,3,4 fields but no JSON specifically phase4?It has no JSON telemetry example, only table; stage5 stop JSON, stage6 entitlement. File satisfies mostly. Stdout can include selected 4. They asked stdout Payload示例 not each phase, fine.

  Failure modes per phase in file, final include one compact line per stage in D2 table maybe "失败/UI" column. Add.
  Observation minimum fields in final one bullet with field lists.

  MVP operation manual:
  Baseline 3 commands and expected (tested).
  M0 after minimal new harness: `tools/verify-ecosystem.js` not exists; mark target not run. Could user see this as not "use existing code"? We need explain "现有代码可直接跑的只有基线；策略闭环必须新增最小 test harness/state machine，本方案不伪称今天可跑". This is honest but maybe they expected plan. Use wording "最小新增仍复用现有 main/preload/bridge/protocol/EA，只有模板内容和 MT5 用桩". Good.
  Click paths 6 steps.

  Assertions table 36 rows may be big but required. Each has object/expected/fail. Can reuse exact from file shortened. Need at least25. We'll include 30 maybe all36 for consistency. Each row one line. The final answer line count okay.

  Safety redline explicit negative A08/A09/A10 + EA valid HMAC no approval. A08 etc.
  Untestable risks list 6.

  D4 permission matrix 4 roles ×6. AI data boundary concise. Fault behavior 3 bullets.

  D5 recommendation and reasons/costs/trust/account tree/no-dos.
  D6 milestone table with dependencies/assertions/debt, time.

  Need not include every file detail in final since file full. But final must stand alone per developer and user explicit. We'll produce ~300 lines.

  Let's now formulate final in Chinese with Markdown. Ensure no emoji (user none; avoid checkmark emojis). Use inline code.

  Potential issue final "36条断言" file and list 36. Good.

  Let's draft meticulously.

• 已写入完整方案：

  `research/2026-10-18/answer-D-ecosystem.md`

  文档共 559 行，包含 D1–D6、8 个可解析 JSON 示例、36 条自动化断言。`answer-A-templates.json` 当前不存在，因此按任务要求采用了最小临时模板 schema，并明确保留向 K3-A 正式 schema 迁移的要求。

  本次实际验证结果：

  - 真 Electron UI：30/30 通过。
  - EA v1 验签仿真：10/10 通过。
  - AI 网关 mock 冒烟：15/15 通过。
  - 未进行真 MT5 联调，不能宣称策略执行链已经生产可用。

  ## D1 · 现状能力表

  以下“现有能力/缺口”为源码事实；“需要新增”属于 **[推断]**。

  | 能力 | IPC / 方法 | 实现方 | 当前缺口 |
  |---|---|---|---|
  | 终端发现 | `nn.discover()` → `bridge:discover` | main 白名单、bridge 扫描、EA heart | 无账户绑定注册表、EA build/features 上报 |
  | EA 安装 | `nn.installEA()` | bridge 复制 EA、写 secret；用户挂载 | 无版本协商、模板兼容性检查、自动重启 |
  | 重绑/epoch | `nn.rebind()` | bridge 换密钥并增 epoch，main 持久化 | 无策略审批撤销/实例迁移；rebind 返回值还会把 secret 传到渲染层，必须修复 |
  | snapshot | `nn.snapshot()` | bridge 读文件，EA 写 heart/status | 只有当前状态；无历史成交、净值时序、K 线、实例状态；持仓未输出 magic |
  | 市价单 | `sendCommand(ORDER_MARKET)` | main 初检、bridge 签名、EA 执行 | 需新增并签名 `magic/instance_id/signal_id/tag/origin/params_hash`；当前只用固定 `InpMagic` |
  | 平仓 | `sendCommand(POSITION_CLOSE)` | main/bridge/EA | EA 有实现，但 `protocol.js` 会丢掉 `ticket`，当前不能宣称平仓链已联调 |
  | 回执 | `commandStatus()`、`onEvent()` | bridge 内存状态机、EA 回执 | 无重启恢复、实例/成交归因；回执未签名，不能直接用于结算 |
  | 授权 | `licenseStatus/licenseActivate` | main + 离线 Ed25519 | 无模板权益、运行位、在线撤销；未见运行中定时重验到期 |
  | AI 状态/连接/充值 | `aiStatus/aiConnect/aiDisconnect/openExternal` | main + AI 网关 | 无 chat IPC、只读交易工具、脱敏上下文；UI 明示 AI 分析未开放 |
  | AI 积分 | `/v1/chat`、`/v1/credits` | AI 网关 | 有预扣/结算/退款；真实支付回调和 Function Calling 未完成 |
  | 版本 | `nn.version()` | Electron main | 只有 app 版本，无 EA/协议/模板版本协商 |
  | 外部打开 | `nn.openExternal()` | main + shell | 仅限制 HTTPS，无域名白名单 |
  | 其他命令 | pending/cancel/modify 等 | main 白名单 | EA 实际只实现 market/close/sync，其余会拒绝 |
  | 一键停用 | `haltBtn` | 仅渲染层 | 不是 main/EA 安全闸门，不能用于策略紧急停止 |
  | 策略与绩效 | 无 | 无 | 无模板、实例、magic 分配、策略引擎、净值时序、成交归因和公开绩效证据链 |

  三个关键源码结论：

  1. `src/bridge/protocol.js:86-94` 固定序列化字段，导致 `ticket` 丢失；UI 的 `tag` 也与协议/EA 的 `comment` 不一致。
  2. v1 HMAC 没覆盖 magic、instance、ticket、tag、TTL、滑点等字段，不能只加 payload 字段就上线。
  3. 旧 EA 没有能力握手；新主进程必须对未声明 v2 能力的 EA 禁发策略命令。

  ## D2 · [推断] 数据流阶段表

  | 阶段 | 数据流 | 复用 / 新增 | 失败时 UI |
  |---|---|---|---|
  | 模板下发 | M0 本地测试签名模板；生产平台服务 → main 验 schema/hash/Ed25519 → EA 策略包 | 新增 `templateList/templateGet`、`STRATEGY_INSTALL` | 显示签名/版本/兼容性原因，不可运行 |
  | 实例化 | 选模板、调参数、绑定 snapshot → instance_id、magic、params_hash、权益、审批 | 复用 `discover/snapshot/licenseStatus`；新增 `strategyCreate/Approve/Start` | magic 冲突、账户变化、运行位不足均阻止启动 |
  | 执行 | EA 算信号和手数/止损 → signal → main 校验 → v2 命令 → EA 再验 → 回执 | 内部复用 `sendCommand/commandStatus/bridge:event` | 时间线显示停在哪一跳；未知结果进入 RECONCILING |
  | 观测 | EA equity/deal/run 事件 → 本地落盘 → 授权后脱敏上传 | 新增 `strategyEquity/Deals/Events` | 缺序号、对账不符则标数据缺口，不排名 |
  | 监控停止 | heart/status/receipt/租约 → 暂停/停止/人工核对 | 新增 main+EA 双层停止和 run lease | EA 离线显示“停止未确认”；持仓默认保留 |
  | 计费 | 支付订单 → 平台 entitlement → 客户端签名缓存；AI 继续扣积分 | 复用授权、AI 状态、充值；新增 `entitlementStatus` | 到期禁止新开仓，但保留平仓/撤单/同步 |

  ### 模板与实例 Payload

  ```json
  {
    "envelope_version": "nn.template-envelope/1",
    "template_id": "tpl_fixed_signal_demo",
    "version": "1.0.0",
    "template": {
      "schema_version": "nn.strategy-template/1",
      "rules": []
    },
    "sha256": "<canonical-template-sha256>",
    "signature": "<platform-ed25519-signature>"
  }
  ```

  ```json
  {
    "schema_version": "nn.strategy-instance/1",
    "instance_id": "si_demo_01",
    "template": {
      "template_id": "tpl_fixed_signal_demo",
      "version": "1.0.0",
      "sha256": "<template-hash>"
    },
    "binding": {
      "terminal_id": "A1B2C3D4E5F6G7H8",
      "account": "12345678",
      "account_server": "ICMarkets-Demo",
      "symbol": "EURUSD",
      "timeframe": "M15",
      "account_mode": "demo",
      "epoch": 1
    },
    "magic": 123456789,
    "params": {
      "volume_lots": 0.01,
      "sl_points": 250,
      "tp_points": 500
    },
    "params_hash": "<params-sha256>",
    "state": "DRAFT"
  }
  ```

  ### 策略命令 Payload

  ```json
  {
    "v": 2,
    "id": "cmd_demo_01",
    "type": "ORDER_MARKET",
    "origin": "STRATEGY",
    "account": "12345678",
    "account_server": "ICMarkets-Demo",
    "session_epoch": 1,
    "issued_at_ms": "<main-time-ms>",
    "ttl_ms": "<bounded-ttl>",
    "payload": {
      "instance_id": "si_demo_01",
      "signal_id": "sig_demo_01",
      "magic": 123456789,
      "params_hash": "<params-hash>",
      "symbol": "EURUSD",
      "side": "BUY",
      "volume_lots": 0.01,
      "sl_points": 250,
      "tp_points": 500,
      "max_deviation_points": 30,
      "tag": "strategy:si_demo_01"
    },
    "sig": "<hmac-over-all-execution-fields>"
  }
  ```

  ### 权益 Payload

  ```json
  {
    "schema_version": "nn.entitlement/1",
    "entitlement_id": "ent_demo_01",
    "user_id": "u_demo",
    "license_id": "NN1-TEST",
    "scope": {
      "template_ids": ["tpl_fixed_signal_demo"],
      "run_slots": 1,
      "account_modes": ["demo"]
    },
    "expires_at": "<iso8601>",
    "revocation_generation": "<server-generation>",
    "signature": "<platform-ed25519-signature>"
  }
  ```

  ### magic 分配决策

  - 由 main 使用 `crypto` 分配，AI、创作者、渲染层不能指定。
  - 作用域为 `(account_server, account)`；先查持久注册表，再由 EA 查当前持仓、挂单和可获取历史。
  - 先落 `RESERVED` 再启动；冲突就换值或拒绝，不能静默复用。
  - 停止后释放运行位和活动账户占用，但 magic 转为 `RETIRED`，MVP 不复用。
  - MVP 每账户只允许一个 RUNNING 策略实例，只做模拟盘。
  - 多桌面共用账户仍有残余冲突风险；发现冲突必须进入 `REVIEW_REQUIRED`。

  ### 可信绩效最小字段

  - 净值：`event_id/ts_utc/account_key/instance_id/magic/balance/equity/open_pnl/currency/epoch/source_seq/cashflow_delta`。
  - 成交：`deal/order/position/command/signal/instance/magic/account/server/symbol/side/entry_in_out/volume/price/commission/swap/profit/deal_time`。
  - 运行：模板与参数 hash、绑定 hash、状态、审批、起止时间、app/EA/协议版本。
  - 来源：事件序号、接收时间、HMAC、schema 版本。
  - 回测、模拟、实盘/forward 分段展示；缺样不插值，出入金不当收益，stub 不上传、不排名、不结算。

  ## D3 · [推断] 最小可测 MVP

  ### 真实现与桩

  - 真：Electron UI/preload、实例状态机与注册表、签名校验、main 审批、协议校验、AI 计费。
  - 桩：M0 模板内容、终端/行情、固定 signal、fake EA/OrderSend、entitlement、AI 解释。
  - M1 才替换为真 Windows MT5 模拟账户、v2 EA、真实成交/净值。
  - 所有 stub 事件必须带 `source=STUB`，不得进入公开绩效。

  ### 操作手册

  今天可复现的基线：

  1. `env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tools/verify-main.js`  
     预期 30 项全 PASS。
  2. `python3 test/ea_sim.py test/vectors.json`  
     预期 `10 PASS / 0 FAIL`。
  3. `cd ai-gateway && node test/smoke.js`  
     预期 15 项全通过。
  4. 真 MT5 可选段：Windows 启动客户端 → 激活自己的授权 →“终端与 EA”→ 选模拟终端 → 安装并挂载 EA → 保持 `InpDemoOnly=true`。
  5. 当前“交易”页只能验证人工交易链；在 ticket 修复前，不把平仓列为已验证能力。

  M0 最小新增后的生态验收：

  1. 运行 `tools/verify-ecosystem.js --mock-ea`，使用临时 userData 和 fake EA。
  2. “策略广场 → 固定信号演示”：只看到版本、测试签名、模拟盘限制，无收益宣传。
  3. 调参数并创建实例：得到 DRAFT、instance_id、绑定快照、params_hash、magic；重载后仍存在。
  4. 未确认或取消原生确认框：`sendCommand=0`、inbox 新文件为 0、OrderSend=0。
  5. 确认账户、品种、手数、止损和模板 hash：进入 RUNNING，占用一个运行位。
  6. 触发测试 signal：同一 signal_id 只产生一条命令，可跟踪回执。
  7. 停止：不再产生新命令，已有持仓保留；另一次确认才能平本策略持仓。
  8. 模拟回执丢失、bridge 重启、rebind：分别进入待核对/人核/旧命令失效，不自动重放。
  9. M1 用同一手册跑真 MT5，全部真机项通过后才能进入客户试用。

  ### 36 条自动化断言

  | ID | 断言对象 | 期望值 | 失败代表什么 |
  |---|---|---|---|
  | A01 | 合法签名模板 | 可创建 DRAFT | 正常发布链断裂 |
  | A02 | 模板被篡改 | 拒绝且不能启动 | 完整性闸门失效 |
  | A03 | 未知 schema/旧 EA | INCOMPATIBLE，不写包 | 版本兼容失效 |
  | A04 | 参数越界/缺字段/额外字段 | 创建失败，不占运行位 | 参数校验失效 |
  | A05 | 实例重载 | id/绑定/hash/magic 完全恢复 | 持久化失效 |
  | A06 | 活动 magic 冲突 | 重分配或拒绝 | 订单可能串归属 |
  | A07 | magic 非法值 | main 与 EA 均拒绝 | magic 值域失效 |
  | A08 | 未确认直接启动 | 无命令、无 inbox、无 OrderSend | 用户确认红线被绕过 |
  | A09 | 取消确认框 | 不运行、不下单 | 取消被误当同意 |
  | A10 | AI 要求立即买入 | 无审批、无 signal、无订单 | AI 越权交易 |
  | A11 | 审批后修改参数/绑定/magic | hash 不符并拒绝 | 审批对象被调包 |
  | A12 | 过期/撤销/重放 approval | 全部拒绝 | 审批时效或防重放失效 |
  | A13 | 无权益/运行位满 | 可浏览但不能运行 | 计费权益可绕过 |
  | A14 | 未授权交易 IPC | main 拒绝 | fail-closed 回归 |
  | A15 | 非法 terminalPath | main 拒绝 | 路径白名单回归 |
  | A16 | 非法手数/命令类型 | main 拒绝 | 现有参数白名单回归 |
  | A17 | 缺 magic/instance/signal/tag | main 与 EA 拒绝 | 归因字段可缺失 |
  | A18 | 签名后改 magic/ticket/ttl/tag | EA 拒绝并隔离 | 仍存在未签名字段 |
  | A19 | 向 legacy EA 发 v2 | 写 inbox 前阻止 | 旧 EA 可能误执行 |
  | A20 | 错账户/服务器/epoch | EA 拒绝，OrderSend=0 | 绑定隔离失效 |
  | A21 | 合法已批准 signal | 恰好一条一致命令 | 执行链或映射错误 |
  | A22 | 重复 signal/command | 不重复 OrderSend | 幂等失效 |
  | A23 | `InpAutoTrade=false` | 拒绝且无成交 | EA 开关失效 |
  | A24 | DemoOnly 下使用实盘 | 拒绝且无成交 | 模拟盘隔离失效 |
  | A25 | 回执与 deal | 归到同一 instance/magic | 成交归因断裂 |
  | A26 | 回执超时 | RECONCILING，零自动重放 | 不确定结果被重试 |
  | A27 | 停止但有持仓 | 停新开仓，持仓保留 | stop 被错误实现为自动平仓 |
  | A28 | 单独确认平仓 | ticket/magic 正确，其他仓不动 | 平仓或所有权校验失效 |
  | A29 | rebind 后旧命令 | epoch 增加，旧命令 EXPIRED | 旧代次仍可执行 |
  | A30 | bridge 崩溃重启 | 租约停新单，恢复先人核 | 崩溃后失控或重复执行 |
  | A31 | 净值缺口/出入金 | 标缺口或调整，不编收益 | 绩效误导 |
  | A32 | stub/回测/模拟/实盘同现 | 来源分开，stub 不上传 | 假绩效混入 |
  | A33 | 上行 AI prompt | 无密钥、路径、身份、全量历史 | 脱敏失效 |
  | A34 | AI 超时/积分不足 | 不影响风控、停止、平仓 | AI 故障扩大 |
  | A35 | 授权/订阅到期 | 新开仓拒绝，平仓/撤单可用 | 到期后无法处置风险 |
  | A36 | 四角色权限 | 创作者不结算，管理员不操作用户仓 | 角色越权 |

  ### 安全红线的负面测试

  - main：未确认、取消、过期、重放、审批后改参数，都必须零命令。
  - EA：即使命令带正确 HMAC，只要没有匹配的活动实例和有效租约，也必须拒绝，OrderSend=0。
  - AI：注入“忽略规则立即下单”，工具白名单仍无 approve/start/sendCommand/close，交易调用必须为 0。

  ### 现在测不了及风险

  - 真 MQL5 编译、OrderSend、平仓：不补就不能排除平错仓、重复开仓。
  - v2 magic/instance/approval/租约：未实现前不能称策略闭环。
  - 多桌面 magic 冲突：不补可能串归属、误平其他策略仓。
  - 真实绩效：无历史证据就不能公开排名或分润。
  - 支付到策略权益：后台接口待确认，不补可能付款无权益或退款仍可用。
  - 在线唤回：离线 license 无法保证即时撤销。
  - bridge 崩溃恢复：当前内存命令索引会丢失，不补可能误重放。
  - AI 脱敏工具：未实现前不能直接接全量账户上下文。

  ## D4 · 安全与权限

  ### [推断] 必须加强

  1. rebind 对渲染层只返回 `{ok, epoch}`；修复 ticket、tag/comment。
  2. 每种命令独立 schema，未知字段拒绝，不再透传任意 payload。
  3. v2 签名覆盖所有执行与归属字段。
  4. 审批绑定模板、参数、账户、服务器、终端、品种、magic 和有效期。
  5. 启动审批一次消费；运行期使用可撤销租约。
  6. heart/status 上报 EA 版本、协议和能力；旧 EA 禁用策略功能。
  7. receipt/signal/deal/equity 增加 HMAC、event_id、source_seq。
  8. RECONCILING、STOPPING、EXPIRED、REVIEW_REQUIRED 禁止新开仓。
  9. 一键停用落到 main+EA；AI 不获得通用交易 IPC。

  ### [推断] AI 数据边界

  - 可见：公开模板说明、风险标签、审核后的聚合指标，以及用户主动选择的脱敏实例摘要。
  - 默认不可见：完整成交历史。
  - 绝不进入模型：bridge secret、私钥、AI token、license key、客户身份、精确账户标识、terminalPath、支付/管理员密钥。
  - AI 只解释或生成草案；手数、止损、审批、启动、停止和平仓均不交给模型。

  ### [推断] 权限矩阵

  | 角色 | 看 | 订阅 | 运行 | 发布 | 改价 | 结算 |
  |---|---|---|---|---|---|---|
  | 未授权用户 | 公开模板与审核绩效 | 否 | 否 | 否 | 否 | 否 |
  | 已授权用户 | 自己的实例、账单、事件 | 可以 | 自己的授权实例 | 否 | 否 | 只能看本人账单 |
  | 策略创作者 | 继承用户权限及自己的模板数据 | 可以 | 不获得他人账户权限 | 提交审核 | 提交变更，审核生效 | 查看/申请，不执行 |
  | 平台管理员 | 审计所需最小数据 | 代配权益须审计 | 不能操作用户账户 | 审核/上下架/撤销 | 复核后调整 | 复核后执行订阅收入结算 |

  ### 故障行为

  - 到期/唤回：停止新开仓和新实例，允许同步、撤单、平仓；有敞口则要求人核，不自动平仓。
  - 老 EA：禁装禁跑并提示升级；运行中失联由租约停新单。
  - bridge 崩溃：EA 租约到期停新单；重启先对账，恢复必须经过 `REVIEW_REQUIRED`。

  ## D5 · [推断] 商业模式推荐

  **采用“平台订阅 + 模板订阅/运行位 + AI 积分”，盈利分润和按小时计费均推后。**

  理由：

  - 与现有授权、官网订阅/分销、AI 积分最相容。
  - 收入依据真实支付订单，不依赖客户机器上报的盈亏。
  - 客户资金留在自己的 MT5，平台只收软件与模板使用费。
  - 购买前统一展示模板周期、运行位、AI 积分是否另计。
  - 创作者以后可分配模板订阅实收收入，而不是策略盈利。

  先用订阅制的代价：

  - 创作者与盈利的利益绑定较弱。
  - 多层收费可能引发反感，需要统一账单和计费预览。
  - 平台必须依靠可验证记录和模板质量，而非收益承诺。

  若未来做盈利分润：

  - 只算已平仓、扣除费用后的已实现净盈利；排除出入金，记录高水位和亏损结转。
  - 回执、HistoryDeals、净值时序三方对账；只认单次撮合回执不够。
  - EA 签名可防传输篡改和重放，但不能防止用户修改自己机器上的客户端。
  - 数据缺口、magic 冲突、回执与历史不符时冻结结算；高金额需要券商独立证据或人工审核，具体 MT5 接口待确认。

  账号体系统一：

  - 只有一个 `user_id`；创作者、订阅、AI 余额、订单、推荐关系都挂在同一账户。
  - 每个节点只有一个 `referrer_user_id`，创作者是该节点角色。
  - 同一订单记录 buyer/creator/referrer/payment_order；创作者收入与推荐佣金是不同账本条目。
  - 禁止自推荐和环；退款按原订单冲正，层级与比例待确认。

  现阶段不建议做的三件事：

  1. 基于客户端上报盈亏的自动盈利分润。
  2. 实盘自动策略、多策略同账户和公开跟单扩量。
  3. AI 直接下单、审批或计算手数/止损。

  ## D6 · [推断] 里程碑

  | 里程碑 | 时间 | 工作与依赖 | 新增断言 | 跳过的债 |
  |---|---|---|---|---|
  | M0 可演示 | 第 1–2 周 | 本地签名模板、实例/magic、原生审批、fake EA；依赖 A 的模板、B 的确认卡、C 的 Review/AI 边界 | M0 项及现有 UI 回归 | 假闭环、无持久化、协议返工 |
  | M1 内部可测 | 第 3–6 周 | 协议 v2、真 MT5 demo、EA 租约、成交/净值、崩溃恢复；依赖 A 的 EA DSL、B 的异常 UI、C 的脱敏事件 | 真机、签名、平仓、重绑、crash、到期项 | 平仓错误、重复订单、失控运行、magic 串线 |
  | M2 小范围试用 | 第 7–10 周 | 平台模板服务、统一用户、真实权益、支付/退款、撤销、授权 telemetry；仍限模拟盘 | 支付幂等、权益隔离、角色、脱敏、断网恢复 | 付款无权益、退款仍可用、客户问题不可查 |
  | M3 公开上线 | 第 11–13 周 | 审核目录、升级回滚、运营 SOP、证据充分的绩效、订阅收入结算 | 回滚、旧 EA 拒新、对账、长时运行 | 绩效误导、版本碎片、退款与安全风险 |

  本季度只推这一条主线；DIY 看板完整扩建、创作者完全自助上架、公开收益榜、实盘自动策略和盈利分润均不并行推进。

To resume this session: kimi -r session_587c47a7-b3e6-498f-8f5a-6a1ea943d193
