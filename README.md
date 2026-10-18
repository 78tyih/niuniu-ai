# 牛牛 AI · MT5 交易副驾驶（Windows）v1.0.0

桌面端 + 自研 MT5 桥接 EA。**EA 源码与编译产物都在包里，可审计。**

> **一句话说明**：这套装在本机的程序把你的 MT5 终端接进来，让你在桌面端一键下单/平仓，
> 命令全程带 HMAC-SHA256 签名，EA 侧逐条校验后才执行。

---

## 一、先说清楚 v1 有什么、没有什么

| 能力 | v1 状态 | 说明 |
|---|---|---|
| MT5 实例自动发现 | ✅ 可用 | 扫描 `%APPDATA%\MetaQuotes\Terminal\*` |
| 一键市价下单（买卖 / 手数 / SL / TP） | ✅ 可用 | 走 EA，带执行前检查清单 |
| 一键平仓 | ✅ 可用 | 净额账户也正确（不是发反向单） |
| 账户 / 报价 / 持仓实时快照 | ✅ 可用 | 250ms 轮询 |
| 命令签名鉴权 | ✅ 可用 | HMAC-SHA256，安装期随机密钥 |
| 三层防重复执行 | ✅ 可用 | 归档表 / 订单备注短码 / 不确定态不重放 |
| 全局急停 | ✅ 可用 | 只挡新命令，已发出的会走完 |
| 日志导出 | ✅ 可用 | 用于客服远程排障 |
| AI 交易聊天 | ⚪ **未开放** | 界面里是占位，v1 不接模型 |
| 自动更新 | ⚪ **未接线** | 打包配置里是占位地址，需填自己的更新源 |

**v1 默认只允许模拟盘**（EA 参数 `InpDemoOnly = true`）。要开实盘必须显式改参数，
这是刻意的默认值，不是遗漏。

---

## 二、安装（客户视角，约 3 分钟）

### 第 1 步 · 装桌面端
双击 `牛牛AI Setup 1.0.0.exe` → 一路下一步。
装的是**当前用户**级，不需要管理员权限，也不会往 `Program Files` 写东西。

### 第 2 步 · 装 EA 到 MT5
1. 打开 MT5（**先登录一个模拟账户**）。
2. 打开牛牛 AI，第 1 步会自动列出本机所有 MT5 实例 → 选中你要用的那个。
3. 点「安装 / 更新 EA」。
   - 桌面端会把 `NiuNiuBridge.ex5` 拷到该终端的 `MQL5\Experts\`；
   - 并把**本机随机生成的密钥**写入该终端的 `MQL5\Files\niuniu\secret.json`。
   - 这一步是安全链条的关键：**没有它，EA 拿不到密钥，会拒绝一切交易命令。**
4. 回到 MT5：把「导航器 → EA 交易」里的 **NiuNiuBridge** 拖到任意图表。
5. 确认三件事：
   - 工具栏「自动交易」按钮是**绿色**；
   - EA 参数里 `InpAutoTrade = true`（否则只同步状态、不下单）；
   - 图表右上角出现笑脸 😊，Experts 日志里有 `═══ 牛牛 AI 桥接 EA 已启动 ═══`。

### 第 3 步 · 下单
桌面端填品种 / 方向 / 手数 / SL / TP → 点「确认下单」。
命令状态会依次显示：`已发出 → 已受理 → 已成交 / 已拒绝 / 待核对`。

---

## 三、命令状态怎么读（这段请务必看完）

| 状态 | 含义 | 你该做什么 |
|---|---|---|
| `SENT` 已发出 | 命令文件已投递，EA 还没回执 | 等 |
| `ACCEPTED` 已受理 | EA 校验通过，正在提交券商 | 等 |
| `EXECUTED` 已成交 | 券商已确认成交 | 无 |
| `REJECTED` 已拒绝 | 明确失败（手数越界、签名错、账户不符…） | 看回执里的原因 |
| `EXPIRED` 已过期 | 超过 TTL 才开始提交 | 重发（不会重复成交，id 已归档） |
| `RECONCILING` **待核对** | **结果不明**：请求可能已发出，但不知道成没成 | **去 MT5 里看真实持仓，不要重发** |

> **`RECONCILING` 是刻意设计的，不是 bug。**
> 系统永远不会替你自动重发一条结果不明的交易命令 —— 那才是真的会重复成交。
> 「宁可让你看到『待核对』，也不给你一个假的成功」。

---

## 四、安全设计（可审计）

1. **命令签名**：每条命令附 HMAC-SHA256 签名，canonical 串覆盖
   `id / type / account / server / epoch / symbol / side / volume / sl / tp` 共 10 段。
   改任何一个字段，签名即失效。
2. **密钥不落前端**：密钥由主进程生成在 `userData` 下，只经 `utilityProcess` 传给桥，
   渲染进程拿不到。
3. **零监听端口**：桌面端与桥之间是 stdio JSON-lines，**不开 localhost HTTP** ——
   本机任何进程和浏览器插件都能打本地端口，没必要多开这个面。
4. **渲染进程沙箱**：`nodeIntegration:false` + `contextIsolation:true` + `sandbox:true`，
   预加载只暴露白名单方法。
5. **双端独立校验**：桌面端校验通过**不能替代** EA 校验。EA 侧再看一遍签名、
   账户、服务器、代次、TTL、手数区间、止损距离。
6. **缺省即拒绝**：EA 拿不到密钥 → 拒绝交易命令；证据不足 → 拒绝。没有"放行"的缺省分支。
7. **隔离区**：校验失败的命令不会被删除，而是移到 `MQL5\Files\niuniu\quarantine\`，可事后追查。

---

## 五、目录结构

```
niuniu-ai/
├── ea/
│   ├── NiuNiuBridge.mq5      # EA 源码（自研，交付给客户，可审计）
│   └── NiuNiuBridge.ex5      # 编译产物（客户机无需 MetaEditor）
├── src/
│   ├── main.js               # Electron 主进程：密钥、桥生命周期、IPC 白名单
│   ├── preload.js            # contextBridge 白名单
│   ├── bridge/
│   │   ├── index.js          # 桥进程：实例发现 / EA 安装 / 文件 IPC / 回执轮询
│   │   └── protocol.js       # 协议 v1：canonical + HMAC 签名
│   └── ui/
│       ├── index.html        # 界面
│       └── app.js            # 渲染逻辑
├── test/
│   ├── gen_vectors.js        # 生成协议一致性测试向量
│   ├── ea_sim.py             # 按 EA 逻辑复刻验签（无 MetaEditor 也能回归）
│   └── vectors.json          # 已生成的向量
├── tools/
│   └── build-ex5.sh          # 远程调用 MetaEditor 编译 .mq5 → .ex5
└── package.json
```

---

## 六、开发者

```bash
npm install
npm start                 # 开发模式（会开 DevTools）

npm run build:win         # 打包 NSIS 安装包 → dist/
./tools/make-package.sh   # 组装可直接转发的测试包 → dist/NiuNiuAI-v1-test-package.zip
```

### 构建环境的三个坑（在国内网络 / 受限沙箱下必踩）

1. **npm 与 Electron 都要走国内镜像**，否则 Electron 从 GitHub 拉不动：
   ```bash
   export npm_config_registry="https://registry.npmmirror.com"
   export ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
   export ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
   ```
2. **缓存目录必须放在工作区内**。默认会往 `~/Library/Caches/` 写，会被沙箱拒绝
   （`ENOENT ... mkdir '/Users/.../Library/Caches/electron'`）：
   ```bash
   export electron_config_cache="$PWD/.cache/electron"    # 注意是 electron_config_cache，不是 ELECTRON_CACHE
   export ELECTRON_BUILDER_CACHE="$PWD/.cache/electron-builder"
   ```
3. **`asar` 目前设为 `false`**。开启 asar 时打包会因沙箱策略报
   `Brokered file token refused: modify backup failed`。关掉不影响功能，
   而且 EA 目录（`ea/`）本来就必须以真实文件形式存在——安装 EA 那一步要用
   `fs.copyFileSync` 把 `.ex5` 拷进 MT5 目录，压在 asar 里取不出来。

# EA 改了之后重新编译（需要一台装了 MT5 的 Windows 机，可免密 SSH）
./tools/build-ex5.sh serawin

# 协议回归：JS 侧签名 ↔ EA 侧验签，必须 10/10
node test/gen_vectors.js && python3 test/ea_sim.py test/vectors.json
```

**改 `protocol.js` 的 `canonical()` / `fmtNum()` 时，必须同步改 EA 里的
`canonical` / `NNFmtNum()`。** 两边不同步 = 签名永远不匹配 = 拒掉所有命令。

### 发布前必须替换的占位

| 位置 | 占位 | 要换成 |
|---|---|---|
| `package.json` → `build.publish[0].url` | `https://REPLACE_ME/updates/` | 你自己的更新源 |
| `package.json` → `build.win.icon` | `build/icon.ico` | 真实图标（否则打包报错） |
| `package.json` → `build.win.publisherName` | `NiuNiu AI` | 你的公司主体 |

---

## 七、排障

| 现象 | 原因 / 处理 |
|---|---|
| 终端列表里 EA 显示"未运行" | EA 没挂到图表，或自动交易没开。看图表右上角是不是笑脸 |
| 下单一直是「已发出」 | EA 没在跑，或终端目录选错了（多实例会各自有独立沙箱） |
| 提示「未启用签名 · 交易命令将被拒绝」 | 回到第 2 步再点一次「安装 / 更新 EA」，然后重启 EA |
| 全部命令被拒，回执写「账户不匹配」 | 命令里的账号不是当前登录账号 —— 换账户后要点「重新绑定」 |
| 换账户后老命令失效 | 正常。`epoch` 自增会让旧代次命令全部作废 |

---

## 八、风险揭示（请完整阅读）

1. **本软件是执行工具，不是投资建议。** 它把你按下的按钮原样送给券商，
   不判断该不该做这笔交易。
2. **自动交易存在技术风险**：断线、延迟、滑点、券商拒单、MT5 崩溃都可能造成
   与你预期不符的结果。**回执显示"已成交"以外的状态，一律以 MT5 终端里的实际持仓为准。**
3. **`RECONCILING`（待核对）意味着系统不知道结果**，此时必须人工核对，不要重复下单。
4. **v1 默认仅模拟盘。** 实盘请自行充分测试后再开启，并自行承担全部后果。
5. 开发者不对任何交易盈亏、间接损失、数据损失承担责任。

---

## 九、English summary

A local desktop app that bridges MetaTrader 5 via a self-developed EA.

- **Commands** are files (`inbox/cmd_<id>.json`) signed with HMAC-SHA256; the EA verifies
  every command (signature, account, server, epoch, TTL, volume bounds, stop distance) before
  touching the market. No key → no trading (fail-closed).
- **Receipts** are two-phase (`ACCEPTED` → terminal state). An unknown outcome is reported as
  `RECONCILING` and is **never auto-replayed**.
- **Idempotency** is three-layer: archive table, short id embedded in the order comment,
  and no auto-replay on uncertain outcomes.
- **Security**: no localhost port (stdio JSON-lines to a `utilityProcess`), sandboxed renderer,
  allowlisted preload, secret never reaches the renderer.
- **v1 ships**: terminal discovery, market order, close, live snapshots, log export, global halt.
  **Not in v1**: AI chat (placeholder), auto-update (placeholder URL).
- **v1 defaults to demo accounts only** (`InpDemoOnly = true`).

Build: `npm install && npm run build:win`. EA recompile: `./tools/build-ex5.sh <ssh-host>`.
Protocol regression must be 10/10: `node test/gen_vectors.js && python3 test/ea_sim.py test/vectors.json`.
