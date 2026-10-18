# 牛牛 AI · 策略模板库

三个模板共用同一个 EA：`ea/NiuNiuStrategy.mq5`，靠 `InpStrategy` 参数切换。
改参数不需要改代码、不需要重新编译。

## 1. 编译（只做一次）

用 MetaEditor 打开 `ea/NiuNiuStrategy.mq5` → 编译（F7）→ 得到 `NiuNiuStrategy.ex5`。

> 静态体检可以先跑：`node tools/check-mql5.js ea/NiuNiuStrategy.mq5`
> 但它**不是编译器**，只抓括号配对、函数先定义后调用、MQL4 遗留 API。
> 真编译必须在 MetaEditor 里做。

## 2. 挂到图表

一个图表 = 一个 EA 实例 = 一个策略。**跑第二个模板就再开一个图表**，然后把
`InpMagic` 改成不一样的值（810001 / 810002 / 810003）。

| 模板 | InpStrategy | InpMagic | 建议品种 | 建议周期 |
|---|---|---|---|---|
| NN-T01 趋势回撤 | 0 | 810001 | XAUUSD / EURUSD / NAS100 | H1 |
| NN-T02 区间突破 | 1 | 810002 | XAUUSD / USOIL / NAS100 | H1 / H4 |
| NN-T03 有界均值回归 | 2 | 810003 | EURUSD / GBPUSD / AUDUSD | H1 |

## 3. 回测（上架前必做）

MT5 → 视图 → 策略测试器：

- EA 选 `NiuNiuStrategy`，品种与周期按上表
- 模式选「真实 tick」或至少「1 分钟 OHLC」（用「仅开盘价」跑出来的结果不可用）
- 区间选至少 1 个完整样本（建议 ≥ 1 年，且**必须包含一段回撤期**）
- 跑完把结果填回对应 JSON 的 `metrics`，并把 `evidence` 从 `NOT_RUN` 改成 `BACKTEST_ONLY`

**没跑回测就不要填数字。** `metrics` 里全是 `null` 是正常状态，编一个收益率进去是事故。

## 4. 三条硬边界

1. **Magic 只做逻辑隔离，不做风险隔离。** 余额、净值、保证金、回撤全部共享。
   跑 2–3 个模板时把 `InpRiskPct` 降到 0.5–0.7，跑 4–6 个降到 0.3–0.5，合计控制在 2.5% 以内。
2. **净额账户（Netting）同品种只有一个净头寸，Magic 在该品种内失效。**
   想同品种跑多个策略，必须用对冲账户（Hedging）。EA 检测到该品种已有其它 Magic 的持仓会自动跳过。
3. **移除 EA 不等于平仓。** `InpCloseOnStop` 默认 `false`。要平就显式改成 `true`。

## 5. 与桥接 EA 的关系

- `NiuNiuBridge.mq5` = 指令执行器（接收桌面端命令，不算信号）
- `NiuNiuStrategy.mq5` = 自主策略（自己算信号、自己下单）

两者可以共存于同一账户，前提是 Magic 不同，且净额账户下不同时用同一品种。
