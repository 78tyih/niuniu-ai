# K3-D · 牛牛AI 生态打通方案：可执行、可观测、可测试

> 日期：2026-10-18  
> 标注规则：带源码路径的内容是本次直接核对的事实；引用 `00-FACTS.md` / `01-CONTEXT.md` 的内容标为“事实底座”。所有新产品设计、默认值、排期与风险判断均标为 **[推断]**；不能从仓库确认的写 **待确认**。示例 JSON 全是 **[推断] 测试格式/桩数据**，不是生产配置、真实绩效或投资建议。

## 0. 输入、模板前提与实测基线

- 已读 `00-FACTS.md`、`01-CONTEXT.md`、`src/main.js`、`src/preload.js`、`src/ui/app.js`、`src/ui/index.html`、`tools/verify-main.js`，并补读 `src/bridge/index.js`、`src/bridge/protocol.js`、`ea/NiuNiuBridge.mq5`、`src/license.js`、协议测试与 AI 网关。
- `answer-A-templates.json` 两次检查均不存在，所以按任务要求采用本文的**最小临时 schema**。它不声明与 K3-A 最终 schema 兼容；文件出现后，应以 K3-A 为准并做一次版本迁移。`answer-K3-A/B/C.md` 当前是过程记录，不作为正式 schema 或已完成能力。
- **[推断] 总决策**：本季度只做“签名模板 → 模拟盘单实例 → 用户原生确认 → EA 确定性信号与风控 → 主进程命令校验 → 可归因回执/成交 → AI 只读解释 → 订阅权益与 AI 积分”一条主线。盈利分润、实盘自动策略、多策略同账户、公开创作者自助入驻不同时推进。

本次实际执行基线：

| 命令 | 本次结果 | 能证明 / 不能证明 |
|---|---|---|
| `env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tools/verify-main.js` | 30/30 通过 | 证明真 Electron + 真 preload/app.js + 桩 IPC 的 UI 回归；不证明真主进程交易闸门、真 MT5 成交 |
| `python3 test/ea_sim.py test/vectors.json` | 10/10 通过 | 证明既有 JS 与 EA 复刻的 v1 验签向量一致；不证明 MQL5 编译、券商执行 |
| `cd ai-gateway && node test/smoke.js` | 15/15 通过 | 证明 mock 上游下鉴权、预扣、结算、退款等；不证明真实支付或真实模型 |

环境中 `ELECTRON_RUN_AS_NODE=1` 会让原校验命令把 Electron 当 Node 运行；取消该环境变量后，同一脚本 30/30 通过。没有在本机做真 MT5 测试。

---

## D1 · 现状能力盘点（源码事实）

| 能力 | 渲染层 / IPC 方法 | 谁实现 | 当前事实与缺口 |
|---|---|---|---|
| 终端发现 | `nn.discover()` → `bridge:discover` | main 白名单；bridge 扫描；EA 写 heart | `src/bridge/index.js:60-101` 扫 Windows MetaQuotes 目录，以 heart 新鲜度判断在线。没有账户级绑定注册表、EA build/features 上报。 |
| EA 安装 | `nn.installEA(path)` → `bridge:installEA` | main → bridge 复制 `.ex5/.mq5`、写 `secret.json`；用户挂载 EA | `src/bridge/index.js:103-138`。没有模板/EA 版本协商、包签名校验、自动编译或自动重启；UI 已提示手工挂载。 |
| 重绑 / epoch | `nn.rebind(path)` → `bridge:rebind` | main 持久化；bridge 换密钥并递增 epoch；EA 比对 | `src/main.js:219-224`、`src/bridge/index.js:140-153`。没有策略实例迁移、审批撤销、运行租约。**另有一处必须修的泄密缺口**：bridge 把 `secret` 放进 rebind 返回值（`src/bridge/index.js:251-254`），main 又将整个返回值交给渲染层，和 preload 的“密钥不进入渲染进程”意图不一致。 |
| 快照 snapshot | `nn.snapshot(path)` → `bridge:snapshot` | bridge 读 heart/status；EA 定时写 | `src/bridge/index.js:200-212`、`ea/NiuNiuBridge.mq5:388-461`。有账户、当前图表报价、持仓、挂单；没有历史成交、净值时序、K 线、多品种报价、实例状态。持仓/挂单快照未输出 magic；`statusAgeMs` 没有实际年龄计算。 |
| 下市价单 | `nn.sendCommand()` → `bridge:sendCommand`，`ORDER_MARKET` | main 初检；bridge 构造/HMAC；EA 预检并 `OrderSend` | `src/main.js:236-262`、`ea/NiuNiuBridge.mq5:496-562`。**[推断] 必须新增并签名** `magic/instance_id/signal_id/tag/origin/params_hash`；当前 EA 只用固定 `InpMagic`，不能按实例归属。 |
| 平仓 | 同上，`POSITION_CLOSE` | app/main/bridge/EA | EA 有平仓与 magic 所有权检查（`ea/NiuNiuBridge.mq5:564-623`）；但 `protocol.buildCommand` 固定 payload 不含 `ticket`（`src/bridge/protocol.js:73-95`），所以当前平仓链不能把 UI 的 ticket 序列化给 EA。不能把该链写成已联调通过。 |
| 回执查询 / 推送 | `nn.commandStatus(id)`、`nn.onEvent()` | bridge 内存状态机 + 轮询；EA 写回执 | `src/bridge/index.js:171-197,275-277`。有 SENT/ACCEPTED/EXECUTED/REJECTED/EXPIRED/RECONCILING；没有持久化命令索引、instance/deal 归因。回执文件当前无 HMAC，bridge 也未验证内容来源，不能直接作为结算证据。 |
| 授权状态 / 激活 | `nn.licenseStatus()`、`nn.licenseActivate()` | main + `license.js` 离线 Ed25519 | 未激活时 main 拒绝所有 `sendCommand` 类型；授权含到期日/席位数。没有模板权益、运行位、在线撤销；`licenseState` 未见运行中定时重新 `verify`，长时间不重启时的到期行为需要补。 |
| AI 状态 / 连接 / 充值 | `nn.aiStatus/aiConnect/aiDisconnect`；充值走 `openExternal` | main + AI 网关 | 有 token、余额轮询、充值 URL；`src/preload.js` 没有 chat IPC，UI 明示 AI 分析未开放。没有只读交易工具、脱敏上下文或 AI 审批边界。 |
| AI 积分计费 | 网关 `/v1/chat`、`/v1/credits` | `ai-gateway` | 有预扣/结算/失败退款/流水；README 明示 Supabase 真实用户体系、ZPay/Stripe 回调自动充值、Function Calling 尚未做。策略订阅权益不在其中。 |
| 版本 | `nn.version()` → `app:version` | Electron main | 只返回 app 版本。没有 EA 版本、协议版本集合、模板 schema 版本和能力协商。 |
| 外部打开 | `nn.openExternal(url)` → `app:openExternal` | main + shell | 只允许 `https://`（`src/main.js:278-283`）；没有域名白名单。**[推断]** AI/支付/模板链接应再限制到已配置域名。 |
| 其他命令类型 | `ORDER_PENDING/CANCEL/MODIFY`、`POSITION_MODIFY` | main 白名单；EA | main 虽允许这些类型，但 EA 分派只实现 `ORDER_MARKET/POSITION_CLOSE/SYNC_STATE`，其余会 REJECTED（`ea/NiuNiuBridge.mq5:784-802`）。不能当作已有能力。 |
| 一键停用 | 顶部 `haltBtn` | 仅渲染层 `state.halted` | `src/ui/app.js:378-385` 只禁用 UI 动作，不是 main/EA 闸门，也不持久化；不能作为策略紧急停止的安全机制。 |
| 策略模板 / 实例 / 绩效 | 无 | 无 | 策略广场是占位页；没有模板签名校验、实例持久化、magic 分配、策略运行时、净值时序、历史成交拉取、公开绩效证据链。 |

### D1.1 不能靠“给 payload 加字段”解决的三个协议问题

1. `src/bridge/protocol.js:86-94` 只序列化固定字段：`ticket` 被丢弃；UI 传的是 `tag`（`src/ui/app.js:303-311`），协议与 EA 读的是 `comment`，所以 tag 也不会按预期到 EA。
2. v1 canonical 只签 10 段（`src/bridge/protocol.js:48-62`），不覆盖 magic、instance、ticket、tag、issued_at、ttl、max_deviation 等；其中部分字段甚至未进入命令。
3. 旧 EA 没有版本/能力握手，也未显式拒绝未知 `v`。因此 **[推断]** 新主进程必须对未报告 v2 能力的 EA 禁发策略命令；协议 v2 则要让 EA 对未知版本、未知字段、缺失字段 fail-closed。

---

## D2 · [推断] 端到端数据流

### D2.0 临时最小模板 schema（因 K3-A JSON 缺失）

仅用于 M0 的“固定信号演示”，不是投资策略；生产模板必须换成 K3-A 正式 schema。

```json
{
  "schema_version": "nn.strategy-template/1",
  "template_id": "tpl_fixed_signal_demo",
  "version": "1.0.0",
  "name": "固定信号演示（仅测试）",
  "engine": { "type": "EA_RULE_V1", "min_ea": "2.0.0", "protocol": 2 },
  "binding": {
    "symbols": ["EURUSD"],
    "timeframes": ["M15"],
    "account_modes": ["demo"]
  },
  "parameters": {
    "volume_lots": { "type": "number", "default": 0.01, "min": 0.01, "max": 0.01 },
    "sl_points": { "type": "integer", "default": 250, "min": 0 },
    "tp_points": { "type": "integer", "default": 500, "min": 0 }
  },
  "rules": [
    {
      "on": "TEST_SIGNAL",
      "when": { "event": "BUY_TEST" },
      "do": { "command": "ORDER_MARKET", "side": "BUY" }
    }
  ],
  "risk": { "max_open_positions": 1, "allow_add": false },
  "execution": { "requires_approval": true, "tag_prefix": "strategy" }
}
```

`TEST_SIGNAL` 只允许测试签名域与模拟盘；生产模板目录不得包含它。K3-A 文件到达后，至少映射 `template_id/version/parameters/rules/risk/execution` 并保留兼容迁移记录。

### D2.1 六阶段总表

| 阶段 | 数据与路径 | 复用已有 IPC | 必须新增 |
|---|---|---|---|
| 1 模板下发 | M0 本地签名 fixture；生产由平台模板服务下发，main 验 schema/hash/Ed25519 后缓存；再组成 EA 策略包 | 无可复用的模板 IPC；外部付款页仍可用 `openExternal` | `templateList/templateGet`；模板签名公钥；`STRATEGY_INSTALL`；EA 规则引擎与 `ea_version/protocols/features` 上报 |
| 2 实例化 | 参数快照 + 绑定 snapshot + instance_id + magic + entitlement + 审批计划哈希 | `discover`、`snapshot`、`licenseStatus` | `strategyCreate/strategyApprove/strategyStart`；原子实例注册表；magic 分配器；main 原生确认框 |
| 3 执行 | EA 算信号和手数/止损 → 签名 signal 事件 → main 校验 → v2 `ORDER_MARKET` → EA 再校验/执行 → 回执 | 内部复用 `call('sendCommand')`、`commandStatus`、`bridge:event`；不让 AI 调通用 `sendCommand` | signal 事件；v2 payload 全量签名字段；实例审批/租约检查；成交归因 |
| 4 观测 | EA 产生 equity/deal/run 事件 → bridge/main 落盘 → 用户同意后脱敏上传 | `snapshot` 只补最新点，不能替代历史 | `strategyEquity/strategyDeals/strategyEvents`；历史采集、缺口检测、数据来源标记 |
| 5 监控停止 | heart/status/receipt/run lease → 状态机；停止新开仓，持仓默认保留 | `snapshot`、`commandStatus`、`onEvent`、`rebind` | `strategyPause/strategyStop/strategyClosePosition`；main+EA 双层停止；死开关租约；人工核对态 |
| 6 计费 | 官网订单 → 平台权益 → 客户端签名权益缓存；AI 调用继续扣积分 | `licenseStatus`、`aiStatus/aiConnect/aiDisconnect`、`openExternal` | `entitlementStatus`；模板范围/运行位/到期/撤销代次；支付回调与订单对账，实际接口待确认 |

### D2.2 阶段 1：模板下发

**[推断] 来源决策**：M0 用本地签名 fixture；M2 起以平台服务为权威源，客户端只缓存已验证版本。两种来源走同一 envelope 和验证逻辑，避免演示与生产两套语义。模板公钥与授权公钥分离，测试公钥不得进入生产信任库。

```json
{
  "envelope_version": "nn.template-envelope/1",
  "template_id": "tpl_fixed_signal_demo",
  "version": "1.0.0",
  "template": { "schema_version": "nn.strategy-template/1", "rules": [] },
  "sha256": "<canonical-template-bytes-sha256>",
  "signature": "<platform-ed25519-signature>"
}
```

- canonical 规则、签名域和 schema 迁移待与 K3-A 对齐；main 必须验证 `template_id/version` 与内容一致、hash 与签名一致、参数 schema 可解析、app/EA/protocol 最低版本满足。
- main 不接收渲染层传来的任意文件路径，只接收 template id/version；本地缓存损坏或签名无效就不显示“可运行”。
- 落到 EA 时使用 `STRATEGY_INSTALL`，内容包括已批准的模板 hash、实例绑定与参数 hash；不是把任意 JSON 文件路径交给 EA。

**失败模式 → UI 可观测**：JSON/schema 错误、hash/签名不符、版本过旧、缓存过期、重复版本、测试签名混入生产 → 卡片显示“不可用 + 原因 + 所需版本”，安装/运行按钮不存在或禁用，不写 EA 策略包。

### D2.3 阶段 2：实例化与 magic 分配

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
  "params": { "volume_lots": 0.01, "sl_points": 250, "tp_points": 500 },
  "params_hash": "<canonical-params-sha256>",
  "state": "DRAFT",
  "approval_id": null,
  "entitlement_id": "ent_demo_01",
  "created_at": "<iso8601>"
}
```

**magic 规则（MVP 明确决策）**：

1. `instance_id` 用主进程生成的随机 UUID/ULID；magic 用主进程 `crypto` 生成，不由 AI、模板作者或渲染层指定。
2. 为兼容当前 EA 的 `input int`，MVP 从正的非零 31 位整数中分配，并排除 legacy/manual 保留值；精确券商接受范围待真机确认。
3. 唯一性作用域是 `(account_server, account)`，同时记录 terminal/binding。分配前原子检查本地注册表，再让 EA 扫描当前持仓、挂单和可获取历史中的 magic；冲突就换值，不能“先跑再说”。
4. 注册表先写 `RESERVED` 再允许启动，写盘采用临时文件 + rename；应用重启后恢复同一映射。多桌面共用同一账户时仍有残余冲突风险，检测到即进入 `REVIEW_REQUIRED`；平台统一号段可后补。
5. 停止后释放的是**运行位和账户的活动占用**；magic 转为 `RETIRED`，MVP 不重新使用，保证历史归因不串。账户解绑必须先停止、无在途命令、无待核对项，且用户已选择持仓处置。
6. MVP 每个 `(account_server, account)` 只允许一个 RUNNING 策略实例，且只允许模拟盘。净额账户同品种多策略的归属与仓位冲突本季度不做。

**失败模式 → UI 可观测**：magic 冲突、账户/服务器切换、epoch 变化、参数越界、运行位不足、注册表写入失败 → 保持 DRAFT 或 REVIEW_REQUIRED，启动失败并指出具体字段，绝不静默换 magic 或换账户。

### D2.4 阶段 3：信号、命令、主进程校验、回执

**职责边界**：EA 的确定性代码根据模板规则、实时报价、账户与品种规格计算信号、手数、止损/止盈价格；main 再做权限、范围、审批、重复和风险检查；EA 执行前用券商规格最终复核。AI 可以解释，但不参与数值计算，不签发审批，不直接调用交易 IPC。

EA → bridge/main 的新事件（示例）：

```json
{
  "event": "STRATEGY_SIGNAL",
  "v": 2,
  "instance_id": "si_demo_01",
  "signal_id": "sig_demo_01",
  "template_sha256": "<template-hash>",
  "params_hash": "<params-hash>",
  "magic": 123456789,
  "account": "12345678",
  "account_server": "ICMarkets-Demo",
  "epoch": 1,
  "symbol": "EURUSD",
  "side": "BUY",
  "volume_lots": 0.01,
  "sl_points": 250,
  "tp_points": 500,
  "issued_at_ms": "<ea-time-ms>",
  "sig": "<ea-hmac>"
}
```

main 校验后复用内部 `call('sendCommand')`，但走协议 v2：

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

- v2 为每种命令定义独立 payload schema，未知字段拒绝；canonical 至少覆盖版本、id、类型、origin、账户、服务器、epoch、issued/ttl、magic、instance、signal、params hash、ticket（平仓时）、全部交易数值和 tag。
- EA 检查该 instance 已获批准且 RUNNING、租约有效、magic/绑定/参数 hash 一致。旧 EA 不具备这些能力时，main 不允许发送。
- `tag` 只用于归属和展示；订单 comment 由 EA 确定性生成。comment 和短 id 只是弱证据，magic + deal/order/position 关联 + 本地归档共同对账。

回执示例：

```json
{
  "v": 2,
  "id": "cmd_demo_01",
  "stage": "EXECUTED",
  "account": "12345678",
  "order": "<mt5-order-ticket>",
  "deal": "<mt5-deal-ticket>",
  "price": "<execution-price>",
  "instance_id": "si_demo_01",
  "signal_id": "sig_demo_01",
  "magic": 123456789,
  "ts": "<mt5-utc-time>",
  "message": "已成交",
  "sig": "<receipt-hmac>"
}
```

**失败模式 → UI 可观测**：重复 signal、审批过期、参数被改、epoch/账户不符、保证金不足、终端禁交易、EA AutoTrade 关闭、TTL 过期、券商拒单 → 时间线显示“信号→校验→命令→回执”停在哪一跳及原因。结果未知必须显示 RECONCILING，冻结该实例的新信号，禁止自动重放，等待人工核对。

### D2.5 阶段 4：观测与可信绩效的最小字段

当前 snapshot 只够看“现在”，不够画真实曲线或归因。以下事件先落本地，再按用户明确授权脱敏上传；公开绩效不能使用 UI 桩数据。

| 事件 | 最小必需字段 | 用途 |
|---|---|---|
| `equity_sample` | `event_id/ts_utc/account_key/instance_id/magic/balance/equity/open_pnl/currency/epoch/source_seq`；有出入金时加 `cashflow_delta` | 净值/回撤；识别数据缺口与出入金，不把充值当收益 |
| `deal` | `deal_ticket/order_ticket/position_id/command_id/signal_id/instance_id/magic/account_key/server/symbol/side/entry_in_out/volume/price/commission/swap/profit/deal_time_utc/epoch` | 已实现盈亏、费用、每笔实例归因、与 MT5 历史对账 |
| `run_state` | `instance_id/template_id/template_version/template_hash/params_hash/binding_hash/state/approval_id/started_at/stopped_at/app_version/ea_version/protocol_version/reason` | live-forward 起点、参数变更、停止/异常区间 |
| `receipt` | `command_id/stage/retcode/order/deal/ts/instance_id/magic/sig` | 命令到成交的对账；未知结果不猜 |
| `provenance` | `event_id/source=MT5_EA/source_seq/received_at/sig/schema_version` | 去重、顺序、缺口、完整性与审计 |

新增 IPC：`strategyEquity(instanceId, range)`、`strategyDeals(instanceId, cursor)`、`strategyEvents(instanceId, cursor)`。所有时间保留 UTC 与接收时间，不用本机时区拼曲线。

**绩效口径决策**：

- 回测、模拟、实盘/forward 永远分段、分标签，不拼成一条连续实盘曲线；样本不足就显示“数据不足”，不年化、不排名。
- 缺样不插值成“平稳收益”；出入金、手续费、swap、佣金必须显式处理。停止后仍可展示历史，但不伪装仍在运行。
- 广场公开曲线至少要有 run_state 的发布起点、连续 equity/deal 证据和缺口标记；M0/M1 只显示“本机模拟运行”，不生成公开收益榜。

**失败模式 → UI 可观测**：序号跳号、签名错误、时序倒退、成交与回执对不上、上传失败 → 曲线标“数据缺口/待核对”，对应区间不参与排名与结算；本地原始事件保留。

### D2.6 阶段 5：监控、异常、停止与解绑

现有节奏可直接复用：EA 默认命令泵 `InpPollMs=250ms`、heart 默认每秒；bridge 回执轮询 `POLL_MS=500ms`，heart/status 新鲜阈值 `15000ms`；UI snapshot 每 `1500ms`、AI 余额每 `60000ms` 刷新（源码见 `ea/NiuNiuBridge.mq5:29-34`、`src/bridge/index.js:20-21,50-58`、`src/ui/app.js:488-489`）。这些是当前值，不是保证的 SLA。

**[推断] 异常判定**：EA 离线、status 过期、签名失效、交易许可关闭、账户/服务器/epoch 改变、magic 冲突、signal/deal 缺口、RECONCILING、实例风险限制触发。异常时停止新信号；涉及敞口或结果未知则进入 `REVIEW_REQUIRED`。

**停止语义**：`strategyStop` 先撤销 RUNNING 租约、禁止新开/加仓，再等待在途命令到终态；**默认不平仓、不撤用户其他订单**。用户另行确认后，才可“撤销本策略挂单”或“平掉选中的本策略持仓”。停止完成后释放运行位和活动账户占用，magic 保留为 RETIRED。

**bridge/桌面崩溃**：新增 EA 运行租约（dead-man switch），租约只能由 main 续签；租约到期 EA 自动停止新开仓，但不自动平仓。租约时长与真机时钟误差待压测确认。bridge 重启后先恢复注册表和归档、拉取 MT5 状态/历史对账，再允许人工恢复；不能直接续跑。

停止请求示例：

```json
{
  "instance_id": "si_demo_01",
  "expected_params_hash": "<params-hash>",
  "stop_new_entries": true,
  "cancel_strategy_pending_orders": false,
  "close_strategy_positions": false,
  "reason": "USER_STOP"
}
```

**失败模式 → UI 可观测**：EA 离线时显示“停止请求未确认”，不能假报已停止；有持仓时显示“策略已停止新开仓，仍有持仓待处置”；归属未知的仓位只提示人工在 MT5 处理，不自动平仓。

### D2.7 阶段 6：订阅、运行位与 AI 积分

**[推断] 权益与授权分工**：现有离线 license 继续证明“软件已激活”；平台签名 entitlement 证明“某用户拥有哪些模板和多少运行位”。AI 积分只支付 AI 解释/分析，不为策略信号或风控另收积分；AI 余额不足不影响停止、平仓和确定性告警。

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
  "issued_at": "<iso8601>",
  "expires_at": "<iso8601>",
  "revocation_generation": "<server-generation>",
  "signature": "<platform-ed25519-signature>"
}
```

- 创建实例前展示计费预览：模板订阅周期、运行位、是否含 AI 积分、续费/取消规则；价格与税务待平台确认，本文不编造。
- 支付成功以服务端订单回调为准，客户端不凭“支付页返回成功”开权益。ZPay/Stripe 与策略权益的实际后台连接 **待确认**。
- 到期/撤销禁止新实例、新开仓和加仓；允许同步、撤单、平仓/减仓等风险降低动作。现有 main 对未授权一律拒所有 sendCommand，需按命令风险重构，避免“过期后不能平仓”。

---

## D3 · [推断] 最小可测 MVP

### D3.1 真实现与桩的边界

| 部分 | MVP 使用 | 真实现 / 桩 | 结论边界 |
|---|---|---|---|
| Electron UI/preload/app.js | 真文件，复用 verify-main 方式 | 真实现 | 现有 30 条 UI 断言可跑；策略 UI 是最小新增，不是现成功能 |
| 模板 | 一个本地、测试 key 签名的固定信号模板 | 桩内容 + 真签名校验逻辑 | 不代表盈利能力，不进入生产目录 |
| 终端/账户/行情 | M0 用 stub-ipc；M1 换 Windows MT5 demo | M0 桩 / M1 真 | M0 不证明 MT5 兼容性 |
| 策略实例/审批/magic | 临时 userData 测试目录中的真注册表与状态机 | 真实现（最小新增） | 必须落盘并重载测试，不能只在 DOM 里造假 |
| 信号 | M0 测试按钮触发固定 signal；M1 EA 确定性规则 | M0 桩 / M1 真 | AI 不生成 signal 数值 |
| 执行 | M0 fake EA + OrderSend spy；M1 真 EA/MT5 demo | M0 桩 / M1 真 | M0 的 EXECUTED 不得进入公开绩效 |
| 权益/成交 | M0 只把明确标 `source=STUB` 的事件用于 UI；M1 真 EA 事件 | M0 桩 / M1 真 | 桩曲线不上传、不排名、不结算 |
| AI | 现有 mock 网关 + 只读解释工具桩 | 真计费 / 桩解释 | 无 AI 不影响停止、平仓和告警 |
| 订阅 | M0 测试 entitlement；M2 才接真实支付/平台账户 | M0 桩 | 不宣称已打通 ZPay/Stripe 策略权益 |

### D3.2 今天即可复现的基线操作

1. 在仓库根目录执行  
   `env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tools/verify-main.js`  
   预期：30 项全 PASS、进程退出码 0。失败先看是否误带 `ELECTRON_RUN_AS_NODE=1`。
2. 执行 `python3 test/ea_sim.py test/vectors.json`  
   预期：`10 PASS / 0 FAIL`。这只验 v1 签名一致性。
3. 执行 `cd ai-gateway && node test/smoke.js`  
   预期：15 项全通过；测试使用临时数据目录和 mock 上游。
4. 真 MT5 可选段（必须在 Windows、自己的模拟账户）：`npm start` → 激活自己的有效授权 → “终端与 EA”→ 选择模拟终端 → 安装桥接 EA → 在 MT5 挂载并允许算法交易。预期：EA 在线、签名启用、账户/服务器显示。保持 `InpDemoOnly=true`。
5. 现有“交易”页只能证明人工确认下单链，不能证明策略实例链。尤其在 `ticket` 序列化修复前，不应把“平仓成功”列为既有预期。

### D3.3 M0 生态闭环验收手册（最小新增后执行）

新增范围只限：本地模板 fixture、`StrategyController`、实例注册表、协议/EA 测试替身、最小策略详情/确认/运行页，以及 `tools/verify-ecosystem.js`。不新增盈利分润和公开绩效。

1. `env -u ELECTRON_RUN_AS_NODE node_modules/.bin/electron tools/verify-ecosystem.js --mock-ea`：预期 A01–A36 中 M0 项全 PASS，测试 userData 在临时目录。
2. 点击“策略广场 → 固定信号演示”：预期显示模板版本、测试签名状态、模拟盘限制；没有收益率或“已实盘验证”。
3. 选择 stub 终端，调整止损/止盈参数，点“创建策略实例”：预期生成 DRAFT、instance_id、绑定快照、params_hash 和唯一 magic；刷新/重载后仍存在。
4. 直接调用启动或取消原生确认框：预期没有 `sendCommand`、没有 `inbox/cmd_*.json`、fake `OrderSend` 计数为 0。
5. 重新启动并在 main 原生确认卡核对账户、服务器、品种、手数、止损、模板 hash：预期状态 RUNNING，只消费一次审批并占用一个运行位。
6. 触发测试 signal：预期确定性代码算出命令；signal_id 只产生一条命令；时间线能看到 SENT/ACCEPTED/EXECUTED（stub）。
7. 打开 AI 解释：预期只收到脱敏的实例别名、品种、状态和所选事件；断开 AI 或积分不足时，策略停止与平仓仍可用。
8. 点“停止”：预期不再产生新命令，原有 stub 持仓保留；再单独确认“平掉本策略持仓”才生成带 ticket/magic 的 POSITION_CLOSE。
9. 模拟回执丢失、bridge 重启、epoch 重绑：预期分别进入 RECONCILING/REVIEW_REQUIRED/旧命令失效，均不自动重放。
10. 真机 M1 再跑同一手册：只有 v2 EA 能力握手、真实 MT5 成交/历史/净值、crash recovery 全通过，才可标记“内部可测”。

### D3.4 自动化断言清单（36 条）

“M0”可由桩与真状态机自动验证；“M1”必须真 EA/MT5 或真协议实现，不能用 DOM 桩冒充。

| ID | 层 | 断言对象 | 期望值 | 失败代表什么 |
|---|---|---|---|---|
| A01 | M0 | 合法签名模板加载 | schema/hash/签名通过，可创建 DRAFT | 正常模板也不可用，发布链断裂 |
| A02 | M0 | 模板任一字节被篡改 | 拒绝且不能启动 | 完整性闸门失效 |
| A03 | M0 | 未知 schema / 旧 EA 能力 | INCOMPATIBLE，不写策略包 | 版本兼容失效，可能误执行 |
| A04 | M0 | 参数越界、缺字段、额外字段 | 创建失败，不占运行位 | 参数值域或未知字段校验失效 |
| A05 | M0 | 创建并重载实例 | id/binding/params_hash/magic 完全恢复 | 实例持久化或原子写入失效 |
| A06 | M0 | 同账户活动 magic 冲突 | 重新分配或拒绝；绝不双实例同 magic | 订单归属可能串线 |
| A07 | M0 | magic 为 0、负数、非整数、超范围 | main 与 EA 均拒绝 | magic 值域校验失效 |
| A08 | M0 | **未确认直接 strategyStart** | sendCommand=0、inbox 新文件=0、OrderSend=0 | **用户确认红线被绕过** |
| A09 | M0 | **用户取消原生确认框** | 不运行、不下单、审批不消费 | 取消被误当同意 |
| A10 | M0 | **AI 文本要求“马上买入”** | 无审批、无 signal、无 OrderSend | AI 能越权交易 |
| A11 | M0 | 审批后改参数/绑定/magic | hash 不符，拒绝启动/命令 | 审批对象可被调包 |
| A12 | M0 | 过期、撤销、重复消费 approval | 全部拒绝，无命令 | 审批重放/时效失效 |
| A13 | M0 | 无模板权益或运行位已满 | 可浏览但不能 RUN | 计费权益可绕过 |
| A14 | M0 | 未授权调用交易 IPC | main 返回未授权，无文件 | 现有 fail-closed 回归 |
| A15 | M0 | terminalPath 不含 MetaQuotes | main 拒绝 | 终端路径白名单回归 |
| A16 | M0 | volume 为 0/NaN/超上限；非法 type | main 拒绝 | 现有手数/类型白名单回归 |
| A17 | M0 | 策略命令缺 magic/instance/signal/tag | v2 main 与 EA 拒绝 | 策略归属字段可缺失 |
| A18 | M0/M1 | 签名后修改 magic/ticket/ttl/tag 等 | EA REJECTED + quarantine | v2 仍有未签名执行字段 |
| A19 | M0/M1 | 向 legacy EA 发 v2 策略命令 | main 在写 inbox 前阻止 | 旧 EA 可能忽略新字段执行 |
| A20 | M1 | 错账户/服务器/epoch | EA 拒绝且 OrderSend=0 | 账户绑定/重绑隔离失效 |
| A21 | M0/M1 | 合法已批准测试 signal | 恰好一条命令，字段与审批一致 | 执行链或字段映射错误 |
| A22 | M0/M1 | 重复 signal_id / command_id | 不重复 OrderSend；有去重记录 | 幂等失效，可能重复开仓 |
| A23 | M1 | `InpAutoTrade=false` | REJECTED，OrderSend=0 | EA 自身交易开关失效 |
| A24 | M1 | DemoOnly 时连接实盘 | REJECTED，OrderSend=0 | 模拟盘隔离失效 |
| A25 | M0/M1 | EXECUTED 回执与 deal | UI/归档均归到同一 instance/magic | 回执或成交归因断裂 |
| A26 | M0/M1 | 回执超时/结果未知 | RECONCILING、冻结新信号、零自动重放 | 不确定结果被误重试 |
| A27 | M0/M1 | 用户停止但有持仓 | 停止新开仓；持仓仍在 | stop 被错误实现为自动平仓 |
| A28 | M1 | 单独确认平策略仓 | ticket/magic 正确；非本策略仓不动 | 平仓序列化或所有权校验失效 |
| A29 | M0/M1 | rebind 后投递旧命令 | epoch 增加；旧命令 EXPIRED | 旧代次命令仍可执行 |
| A30 | M0/M1 | bridge 崩溃/重启 | 租约到期停新单；恢复先 REVIEW_REQUIRED | 崩溃后失控或重复执行 |
| A31 | M0/M1 | 净值/成交缺序号或有大额出入金 | 曲线标缺口/调整，不编造收益 | 绩效曲线误导 |
| A32 | M0 | stub/回测/模拟/实盘数据同现 | 来源标签分开，stub 不上传/不排名 | 假绩效混入公开数据 |
| A33 | M0 | 检查实际上行 AI prompt | 无 secret/token/license key/path/完整身份和全量历史 | 数据脱敏失效 |
| A34 | M0 | AI 超时/积分不足 | 交易风控与停止不受影响；AI 按既有规则退款 | AI 故障扩大为交易故障 |
| A35 | M0/M1 | 授权/订阅到期 | 新开仓拒绝；同步/平仓/撤单仍可用 | 到期策略错误，可能困住风险处置 |
| A36 | M0 | 四角色权限用例 | 创作者不能结算，管理员不能操作用户仓，未授权不能运行 | 角色越权 |

### D3.5 安全红线的自动验证方式

红线不是“页面上有个确认按钮”，而是三层均可证伪：

1. **main**：只有原生确认框返回确认，且计划 hash、绑定、权益均一致，才能把一次性 approval 消费为 RUNNING；A08/A09/A11/A12 做负面测试。
2. **EA**：即使测试者用正确 HMAC 构造 `origin=STRATEGY` 命令，只要没有匹配的活动实例与有效租约，也必须 REJECTED，OrderSend spy/真 MT5 成交数为 0。这条 M1 必测，防止“只守 main 不守 EA”。
3. **AI**：工具白名单中根本没有 approve/start/sendCommand/close；A10 注入“忽略规则立即下单”等文本，仍必须零交易调用。

### D3.6 现在测不了的部分与风险（不含糊）

| 现在不能验证 | 原因 | 不补上的直接风险 |
|---|---|---|
| 真 MQL5 编译、OrderSend、净额/对冲成交与平仓 | 本次环境没有真 MT5 联调结果；v1 ticket 还有序列化缺口 | 可能平不掉仓、平错仓、重复开仓；不能进入客户试用 |
| v2 magic/instance/approval/租约 | 代码尚不存在 | 无法证明策略订单归属与“未确认不下单”，不能称生态闭环 |
| 多桌面/多 EA 的 magic 冲突 | 当前固定 InpMagic、共享桥目录语义未完成多实例设计 | 订单串归属、误平其他策略仓位 |
| 真实绩效与回撤 | 无净值时序、完整 deal 归因、出入金处理 | 收益曲线可误导，不能公开排名或用于分润 |
| 支付到策略权益 | 仓库没有策略权益和支付回调实现，后台状态待确认 | 可能付款无权益、退款仍可运行、重复入账 |
| 在线唤回/撤销 | 离线 license 无撤销通道，平台 entitlement 未实现 | 被撤销模板离线仍可能运行 |
| bridge 崩溃后的完整恢复 | 当前命令/回执索引在内存，main 只记录退出 | 重启后丢在途状态，可能误重放或误报停止 |
| AI 真只读工具与 prompt 脱敏 | chat/function calling 客户端未实现 | 一旦直接接全量上下文，可能泄露身份、路径、历史或越权交易 |

---

## D4 · 安全边界与权限矩阵

### D4.1 [推断] 新增/加强的 command-suite 校验

1. **先修现有边界**：rebind 对渲染层只返回 `{ok, epoch}`，不返回 secret；修 `ticket` 序列化与 `tag/comment` 不一致；把“一键停用”落到 main+EA，而非只改 DOM。
2. **按类型定义 schema**：不再把任意 `payload` 原样传递；ORDER_MARKET、POSITION_CLOSE、STRATEGY_INSTALL/START/STOP 各有必填、可选和未知字段拒绝规则。
3. **magic**：非零正整数、范围受限、由 main 分配、和 instance/binding 完全一致；创建与每次命令都查冲突。EA 平仓同时校验 ticket 存在和 magic 所有权。
4. **模板参数**：JSON Schema 的 type/min/max/step/enum + 跨字段风险约束；未知字段拒绝。手数/止损除了现有 `0 < volume <= 1000`，还要过品种 VOLUME_MIN/MAX/STEP、STOPS_LEVEL、保证金和实例风险上限。
5. **审批一致性**：approval 绑定 template hash、params hash、账户+服务器+终端+品种、magic、权限范围与到期；任何一项改变都必须重新确认。启动审批一次性消费，运行期用可撤销租约，不是“一次确认永久有效”。
6. **协议全量签名**：v2 签名覆盖所有影响执行与归属的字段，包括 ticket、magic、instance、signal、tag、issued/ttl、max_deviation；字符串限制长度/字符集，数值必须 finite，ttl 有上下界。
7. **版本兼容**：heart/status 上报 `ea_version/protocols/features/schema_versions`。未报告即 legacy，只能走既有 v1 人工链；策略功能禁用。v2 EA 对未知版本/命令/字段 fail-closed 并隔离，不允许忽略新字段后继续执行。
8. **回执与事件**：EA 对 receipt/signal/deal/equity 事件做 HMAC、event_id 和 source_seq；bridge 验重、验序、验归属。签名只能证明持有该安装密钥的一端，不能证明客户端硬件未被恶意修改。
9. **速率与状态**：signal_id、command_id 去重；RECONCILING/STOPPING/EXPIRED/REVIEW_REQUIRED 状态禁止新开仓；风险降低命令单独放行。
10. **渲染与 AI 隔离**：保留 CSP、contextIsolation、sandbox、IPC 白名单；新增方法同样只暴露业务参数。AI 不获得通用 sendCommand，不获得任意 URL/文件路径能力；外链再按配置域名白名单。

### D4.2 [推断] AI 数据边界

| 数据 | AI 可见性 | 规则 |
|---|---|---|
| 公开模板说明、版本、风险标签、经审核的聚合指标 | 可以 | 只给当前问题所需字段，保留来源与数据口径 |
| 当前实例别名、品种、运行状态、用户主动选中的事件/持仓摘要 | 可以，最小化 | main 构造脱敏 DTO；账户 login/server 用不可逆 account_key 或省略 |
| 完整成交历史 | MVP 不给；以后仅显式授权的最小窗口 | 不默认上传全量历史；原始库留在本地 |
| 客户姓名、license key/id、精确账户身份、terminalPath、任意本地路径 | 绝不进入模型 prompt | 网关鉴权 user_id 与模型上下文分离 |
| bridge secret、HMAC 密钥、license 私钥、AI user token、支付/管理员密钥 | 绝不可见 | 不进入渲染层工具结果，不进日志，不进 prompt；另先修 rebind secret 返回 |
| 支付卡信息、完整支付订单个人资料 | 绝不可见 | 支付只在平台/支付方页面完成 |
| 手数、止损换算、审批、启动/停止/平仓工具 | 不提供给模型 | 确定性程序计算；AI 只能生成解释或待用户确认的草案 |

### D4.3 [推断] 权限矩阵

“看”指公开或本人有权数据，不代表可看他人隐私；“结算”指执行资金结算，不是查看自己的账单。

| 角色 | 看 | 订阅 | 运行 | 发布 | 改价 | 结算 |
|---|---|---|---|---|---|---|
| 未授权用户 | 公开模板元数据与已审核公开绩效；不看私有实例 | 否，先登录/授权 | 否 | 否 | 否 | 否 |
| 已授权用户 | 上述 + 自己的实例/账单/事件 | 可以，为自己购买 | 在模板权益、运行位、模拟盘限制内运行自己的实例 | 否，除非另加创作者角色 | 否 | 否，只能查看本人账单/申请退款 |
| 策略创作者 | 继承已授权用户 + 自己模板的数据 | 可以 | 同已授权用户，不因创作者身份获得他人账户权限 | 可提交自己的模板/新版本，审核后上架 | 可提交自己模板价格/分成的变更，审核后生效 | 可查看/申请自己的结算单，不能执行平台结算 |
| 平台管理员 | 模板、订单、审计所需最小数据；不因角色自动获得密钥 | 可代配置权益但须审计，不冒用用户订阅 | **不能操作用户账户或审批交易** | 审核、上架、下架、紧急撤销 | 可调整平台价格/费率，双人复核与审计 | 可复核后执行订阅收入结算；盈利分润本季度不开放 |

### D4.4 三类故障的行为

| 故障 | 当前源码事实 | [推断] 目标行为 |
|---|---|---|
| 到期 / 过期 / 唤回 | license 在 verify 时判断到期；未见运行中周期重验与在线唤回；未授权 main 会连平仓命令一起拒 | 周期重验 + 平台撤销代次；立即禁止新开/加仓和新实例，允许 SYNC/CANCEL/CLOSE/REDUCE。运行实例停止新开仓；有持仓或在途未知则 REVIEW_REQUIRED，不自动平仓。离线环境无法保证即时唤回，UI 显示最后验证时间 |
| EA 老版本 | 无 EA build/features 协商，未知 v 没有明确总入口拒绝 | 未声明兼容就禁用策略安装/运行，提示升级；运行中版本不符或心跳消失，租约到期停新单并进入 REVIEW_REQUIRED；不自动更新或重启 EA |
| bridge 崩溃重启 | main 置 bridge=null，未见自动重启；pending 会超时；commands/watchers 在内存 | UI 明确断连；EA 租约到期停新单；重启恢复持久注册表和命令归档，与 MT5 对账后才允许人工恢复。任何未知敞口均要求人核，不自动重放、不自动平仓 |

---

## D5 · [推断] 商业模式推荐：订阅/授权制，盈利分润推后

### D5.1 决策

**采用“平台订阅 + 模板订阅/运行位 + AI 积分”的订阅/授权制；本季度不做按已实现盈利分润，也不做按运行小时计费。**

- 与现有离线授权、官网订阅/分销、AI 积分和充值入口最相容；权益可用签名与到期控制，测试面清晰。
- 收入只依赖真实支付订单，不依赖客户机器上报的盈亏，绕开当前最弱的信任环节。
- 客户资金留在自己的 MT5，不需要平台碰资金；订阅解锁的是软件与模板使用权，不宣传收益承诺。
- 创建实例前做计费预览，周期、运行位、AI 积分是否另计一次说清；AI 积分继续按既有预扣/结算/退款逻辑。
- 不选按小时：客户端时钟、离线和崩溃会让计时与退款争议变复杂，也会激励用户为省钱关闭必要的监控。具体计费设计仍需平台成本数据，价格待确认。
- 创作者以后可参与**模板订阅实收收入**的分配，依据平台支付/退款流水，而不是策略盈利；比例与结算周期待确认。

### D5.2 先订阅、推后盈利分润的理由与代价

可以，而且应当如此。Minara 的已实现盈利分润有亏损期不分、周期结算等规则（事实底座）；AlphaFox 在创建前提示免费或按小时计费（事实底座）。对我们而言，先把权益和证据链做扎实，比先复制分润更重要。

**收益**：不需要先解决客户端盈亏可信度；订阅/运行位可做离线签名权益；退款、撤销、到期的语义可自动测试；创作者仍可凭订阅收入获得回报。

**代价**：创作者与策略盈利的利益绑定较弱；用户可能对平台订阅、模板订阅、AI 积分多层收费反感；运行位限制需要清楚解释；没有盈利分润时，平台更需要用可验证记录和模板质量留住用户。缓解方式是统一账单、购买前预览、同一账户/同一权益页，不隐性叠加收费。

### D5.3 若未来做盈利分润，怎样降低可信度风险

1. 只对**已平仓、已实现、扣除佣金/swap/费用后的净盈利**计算；排除出入金，按 instance/magic/账户记录高水位与亏损结转，亏损期不分。未对账、数据缺口、RECONCILING 一律不结算。
2. EA 对事件签名、加序号和时间，bridge 再去重/验序；同时三方对账：MT5 `OrderSend` 回执 + `HistoryDeals` 成交 + balance/equity 时序。只认撮合回执不够：超时后结果可能未知，后续平仓、swap 和费用也不在单次回执里。
3. **签名不是防客户端造假的充分条件**：密钥和客户端都在用户机器上，只能防传输篡改/重放，不能证明用户没有修改客户端。高金额或争议场景需要平台直接获取的券商只读证据/券商集成或人工账单审核；具体 MT5 可行接口待确认。
4. 任何序号缺口、回执与历史不一致、异常时钟、重复 deal、magic 冲突都进入结算冻结和人工复核；不由 AI 估算缺失盈亏，不用 0 填缺口。

### D5.4 引流/分销与创作者合并为一棵树

- 只有一个 `user_id` 和一个账户体系；`creator_profile`、订阅、AI 余额、订单、推荐关系都引用同一 user_id。角色是 `user_roles`，不是另开创作者账号。
- 每个用户节点只有一个 `referrer_user_id`，形成同一棵推荐树；创作者只是节点上的角色。禁止自推荐和环，换绑需审计。
- 一笔模板订阅订单同时记录 `buyer_user_id/creator_user_id/referrer_user_id/payment_order_id`；创作者订阅收入分配与推荐佣金走同一订单、不同 ledger entry，不能重复计算同一笔收入。
- 钱包可统一展示，但账本必须分类型；退款按原订单反向冲正。具体分销层级、比例和合规规则 **待确认**，本文不编造。

### D5.5 现阶段不建议做的三件事

1. **不做基于客户端上报盈亏的自动盈利分润/结算。** 证据链与券商独立核验未建立。
2. **不做实盘自动策略、多策略同账户或公开跟单扩量。** 本季度策略运行限定模拟盘单实例，净额归属与崩溃恢复先解决。
3. **不让 AI 直接下单、审批或计算手数/止损。** AI 只解释；确定性程序计算，用户确认。

---

## D6 · [推断] 时间与依赖

> 相对排期仅供本季度规划，人力、Windows/MT5 真机环境与平台后台接口均待确认；任一安全红线未过就停里程碑，不用桩结果顶替。

| 里程碑 | 时间 | 做哪些事 | 依赖 K3-A/B/C | 新增自动化断言 | 没做就进入下一步会欠什么债 |
|---|---|---|---|---|---|
| **M0 可演示** | 第 1–2 周 | 本地测试签名模板；最小实例注册表/magic；main 原生确认；stub signal/fake EA；策略详情/确认/运行/停止；AI mock 只读解释；测试 entitlement | A：临时 schema 对齐与一个非投资演示模板；B：卡片、详情、确认卡、运行态；C：Review 时间线、AI 边界与降级 | A01–A17、A21–A22、A25–A27、A31–A34、A36 的 M0 项；保留现有 UI 30 条 | 只做漂亮页面会形成“假闭环”；没有审批/持久化，后续真实协议也要返工 |
| **M1 内部可测** | 第 3–6 周 | 协议 v2；修 ticket/tag/rebind secret；EA v2 能力握手、确定性执行、magic/租约；真 MT5 demo；deal/equity/run 事件；crash/rebind 恢复 | A：EA 可执行 DSL、参数值域、版本迁移；B：异常/持仓处置/数据缺口 UI；C：事件枚举、脱敏 DTO、导出与审核记录 | A18–A24、A28–A30 真机项，A35 到期风险降低项；协议负面向量与 MQL5 编译/联调 | 未过真机就试用会把平仓错误、重复订单、失控运行和串 magic 带给客户 |
| **M2 小范围客户试用** | 第 7–10 周 | 平台签名模板服务；统一 user_id；真实订阅/运行位 entitlement；支付回调与退款对账；撤销；用户授权后的脱敏 telemetry；内部创作者模板审核；仍为模拟盘 | A：发布/审核/下架生命周期；B：计费预览、权益/到期/撤销体验；C：客户审计、AI 不可用降级、隐私授权 | 支付幂等/退款/撤销/权益隔离/角色矩阵/上传脱敏/断网缓存与恢复测试 | 没有权益与支付对账会出现付款无权益、退款仍可用；没有可观测性无法定位客户问题 |
| **M3 公开上线** | 第 11–13 周 | 审核模板目录、公开文档与升级回滚；运营监控/客服 SOP；只发布证据充分的模拟或 forward 记录；安全复核；订阅收入结算流程（非盈利分润） | A/B/C 正式交付并冻结兼容版本；绩效口径、Review 导出和创作者审核共同验收 | 升级/回滚、旧 EA 拒新、支付与结算对账、绩效来源隔离、长时运行/崩溃恢复回归 | 直接公开会放大绩效误导、版本碎片、退款争议、安全与合规风险 |

### 本季度明确不做的支线

- 盈利分润、按小时计费、独立创作者账号体系。
- 实盘自动策略、多策略同账户、净额账户同品种多实例、公开跟单扩量。
- 创作者完全自助上架与公开收益榜；先内部审核、证据充分再公开。
- DIY 看板完整扩建只保留 K3-C 设计，不并入这条主线；本主线只实现运行与 Review 必需组件。

---

## 最终验收口径

只有以下链路在真 MT5 模拟盘通过，才能说“生态闭环已打通”：

```text
已验证签名模板
→ 用户参数与账户/品种绑定
→ 持久化 instance_id + 无冲突 magic
→ main 原生确认（取消/篡改/重放均拒绝）
→ EA 确定性信号与手数/止损
→ main + EA 双层校验
→ 真实 MT5 回执与 deal 归因
→ 净值/事件有缺口可观测
→ AI 只读解释且可降级
→ 停止新开仓但默认保留持仓
→ 订阅到期仍允许风险降低
```

任何一步仍是 stub，就必须在 UI、报告和公开发布中保留“模拟/桩/未验证”标识，不能将 M0 演示结果称为真实绩效或生产可用。
