kimi version 2.1.1
• Let me read the three files first.Now read the templates-v1.clean.json (161KB, too big to read fully — use Python to extract structure). Also read strategies/NN-T0*.json.<class 'dict'> ['_note', 'meta', 'A1_taxonomy', 'A2_schema', 'A3_templates']
Now examine the 23 assets. Let me extract the A3_templates summary.<class 'dict'> dict_keys(['_note', 'templates', 'A4_lifecycle', 'A5_three_donts'])
count 23
keys: ['account_mode_constraint', 'author_type', 'category', 'direction', 'display', 'entry_rules', 'execution_map', 'exit_rules', 'filters', 'id', 'invalidation_signals', 'lifecycle_state', 'magic_seed', 'markets', 'mt5_caveats', 'name', 'one_liner', 'params', 'performance', 'required_data', 'risk', 'risk_defaults', 'session', 'style', 'suitable_env', 'timeframes', 'unsuitable_env', 'verification', 'version']
================================================================================
id: TPL-TREND-EMAX-H4 | name: 双均线趋势（H4 经典版） | style: trend | category: time_series | direction: both
one_liner: EMA20/50 金叉死叉进出场，ATR 定止损，吃中期趋势段。
lifecycle: draft
risk: "balanced"
risk_defaults: {"sl_points": 0, "tp_points": 0, "sl_note": "sl = atr_sl_mult × ATR(14,H4)，动态计算，0 表示不用固定值", "max_lots_per_trade": 1, "max_open_positions": 1, "max_daily_loss_pct": 2, "max_drawdown_stop_pct": 10, "trailing": null, "portfolio_budget_pct": 0.7}
entry: [{"left": {"indicator": "EMA", "params": {"period": 20}, "timeframe": "H4"}, "op": "cross_above", "right": {"indicator": "EMA", "params": {"period": 50}, "timeframe": "H4"}, "on": "close", "note": "金叉 → 多；死叉 → 空（对称规则，direction=both）"}]
exit: [{"left": {"indicator": "EMA", "params": {"period": 20}, "timeframe": "H4"}, "op": "cross_below", "right": {"indicator": "EMA", "params": {"period": 50}, "timeframe": "H4"}, "on": "close", "note": "反向穿越离场（多头侧；空头对称）"}]
================================================================================
id: TPL-TREND-EMAX-FILTER-H1 | name: 均线穿越 + 大周期趋势过滤（H1） | style: trend | category: time_series | direction: both
one_liner: H1 金叉死叉做触发，D1 EMA200 定多空许可，ADX 过滤震荡。
lifecycle: draft
risk: "balanced"
risk_defaults: {"sl_points": 0, "sl_note": "ATR 动态", "tp_points": 0, "max_lots_per_trade": 1, "max_open_positions": 1, "max_daily_loss_pct": 2, "max_drawdown_stop_pct": 10, "trailing": null, "portfolio_budget_pct": 0.7}
entry: [{"left": {"indicator": "EMA", "params": {"period": 20}, "timeframe": "H1"}, "op": "cross_above", "right": {"indicator": "EMA", "params": {"period": 50}, "timeframe": "H1"}, "on": "close"}]
exit: [{"left": {"indicator": "EMA", "params": {"period": 20}, "timeframe": "H1"}, "op": "cross_below", "right": {"indicator": "EMA", "params": {"period": 50}, "timeframe": "H1"}, "on": "close"}]
================================================================================
id: TPL-TREND-DONCHIAN-D1 | name: 唐奇安通道趋势（日线·海龟骨架） | style: trend | category: time_series | direction: both
one_liner: 突破 55 日高低点入场，跌破 20 日反向极值离场，ATR 定仓。
lifecycle: draft
risk: "balanced"
risk_defaults: {"sl_points": 0, "sl_note": "ATR 动态", "tp_points": 0, "max_lots_per_trade": 2, "max_open_positions": 1, "max_daily_loss_pct": 2, "max_drawdown_stop_pct": 15, "trailing": null, "portfolio_budget_pct": 0.5}
entry: [{"left": {"field": "close"}, "op": "gt", "right": {"indicator": "DONCHIAN", "params": {"period": 55, "band": "upper"}, "timeframe": "D1"}, "on": "close", "note": "空头对称 lt lower"}]
exit: [{"left": {"field": "close"}, "op": "lt", "right": {"indicator": "DONCHIAN", "params": {"period": 20, "band": "lower"}, "timeframe": "D1"}, "on": "close", "note": "多头离场；空头对称"}]
================================================================================
id: TPL-TREND-PULLBACK-H4 | name: 趋势回调入场（H4 顺大逆小） | style: trend | category: time_series | direction: both
one_liner: D1 定方向，H4 回调到 EMA50 且 RSI 回落后再顺大方向进场。
lifecycle: draft
risk: "balanced"
risk_defaults: {"sl_points": 0, "sl_note": "ATR 动态", "tp_points": 0, "max_lots_per_trade": 1, "max_open_positions": 1, "max_daily_loss_pct": 2, "max_drawdown_stop_pct": 10, "trailing": null, "portfolio_budget_pct": 0.7}
entry: [{"left": {"indicator": "RSI", "params": {"period": 14}, "timeframe": "H4"}, "op": "cross_above", "right": {"const": 50}, "on": "close", "note": "回调后动能复位 → 多；前提见 filters"}]
exit: [{"left": {"field": "close"}, "op": "lt", "right": {"indicator": "EMA", "params": {"period": 50}, "timeframe": "H4"}, "on": "close", "note": "跌破回调锚点离场"}]
================================================================================
id: TPL-MR-BBAND-H1 | name: 布林带均值回归（H1） | style: mean_reversion | category: time_series | direction: both
one_liner: 收盘刺破布林外轨后反向做回中轨，只在低 ADX 震荡市启用。
lifecycle: draft
risk: "balanced"
risk_defaults: {"sl_points": 0, "sl_note": "固定 sl = 1.5×ATR(14,H1)", "tp_points": 0, "tp_note": "中轨动态止盈 + 固定 ATR 止损双保险", "max_lots_per_trade": 1, "max_open_positions": 1, "max_daily_loss_pct": 1.5, "max_drawdown_stop_pct": 8, "trailing": null, "portfolio_budget_pct": 0.5}
entry: [{"left": {"field": "close"}, "op": "touch_lower", "right": {"indicator": "BBANDS", "params": {"period": 20, "mult": 2}, "timeframe": "H1"}, "on": "close", "note": "收盘在下轨外 → 多；上轨外 → 空"}]
exit: [{"left": {"field": "close"}, "op": "cross_above", "right": {"indicator": "BBANDS", "params": {"period": 20, "mult": 2, "band": "mid"}, "timeframe": "H1"}, "on": "close", "note": "回到中轨止盈离场"}]
================================================================================
id: TPL-MR-RSI2-M15 | name: RSI(2) 极值回归（M15） | style: mean_reversion | category: time_series | direction: both
one_liner: RSI(2) 打进极端区（<10 / >90）后反向做短回归，快进快出。
lifecycle: draft
risk: "balanced"
risk_defaults: {"sl_points": 0, "sl_note": "1.2×ATR(14,M15)", "tp_points": 0, "max_lots_per_trade": 1, "max_open_positions": 1, "max_daily_loss_pct": 1.5, "max_drawdown_stop_pct": 8, "trailing": null, "portfolio_budget_pct": 0.5}
entry: [{"left": {"indicator": "RSI", "params": {"period": 2}, "timeframe": "M15"}, "op": "lt", "right": {"const": 10}, "on": "close", "note": "超卖 → 多；>90 → 空"}]
exit: [{"left": {"indicator": "RSI", "params": {"period": 2}, "timeframe": "M15"}, "op": "cross_above", "right": {"const": 50}, "on": "close", "note": "回到中轴离场；另加时间止损：持仓超 max_bars_hold 根未回中轴也走"}]
================================================================================
id: TPL-MR-ASIA-RANGE | name: 亚洲盘区间回归（时段限定） | style: mean_reversion | category: time_series | direction: both
one_liner: 只在亚洲时段运行：区间内高抛低吸，伦敦开盘前全部离场。
lifecycle: draft
risk: "conservative"
risk_defaults: {"sl_points": 0, "sl_note": "1.0×ATR(14,M15)", "tp_points": 0, "max_lots_per_trade": 0.5, "max_open_positions": 1, "max_daily_loss_pct": 1, "max_drawdown_stop_pct": 5, "trailing": null, "portfolio_budget_pct": 0.3}
entry: [{"left": {"field": "close"}, "op": "touch_lower", "right": {"indicator": "BBANDS", "params": {"period": 20, "mult": 2}, "timeframe": "M15"}, "on": "close"}]
exit: [{"left": {"indicator": "TIME", "params": {}, "timeframe": "M15"}, "op": "gte", "right": {"const": "session_end_minus_15m"}, "on": "bar_open", "note": "时段强制平仓，不接伦敦突破"}, {"left": {"field": "close"}, "op": "cross_above", "right": {"indicator": "BBANDS", "params": {"period": 20, "band": "mid"}, "timeframe": "M15"}, "on": "close"}]
================================================================================
id: TPL-BRK-LONDON-ORB | name: 伦敦开盘区间突破（ORB） | style: breakout | category: time_series | direction: both
one_liner: 取亚洲盘高低点为区间，伦敦时段放量破区间边就追，日内了结。
lifecycle: draft
risk: "balanced"
risk_defaults: {"sl_points": 0, "sl_note": "sl = 区间对侧或 1×ATR(M15)，取近", "tp_points": 0, "tp_note": "1.5R", "max_lots_per_trade": 1, "max_open_positions": 1, "max_daily_loss_pct": 1.5, "max_drawdown_stop_pct": 8, "trailing": null, "portfolio_budget_pct": 0.5}
entry: [{"left": {"field": "close"}, "op": "gt", "right": {"indicator": "OPEN_RANGE", "params": {"ref_session": "asia", "band": "high"}, "timeframe": "M15"}, "on": "close", "note": "破亚洲高点 → 多；破低点 → 空"}]
exit: [{"left": {"indicator": "TIME", "params": {}, "timeframe": "M15"}, "op": "gte", "right": {"const": "ny_open"}, "on": "bar_open", "note": "纽约开盘前了结，不过夜"}]
================================================================================
id: TPL-BRK-DONCHIAN-PEND-D1 | name: 唐奇安挂单突破（日线·STOP 单版） | style: breakout | category: time_series | direction: both
one_liner: 在 20 日高点上方挂 BUY STOP、低点下方挂 SELL STOP，让市场自己触发。
lifecycle: draft
risk: "balanced"
risk_defaults: {"sl_points": 0, "sl_note": "2×ATR(20,D1)", "tp_points": 0, "max_lots_per_trade": 1, "max_open_positions": 1, "max_daily_loss_pct": 2, "max_drawdown_stop_pct": 10, "trailing": null, "portfolio_budget_pct": 0.5}
entry: [{"left": {"field": "high"}, "op": "touch_upper", "right": {"indicator": "DONCHIAN", "params": {"period": 20}, "timeframe": "D1"}, "on": "tick", "note": "挂单触发即入场；规则本体由 EA/服务端挂 STOP 单实现"}]
exit: [{"left": {"field": "close"}, "op": "lt", "right": {"indicator": "DONCHIAN", "params": {"period": 10, "band": "lower"}, "timeframe": "D1"}, "on": "close"}]
================================================================================
id: TPL-BRK-FADE-FAKE-M15 | name: 假突破反手（M15） | style: breakout | category: time_series | direction: both
one_liner: 突破关键位后 N 根内收回区间 → 判定假突破 → 反手做回区间内。
lifecycle: draft
risk: "aggressive"
risk_defaults: {"sl_points": 150, "sl_note": "默认缓冲值，实际按极值+缓冲动态算", "tp_points": 0, "max_lots_per_trade": 0.5, "max_open_positions": 1, "max_daily_loss_pct": 1.5, "max_drawdown_stop_pct": 6, "trailing": null, "portfolio_budget_pct": 0.3}
entry: [{"left": {"field": "close"}, "op": "cross_below", "right": {"indicator": "OPEN_RANGE", "params": {"ref_session": "prior_day", "band": "high"}, "timeframe": "M15"}, "on": "close", "note": "向上突破后又收回前日高点之下 → 空（反手）；向下假破对称"}]
exit: [{"left": {"field": "close"}, "op": "touch_lower", "right": {"indicator": "OPEN_RANGE", "params": {"ref_session": "prior_day", "band": "mid"}, "timeframe": "M15"}, "on": "close", "note": "回到区间中枢止盈"}]
================================================================================
id: TPL-GRID-RANGE-H1 | name: 区间震荡网格（正向） | style: grid | category: time_series | direction: both
one_liner: 在既定区间内等距布买单/卖单，每格独立止盈，靠震荡反复收割。
lifecycle: draft
risk: "balanced"
risk_defaults: {"sl_points": 0, "sl_note": "单格无硬 SL，靠格距止盈 + 区间失效总熔断；总熔断 = max_drawdown_stop_pct", "tp_points": 300, "max_lots_per_trade": 0.1, "max_open_positions": 5, "max_daily_loss_pct": 2, "max_drawdown_stop_pct": 8, "trailing": null, "portfolio_budget_pct": 0.4}
entry: [{"left": {"field": "close"}, "op": "enter_zone", "right": {"indicator": "GRID", "params": {"mode": "level"}, "timeframe": "H1"}, "on": "tick", "note": "价格触及网格层级即按该层预设方向下单；GRID 为引擎内建对象，参数见 params"}]
exit: [{"left": {"field": "close"}, "op": "pct_change_gte", "right": {"const": "grid_step"}, "on": "tick", "note": "每格固定止盈 = 格距；区间整体失效由 risk_defaults 的熔断接管"}]
================================================================================
id: TPL-GRID-TREND-FOLLOW | name: 顺趋势网格（反向/趋势网格） | style: grid | category: time_series | direction: both
one_liner: 只在 D1 趋势方向上布单：回调到格层接顺势单，格距止盈，逆趋势侧不布单。
lifecycle: draft
risk: "aggressive"
risk_defaults: {"sl_points": 0, "sl_note": "趋势反转信号 = 全部离场，无单格 SL", "tp_points": 500, "max_lots_per_trade": 0.1, "max_open_positions": 4, "max_daily_loss_pct": 2, "max_drawdown_stop_pct": 10, "trailing": null, "portfolio_budget_pct": 0.4}
entry: [{"left": {"field": "close"}, "op": "enter_zone", "right": {"indicator": "GRID", "params": {"mode": "level"}, "timeframe": "H1"}, "on": "tick", "note": "格层触价 + 趋势方向一致才下单"}]
exit: [{"left": {"field": "close"}, "op": "pct_change_gte", "right": {"const": "grid_step"}, "on": "tick", "note": "格距止盈；趋势反转（D1 收破 EMA200）→ 全部平仓停止"}]
================================================================================
id: TPL-DCA-FIXED-H4 | name: 定投摊平 DCA（固定手数） | style: dca_martingale | category: time_series | direction: long_only
one_liner: 初始信号开仓后，每浮亏一格按相同手数加一笔（不加倍），整体回本即全部离场。
lifecycle: draft
risk: "aggressive"
risk_defaults: {"sl_points": 0, "sl_note": "无单笔 SL，整组熔断兜底", "tp_points": 0, "tp_note": "整组回本离场", "max_lots_per_trade": 0.5, "max_open_positions": 6, "max_daily_loss_pct": 2, "max_drawdown_stop_pct": 6, "trailing": null, "portfolio_budget_pct": 0.3, "triple_caps_enforced": ["max_lots_per_trade", "max_open_positions", "max_drawdown_stop_pct"]}
entry: [{"left": {"indicator": "RSI", "params": {"period": 14}, "timeframe": "H4"}, "op": "lt", "right": {"const": 35}, "on": "close", "note": "首笔入场；后续加仓是状态机逻辑：浮亏 ≥ step_points 且层数 < max_layers → 同手数加一笔"}]
exit: [{"left": {"field": "equity_pct"}, "op": "gte", "right": {"const": 0.3}, "on": "tick", "note": "整组持仓合计盈利 ≥ 0.3% 净值 → 全部 POSITION_CLOSE"}]
================================================================================
id: TPL-MART-2X-H4 | name: 马丁格尔倍增摊平（受限版） | style: dca_martingale | category: time_series | direction: both
one_liner: 浮亏一格手数翻倍加仓，整组回本即走；层数、手数、净值熔断三重硬上限，默认不开放订阅。
lifecycle: draft
risk: "aggressive"
risk_defaults: {"sl_points": 0, "tp_points": 0, "max_lots_per_trade": 1.6, "max_open_positions": 5, "max_daily_loss_pct": 2, "max_drawdown_stop_pct": 5, "trailing": null, "portfolio_budget_pct": 0.2, "triple_caps_enforced": ["max_lots_per_trade", "max_open_positions", "max_drawdown_stop_pct"]}
entry: [{"left": {"indicator": "RSI", "params": {"period": 14}, "timeframe": "H4"}, "op": "lt", "right": {"const": 40}, "on": "close", "note": "首笔；加仓状态机：浮亏 ≥ step 且层数 < max_layers → 手数 ×2"}]
exit: [{"left": {"field": "equity_pct"}, "op": "gte", "right": {"const": 0.2}, "on": "tick", "note": "整组合计回本+微利 → 全部离场"}]
================================================================================
id: TPL-SCALP-LDNY-M5 | name: 伦敦-纽约重叠剥头皮（M5） | style: scalping | category: time_series | direction: both
one_liner: 只在伦敦-纽约重叠时段，顺 M5 EMA 方向吃 5-15 点小波段，点差超线即停。
lifecycle: draft
risk: "aggressive"
risk_defaults: {"sl_points": 80, "tp_points": 100, "max_lots_per_trade": 0.5, "max_open_positions": 1, "max_daily_loss_pct": 1, "max_drawdown_stop_pct": 5, "trailing": null, "portfolio_budget_pct": 0.3}
entry: [{"left": {"field": "close"}, "op": "cross_above", "right": {"indicator": "EMA", "params": {"period": 20}, "timeframe": "M5"}, "on": "tick", "note": "tick 级触发——scalping 豁免 on:close 强制，但 verification 必须含滑点与延迟项"}]
exit: [{"left": {"field": "close"}, "op": "cross_below", "right": {"indicator": "EMA", "params": {"period": 20}, "timeframe": "M5"}, "on": "tick", "note": "反向破线即走；固定 tp/sl 双保险走 risk_defaults"}]
================================================================================
id: TPL-SCALP-ASIA-M5 | name: 亚洲盘窄幅剥头皮（M5） | style: scalping | category: time_series | direction: both
one_liner: 亚洲时段低波动品种上做微型回归剥头皮，持仓以分钟计，伦敦开盘前收工。
lifecycle: draft
risk: "balanced"
risk_defaults: {"sl_points": 80, "tp_points": 80, "max_lots_per_trade": 0.3, "max_open_positions": 1, "max_daily_loss_pct": 1, "max_drawdown_stop_pct": 4, "trailing": null, "portfolio_budget_pct": 0.3}
entry: [{"left": {"indicator": "RSI", "params": {"period": 7}, "timeframe": "M5"}, "op": "lt", "right": {"const": 25}, "on": "close", "note": "超卖→多；>75→空"}]
exit: [{"left": {"indicator": "RSI", "params": {"period": 7}, "timeframe": "M5"}, "op": "cross_above", "right": {"const": 50}, "on": "close"}, {"left": {"indicator": "TIME", "params": {}, "timeframe": "M5"}, "op": "gte", "right": {"const": "session_end_minus_10m"}, "on": "bar_open"}]
================================================================================
id: TPL-SESS-NY-MOMENTUM-M15 | name: 纽约开盘动量（M15） | style: swing | category: time_series | direction: both
one_liner: 纽约开盘首小时确立方向后顺势进场，当天了结，避开数据发布前后。
lifecycle: draft
risk: "balanced"
risk_defaults: {"sl_points": 0, "sl_note": "首小时区间对侧", "tp_points": 0, "tp_note": "1.5R", "max_lots_per_trade": 1, "max_open_positions": 1, "max_daily_loss_pct": 1.5, "max_drawdown_stop_pct": 8, "trailing": null, "portfolio_budget_pct": 0.5}
entry: [{"left": {"field": "close"}, "op": "gt", "right": {"indicator": "OPEN_RANGE", "params": {"ref_session": "ny_first_hour", "band": "high"}, "timeframe": "M15"}, "on": "close", "note": "破首小时高点→多；破低点→空"}]
exit: [{"left": {"indicator": "TIME", "params": {}, "timeframe": "M15"}, "op": "gte", "right": {"const": "ny_close_minus_30m"}, "on": "bar_open", "note": "日内了结不过夜"}]
================================================================================
id: TPL-XS-MOMROT-D1 | name: 多品种动量轮动（D1 截面） | style: trend | category: cross_sectional | direction: long_only
one_liner: 品种池按 60 日动量打分排序，持前 2 名，周频调仓，掉出前 3 即换。
lifecycle: draft
risk: "balanced"
risk_defaults: {"sl_points": 0, "sl_note": "2.5×ATR(20,D1) 灾难止损", "tp_points": 0, "max_lots_per_trade": 1, "max_open_positions": 2, "max_daily_loss_pct": 2, "max_drawdown_stop_pct": 12, "trailing": null, "portfolio_budget_pct": 0.6}
entry: [{"left": {"indicator": "ROC", "params": {"period": 60}, "timeframe": "D1"}, "op": "rank_in_top_n", "right": {"const": 2}, "on": "close", "note": "截面打分：ROC(60) 在池内排名进前 2 → 持有"}]
exit: [{"left": {"indicator": "ROC", "params": {"period": 60}, "timeframe": "D1"}, "op": "rank_in_top_n", "right": {"const": 3}, "on": "close", "note": "掉出前 3 才换（缓冲带防频繁调仓）"}]
================================================================================
id: TPL-XS-VOLADJ-MOMROT-D1 | name: 波动率调整动量轮动（D1 截面·保守版） | style: trend | category: cross_sectional | direction: long_only
one_liner: 动量 ÷ 波动率打分持前 2，仓位按波动率倒数配，总敞口随市场波动伸缩。
lifecycle: draft
risk: "conservative"
risk_defaults: {"sl_points": 0, "sl_note": "2.5×ATR(20,D1)", "tp_points": 0, "max_lots_per_trade": 1, "max_open_positions": 2, "max_daily_loss_pct": 1.5, "max_drawdown_stop_pct": 8, "trailing": null, "portfolio_budget_pct": 0.5}
entry: [{"left": {"indicator": "ROC", "params": {"period": 60, "normalize": "divide_by_atr"}, "timeframe": "D1"}, "op": "rank_in_top_n", "right": {"const": 2}, "on": "close"}]
exit: [{"left": {"indicator": "ROC", "params": {"period": 60, "normalize": "divide_by_atr"}, "timeframe": "D1"}, "op": "rank_in_top_n", "right": {"const": 3}, "on": "close"}]
================================================================================
id: TPL-ARB-CORR-EUGU-H1 | name: EURUSD/GBPUSD 相关性价差回归（H1） | style: arbitrage | category: time_series | direction: both
one_liner: 两个高相关品种的价差 z-score 打到极端 → 多弱空强各一腿，价差回归即双腿平仓。
lifecycle: draft
risk: "balanced"
risk_defaults: {"sl_points": 0, "sl_note": "z_stop 价差止损，非价格止损", "tp_points": 0, "max_lots_per_trade": 0.5, "max_open_positions": 2, "max_daily_loss_pct": 1.5, "max_drawdown_stop_pct": 8, "trailing": null, "portfolio_budget_pct": 0.4}
entry: [{"left": {"indicator": "ZSCORE_SPREAD", "params": {"leg_a": "EURUSD", "leg_b": "GBPUSD", "lookback": 120}, "timeframe": "H1"}, "op": "gte", "right": {"const": 2}, "on": "close", "note": "z ≥ 2 → 空 A 多 B；z ≤ -2 对称。ZSCORE_SPREAD 为截面引擎内建对象"}]
exit: [{"left": {"indicator": "ZSCORE_SPREAD", "params": {"leg_a": "EURUSD", "leg_b": "GBPUSD", "lookback": 120}, "timeframe": "H1"}, "op": "cross_below", "right": {"const": 0}, "on": "close", "note": "价差回到中轴 → 双腿同平"}]
================================================================================
id: TPL-ARB-GOLDSILVER-D1 | name: 金银比率回归（D1） | style: arbitrage | category: time_series | direction: both
one_liner: XAUUSD/XAGUSD 比率打到历史极端 → 多低估空高估，比率回归双腿平仓。
lifecycle: draft
risk: "aggressive"
risk_defaults: {"sl_points": 0, "sl_note": "z_stop", "tp_points": 0, "max_lots_per_trade": 0.5, "max_open_positions": 2, "max_daily_loss_pct": 2, "max_drawdown_stop_pct": 10, "trailing": null, "portfolio_budget_pct": 0.3}
entry: [{"left": {"indicator": "ZSCORE_SPREAD", "params": {"leg_a": "XAUUSD", "leg_b": "XAGUSD", "lookback": 250, "form": "ratio"}, "timeframe": "D1"}, "op": "gte", "right": {"const": 2}, "on": "close", "note": "比率 z ≥ 2 → 空金多银；对称"}]
exit: [{"left": {"indicator": "ZSCORE_SPREAD", "params": {"leg_a": "XAUUSD", "leg_b": "XAGUSD", "lookback": 250, "form": "ratio"}, "timeframe": "D1"}, "op": "cross_below", "right": {"const": 0.5}, "on": "close"}]
================================================================================
id: TPL-COMBO-CORE-SAT | name: 核心-卫星组合（趋势核心 + 回归卫星） | style: other | category: hybrid | direction: both
one_liner: TPL-TREND-EMAX-H4 作核心（60% 预算）+ TPL-MR-BBAND-H1 作卫星（40%），共用一个组合风险预算与总熔断。
lifecycle: draft
risk: "balanced"
risk_defaults: {"sl_points": 0, "sl_note": "由子策略各自接管", "tp_points": 0, "max_lots_per_trade": 1, "max_open_positions": 2, "max_daily_loss_pct": 2, "max_drawdown_stop_pct": 8, "trailing": null, "portfolio_budget_pct": 1, "combo_budget_note": "组合合计风险预算 ≤ 2%（00-FACTS 5.4 组合折减口径）"}
entry: [{"left": {"indicator": "SUBSTRATEGY", "params": {"ref": "TPL-TREND-EMAX-H4"}}, "op": "signal", "right": {"const": 1}, "on": "close", "note": "组合型模板的规则 = 子策略引用 + 资金分配；子策略规则不重复展开"}, {"left": {"indicator": "SUBSTRATEGY", "params": {"ref": "TPL-MR-BBAND-H1"}}, "op": "signal", "right": {"const": 1}, "on": "close"}]
exit: []
================================================================================
id: TPL-COMBO-RISK-PARITY | name: 风险平价多策略组合 | style: other | category: hybrid | direction: both
one_liner: 三个子策略（趋势/回归/剥头皮）按各自近期波动率倒数分配预算，月度再平衡。
lifecycle: draft
risk: "conservative"
risk_defaults: {"sl_points": 0, "sl_note": "子策略接管", "tp_points": 0, "max_lots_per_trade": 1, "max_open_positions": 3, "max_daily_loss_pct": 1.5, "max_drawdown_stop_pct": 6, "trailing": null, "portfolio_budget_pct": 1, "combo_budget_note": "三腿合计 ≤ 2%（00-FACTS 5.4）"}
entry: [{"left": {"indicator": "SUBSTRATEGY", "params": {"ref": "TPL-TREND-EMAX-FILTER-H1"}}, "op": "signal", "right": {"const": 1}, "on": "close"}, {"left": {"indicator": "SUBSTRATEGY", "params": {"ref": "TPL-MR-RSI2-M15"}}, "op": "signal", "right": {"const": 1}, "on": "close"}, {"left": {"indicator": "SUBSTRATEGY", "params": {"ref": "TPL-SCALP-ASIA-M5"}}, "op": "signal", "right": {"const": 1}, "on": "close"}]
exit: []
Now I have all 23 assets. Let me count: 

  1. TPL-TREND-EMAX-H4 (trend)
  2. TPL-TREND-EMAX-FILTER-H1 (trend)
  3. TPL-TREND-DONCHIAN-D1 (trend)
  4. TPL-TREND-PULLBACK-H4 (trend)
  5. TPL-MR-BBAND-H1 (mean_reversion)
  6. TPL-MR-RSI2-M15 (mean_reversion)
  7. TPL-MR-ASIA-RANGE (mean_reversion)
  8. TPL-BRK-LONDON-ORB (breakout)
  9. TPL-BRK-DONCHIAN-PEND-D1 (breakout) — requires pending STOP orders; EA currently only supports market open — candidate but capability gap → note required_capabilities; still candidate per blueprint but flag
  10. TPL-BRK-FADE-FAKE-M15 (breakout)
  11. TPL-GRID-RANGE-H1 (grid) → excluded
  12. TPL-GRID-TREND-FOLLOW (grid) → excluded
  13. TPL-DCA-FIXED-H4 (dca_martingale) → 逆势加仓 → excluded
  14. TPL-MART-2X-H4 (dca_martingale) → excluded
  15. TPL-SCALP-LDNY-M5 (scalping) → deferred
  16. TPL-SCALP-ASIA-M5 (scalping) → deferred
  17. TPL-SESS-NY-MOMENTUM-M15 (swing) — actually it's intraday momentum; style listed swing; blueprint says swing 1 → candidate. Check overnight risk: exits by day close — fine.
  18. TPL-XS-MOMROT-D1 (trend, cross_sectional, long_only)
  19. TPL-XS-VOLADJ-MOMROT-D1 (trend, cross_sectional, long_only)
  20. TPL-ARB-CORR-EUGU-H1 (arbitrage) → deferred
  21. TPL-ARB-GOLDSILVER-D1 (arbitrage) → deferred
  22. TPL-COMBO-CORE-SAT (other) — references excluded? Its sub-strategies: TPL-TREND-EMAX-H4 (candidate) + TPL-MR-BBAND-H1 (candidate). Per blueprint, "other 逐项审核". It's a combo template — mechanism is portfolio allocation, not grid/martingale. But execution capability not there (SUBSTRATEGY engine doesn't exist). This is a candidate review-wise but... The blueprint counts 15 candidates = 6 trend + 3 MR + 3 breakout + 1 swing + 2 other. So combos stay candidate, but I should note execution capability gaps (待核验) for combos (no SUBSTRATEGY engine), cross-sectional (no ranking engine), pending-order breakout (no pending order primitive).
  23. TPL-COMBO-RISK-PARITY (other) — includes TPL-SCALP-ASIA-M5 as a leg (deferred scalp). Still candidate but flag dependency on deferred leg.

  So: 15 candidates, 4 excluded (2 grid + 2 dca_martingale), 4 deferred (2 scalping + 2 arbitrage). Matches blueprint 1.3 counts.

  Candidates need four-dimension classification: decision_mode=rule_based, style, risk_tier=unassessed, direction. Direction from asset: both → both_selective, long_only → long_only.

  Overlap of NN-T01/T02/T03 with 23 assets: 
  - NN-T01 趋势回撤 (EMA pullback) is conceptually close to TPL-TREND-PULLBACK-H4 but uses fast EMA/ATR channel with H1, different params/EA enum. They are distinct IDs, not the same asset. Blueprint asks to state overlap if any, and not double-count. I'll mark them as mechanism-related-but-distinct assets; catalog notes that they are not counted from the 23.

  Now check performance fields of assets — presumably all null/NOT_RUN. Let me quickly verify. Also check meta/_note in file.

  Also need manifest fields: schema fields from 1.10. Write JSON Schema.

  For candidates' execution_status: all disabled, validation_stage research, performance all null.

  Need "required_capabilities" per asset. For combos: "substrategy_engine" （待核验）; for cross-sectional: "cross_sectional_ranking" （待核验）; for pending: "pending_stop_orders" （待核验， EA 只支持市价）.

  Also check the `performance` field in assets and `verification`, `markets`, `timeframes`, `account_mode_constraint`, `author_type`, `session`, `magic_seed` to fill compatibility. Let me look at one full asset to get those fields.

• 23 个资产已过完一遍。再看几个字段细节（performance/verification/markets/timeframes/session/account_mode_constraint），以及文件的 meta 说明，然后开始写文件。meta: {"version": "1.0.0", "date": "2026-10-18", "sources": ["research/2026-10-18/00-FACTS.md（minara / mojo / alphafox 已核实公开事实）", "research/2026-10-18/01-CONTEXT.md（牛牛AI 现状）", "src/bridge/protocol.js、src/bridge/index.js、ea/NiuNiuBridge.mq5（执行能力边界，源码事实）"]}
performance : {"_status": "全部字段待实盘/回测填充，口径见 A2.performance_caliber"}
verification : ["G2_backtest", "G3_paper", {"rule": "slippage_tolerance", "max_deviation_points": 30}]
markets : {"allow": ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "XAUUSD"], "deny": ["exotics", "低流动性交叉盘"], "deny_reason": "点差与滑点侵蚀趋势利润 [推断]"}
timeframes : ["H4"]
account_mode_constraint : "any"
author_type : "platform_official"
session : {"limited": false, "allow": [], "news_blackout": {"enabled": false, "minutes_before": 0, "minutes_after": 0, "source": ""}}
magic_seed : 1001
display : {"card": ["window_return_pct", "max_drawdown_pct", "window_days"], "list": ["trades", "win_rate_pct", "risk", "style"], "detail": ["profit_factor", "swap 口径", "参数表", "失效信号"]}
execution_map : {"uses": ["ORDER_MARKET", "POSITION_CLOSE", "SYNC_STATE"], "ea_v1_supported": ["ORDER_MARKET", "POSITION_CLOSE", "SYNC_STATE"], "needs_ea_v2": [], "notes": "完全落在现有 EA 能力内，可作为首个端到端打通模板"}
params : [{"key": "ema_fast", "label": "快线周期", "type": "int", "default": 20, "min": 5, "max": 60, "step": 1, "unit": "根K线", "desc": "参数敏感性须在回测验证（±20% 不崩）"}, {"key": "ema_slow", "label": "慢线周期", "type": "int", "default": 50, "min": 20, "max": 200, "step": 5, "unit": "根K线", "desc": "必须 > ema_fast，保存时校验"}, {"key": "atr_sl_mult", "label": "ATR 止损倍数", "type": "number", "default": 2, "min": 1, "max": 4, "step": 
---- perf summary across all ----
TPL-TREND-EMAX-H4 | perf: {"_status": "全部字段待实盘/回测填充，口径见 A2.performance_caliber"} | verif: ["G2_backtest", "G3_paper", {"rule": "slippage_tolerance", "max_deviation_points": 30}] | sess: {"limited": false, "allow": [], "news_blackout": {"enabled": false, "minutes_bef
TPL-TREND-EMAX-FILTER-H1 | perf: {"_status": "待填充，口径见 A2.performance_caliber"} | verif: ["G2_backtest", "G3_paper"] | sess: {"limited": false, "allow": [], "news_blackout": {"enabled": false, "minutes_bef
TPL-TREND-DONCHIAN-D1 | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper"] | sess: {"limited": false, "allow": [], "news_blackout": {"enabled": false, "minutes_bef
TPL-TREND-PULLBACK-H4 | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper"] | sess: {"limited": false, "allow": [], "news_blackout": {"enabled": false, "minutes_bef
TPL-MR-BBAND-H1 | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper", {"rule": "news_calendar_dependency", "status": "blocked_until_data_source"}] | sess: {"limited": true, "allow": ["asia", "london"], "news_blackout": {"enabled": true
TPL-MR-RSI2-M15 | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper"] | sess: {"limited": true, "allow": ["london", "ny"], "news_blackout": {"enabled": true, 
TPL-MR-ASIA-RANGE | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper"] | sess: {"limited": true, "allow": ["asia"], "news_blackout": {"enabled": true, "minutes
TPL-BRK-LONDON-ORB | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper", {"rule": "slippage_tolerance", "max_deviation_points": 30}] | sess: {"limited": true, "allow": ["london"], "news_blackout": {"enabled": true, "minut
TPL-BRK-DONCHIAN-PEND-D1 | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper", {"rule": "ea_v2_dependency", "blocked": true}] | sess: {"limited": false, "allow": [], "news_blackout": {"enabled": false, "minutes_bef
TPL-BRK-FADE-FAKE-M15 | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper", {"rule": "slippage_tolerance", "max_deviation_points": 20}] | sess: {"limited": true, "allow": ["london", "ny"], "news_blackout": {"enabled": true, 
TPL-GRID-RANGE-H1 | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper", {"rule": "margin_stress", "scenario": "全部层同时满仓 + 区间失效瞬间的保证金水位"}, {"rule": "ea_v2_dependency" | sess: {"limited": false, "allow": [], "news_blackout": {"enabled": true, "minutes_befo
TPL-GRID-TREND-FOLLOW | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper", {"rule": "margin_stress", "scenario": "全层满仓"}, {"rule": "ea_v2_dependency", "blocked": true} | sess: {"limited": false, "allow": [], "news_blackout": {"enabled": false, "minutes_bef
TPL-DCA-FIXED-H4 | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper", {"rule": "margin_stress", "scenario": "满层 + 继续逆向 2×step 的保证金水位"}, {"rule": "triple_caps_pres | sess: {"limited": false, "allow": [], "news_blackout": {"enabled": false, "minutes_bef
TPL-MART-2X-H4 | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper", {"rule": "margin_stress", "scenario": "满层 + 逆向 2×step"}, {"rule": "triple_caps_present", "re | sess: {"limited": false, "allow": [], "news_blackout": {"enabled": false, "minutes_bef
TPL-SCALP-LDNY-M5 | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper", {"rule": "slippage_tolerance", "max_deviation_points": 10}, {"rule": "latency_budget", "sign | sess: {"limited": true, "allow": ["ln_ny_overlap"], "news_blackout": {"enabled": true,
TPL-SCALP-ASIA-M5 | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper", {"rule": "slippage_tolerance", "max_deviation_points": 10}] | sess: {"limited": true, "allow": ["asia"], "news_blackout": {"enabled": true, "minutes
TPL-SESS-NY-MOMENTUM-M15 | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper", {"rule": "news_calendar_dependency", "status": "blocked_until_data_source"}] | sess: {"limited": true, "allow": ["ny"], "news_blackout": {"enabled": true, "minutes_b
TPL-XS-MOMROT-D1 | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper", {"rule": "turnover_cost_model", "note": "调仓换手的点差成本必须进回测 [推断]"}] | sess: {"limited": false, "allow": [], "news_blackout": {"enabled": false, "minutes_bef
TPL-XS-VOLADJ-MOMROT-D1 | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper"] | sess: {"limited": false, "allow": [], "news_blackout": {"enabled": false, "minutes_bef
TPL-ARB-CORR-EUGU-H1 | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper", {"rule": "leg_risk_drill", "scenario": "单腿成交另一腿被拒的处置演练"}, {"rule": "correlation_stability_ch | sess: {"limited": true, "allow": ["london", "ny"], "news_blackout": {"enabled": true, 
TPL-ARB-GOLDSILVER-D1 | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper", {"rule": "leg_risk_drill", "scenario": "单腿裸敞口处置"}] | sess: {"limited": false, "allow": [], "news_blackout": {"enabled": false, "minutes_bef
TPL-COMBO-CORE-SAT | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper", {"rule": "combo_correlation_check", "note": "两腿信号相关性必须在回测中测量并披露 [推断]"}, {"rule": "kill_crite | sess: {"limited": false, "allow": [], "news_blackout": {"enabled": false, "minutes_bef
TPL-COMBO-RISK-PARITY | perf: {"_status": "待填充"} | verif: ["G2_backtest", "G3_paper", {"rule": "combo_correlation_check"}, {"rule": "kill_criteria_defined", "required": true}, {" | sess: {"limited": false, "allow": [], "news_blackout": {"enabled": false, "minutes_bef


• I have all data. Now let me plan the dispositions:

  **Candidates (15)**, with notes on capability gaps （待核验 where needed):

  Trend (6):
  1. TPL-TREND-EMAX-H4 — 保留候选。EMA20/50 金叉死叉，反向交叉退出，ATR 动态止损，execution_map 完全落在现有 EA 能力内。
  2. TPL-TREND-EMAX-FILTER-H1 — 保留候选。加 D1 EMA200 过滤 + ADX，机制合规。
  3. TPL-TREND-DONCHIAN-D1 — 保留候选。海龟骨架，ATR 定仓。
  4. TPL-TREND-PULLBACK-H4 — 保留候选。顺大逆小。注意：与 NN-T01 机制相近但非同一资产（说明）。
  5. TPL-XS-MOMROT-D1 — 保留候选（待核验：需要截面排名引擎，现有 EA 只有单品种市价开仓）。
  6. TPL-XS-VOLADJ-MOMROT-D1 — 保留候选（同上待核验）。

  Mean reversion (3):
  7. TPL-MR-BBAND-H1 — 保留候选。有界：固定 ATR 止损 + 中轨止盈，单笔持仓上限 1，无逆势加仓。verification 有 news_calendar_dependency blocked — 注明。
  8. TPL-MR-RSI2-M15 — 保留候选。有时间止损（max_bars_hold），有界。
  9. TPL-MR-ASIA-RANGE — 保留候选。时段强制平仓，有界。

  Breakout (3):
  10. TPL-BRK-LONDON-ORB — 保留候选。日内了结。
  11. TPL-BRK-DONCHIAN-PEND-D1 — 保留候选（待核验：需要 STOP 挂单，现有 EA 只支持市价开仓；verification 标记 ea_v2_dependency blocked）。
  12. TPL-BRK-FADE-FAKE-M15 — 保留候选。假突破反手，机制合规但 risk=aggressive → risk_tier 仍 unassessed（平台审核生成），可注记 aggressive 倾向。

  Swing (1):
  13. TPL-SESS-NY-MOMENTUM-M15 — 保留候选。日内了结不过夜，隔夜风险低。news_calendar blocked 注记。

  Other (2):
  14. TPL-COMBO-CORE-SAT — 保留候选（待核验：SUBSTRATEGY 组合引擎不存在，两腿均引用候选资产）。
  15. TPL-COMBO-RISK-PARITY — 保留候选（待核验：组合引擎 + 其中一腿引用暂缓资产 TPL-SCALP-ASIA-M5）。

  Excluded (4):
  - TPL-GRID-RANGE-H1 — grid 直接命中不做清单，且单格无硬 SL。
  - TPL-GRID-TREND-FOLLOW — grid 命中不做清单。
  - TPL-DCA-FIXED-H4 — 逆势加仓（浮亏加仓摊平），虽不加倍但机制本质命中「逆势加仓」且无单笔 SL。
  - TPL-MART-2X-H4 — 马丁格尔，直接禁入。

  Deferred (4):
  - TPL-SCALP-LDNY-M5, TPL-SCALP-ASIA-M5 — scalping 暂缓，执行能力（点差/滑点/延迟）撑不住。
  - TPL-ARB-CORR-EUGU-H1, TPL-ARB-GOLDSILVER-D1 — arbitrage 暂缓，多腿执行/部分成交/失败补偿超出当前能力。

  Direction mapping: both → both_selective, long_only → long_only. Wait blueprint direction values: long_only / short_only / both_selective. NN templates InpDirection=0 — need to know what 0 means. Check EA enum? Probably both. Let me check NiuNiuStrategy.mq5 quickly for InpDirection enum.

  Overlap note: NN-T01/T02/T03 are NOT among the 23 assets (the 23 have TPL- prefix). NN-T01 趋势回撤 is mechanism-adjacent to TPL-TREND-PULLBACK-H4 (both trend pullback), NN-T02 区间突破 adjacency to TPL-BRK-*/DONCHIAN breakout, NN-T03 有界均值回归 adjacency to TPL-MR-BBAND-H1. But distinct parameterization/engine. State this, don't double count.

  Now check InpDirection meaning. Let me grep the EA.

• 材料齐了。查一下 EA 里 `InpDirection` 枚举的含义，以确定三个首批模板的方向字段。

• `InpDirection: 0` = NN_BOTH = both_selective. 

  Now write files. Plan:

  1. `strategy-library/catalog.json` — 23 assets each with disposition, classification, review notes; plus counts, plus overlap note with NN-T01/02/03.
  2. `strategy-library/schemas/template.schema.json` — JSON Schema per 1.10.
  3. `strategy-library/excluded/index.json` — 4 excluded + 4 deferred.
  4. `strategy-library/templates/NN-T01-trend-pullback/manifest.json` (and T02, T03). Blueprint structure is `templates/<template_id>/<version>/manifest.json` but the brief says `strategy-library/templates/NN-T01-trend-pullback/manifest.json` (no version dir). Follow the brief explicitly — it's a "must". I'll note in the checklist that blueprint has `<version>/` subdir but brief asked flat.

  5. `prompts/` — 10 files.

  Let me write the catalog.json. Structure per asset: id, name, style (source), disposition (candidate/excluded/deferred), reason_zh, classification (for candidates), mechanism_review (notes on prohibited mechanism check), execution_capability notes, source style risk etc.

  Candidate classification: decision_mode=rule_based, style (mapped), risk_tier=unassessed, direction (both→both_selective, long_only→long_only).

  Style mapping: trend→trend, mean_reversion→mean_reversion, breakout→breakout, swing→swing, other→other. But scalping isn't an allowed style in manifest enum — deferred assets aren't manifests though; catalog can keep source style. For excluded/deferred index keep source style.

  Also note asset-level flags:
  - TPL-BRK-DONCHIAN-PEND-D1: needs pending stop orders, EA v1 doesn't support → capability gap 待核验.
  - TPL-XS-MOMROT-D1 / VOLADJ: cross-sectional ranking engine missing → 待核验.
  - TPL-COMBO-CORE-SAT / RISK-PARITY: SUBSTRATEGY engine missing → 待核验； RISK-PARITY references deferred scalp leg.
  - TPL-MR-BBAND-H1 / TPL-SESS-NY-MOMENTUM-M15: news calendar dependency blocked.
  - TPL-BRK-FADE-FAKE-M15: risk tag aggressive.

  Write catalog with fields per asset: id, name_zh, source_style, disposition, disposition_reason, classification (candidates), review_notes, pending_verification (list, for capability gaps). Top-level: meta (date, source files, rules), summary counts, overlap_note with NN templates.

  Now manifests for NN-T01/02/03. Use blueprint 1.10 structure with real params from strategies/NN-T0*.json:

  - template_id: "NN-T01-trend-pullback", version "1.0.0", name_zh "趋势回撤"
  - classification: decision_mode rule_based, style trend, risk_tier unassessed, direction both_selective (InpDirection=0)
  - compatibility: account_modes: [] — actually netting note exists; EA v1 supports hedging better. The asset says account_mode_constraint not present for NN templates. I'll set account_modes ["hedging"] with note? Blueprint draft example has empty arrays. For NN templates, markets.suggested_symbols and suggested_timeframe exist. account_modes: I'll put ["hedging"] since netting note warns; but safer: ["hedging"] with a notes field? Compatibility allows account_modes array. The netting_note says use different symbols on netting or hedging account. Setting account_modes ["hedging","netting_limited"]? Not allowed values specified. Keep account_modes: ["hedging"] and add netting_note in compatibility? Schema: compatibility.account_modes is array of strings; I can put "hedging" and "netting". To be honest: both work with constraint. I'll put both and add "notes" — but schema must define. I'll add optional "notes" field to compatibility in schema. Simpler: account_modes: ["hedging", "netting"] plus compatibility_notes: ["Netting 账户下同品种仅允许一个策略实例（蓝图 1.8）"]. I'll add compatibility_notes as optional array.

  - symbols: from markets.suggested_symbols; timeframes: suggested_timeframe "H1" (T02 "H1 / H4" → ["H1","H4"]); ea_version: "NiuNiuStrategy.mq5" — field expects version string; use "1.0.0"? Unknown EA version. Put ea name in engine_ref? Blueprint has ea_version field. The NN json has engine.ea. I'll set ea_version: null? Actually we can set "ea_name": not in blueprint. Better keep blueprint fields only, put ea_version: null and add "engine" info into... The schema allows additional fields? I'll keep manifest exactly to schema plus required fields, but also add "params_ref" and "risk_limits" since blueprint 1.5 says params and fixed protections matter. Blueprint's manifest example is minimal; brief says "用真实参数（读 strategies/NN-T0*.json），套蓝图 1.10 的 manifest 结构". So include params. I'll add "parameters" object containing the real params, and "fixed_protections" describing stop_is_mandatory etc. Add these to schema as optional extensions... The schema should cover them since manifests must validate. I'll include them in the schema.

  Fields: schema_version, template_id, version, name_zh, provider_id (null → "niuniu-platform"? author_type platform_official; provider_id null means platform official. Keep null), classification, compatibility, publication_status "draft", validation_stage "research", execution_status "disabled", required_capabilities ["account_risk_check","deterministic_position_sizing","initial_stop_loss_verified"], prohibited_mechanisms_review: for NN templates — they explicitly exclude 挂单/加仓/网格/马丁 primitives and stop_is_mandatory true. So review can be "passed"? Blueprint enum not given; example "pending". For the three first-batch templates, primitives_not_used lists them and stop mandatory → I could set "passed" but risk: blueprint says review must be recorded. The brief says 23 assets review; for NN templates we can state "passed" with basis. I'll set "passed" and add "prohibited_mechanisms_note". Allowed values for the schema: ["pending","passed","failed"].

  - performance all null.
  - evidence_refs [].
  - subscription {enabled:false, offer_id:null}.
  - parameters: real params from the JSON.
  - source_ref: "strategies/NN-T01-trend-pullback.json".

  Now the excluded/index.json: 8 entries with id/name/style/disposition(excluded|deferred)/reason.

  Prompts: 10 markdown files. Each with 用途/触发场景/模板正文/红线.

  P00: original text + boundary-correction sentence.
  P01: rewrite per correction.
  P10: keep.
  P15: new, JSON contract.
  P20: keep.
  P30: changed to order suggestion generation per correction.
  P40, P50, P90: keep.
  README: table of files, purposes, triggers, referenced-by.

  Referenced-by: who references whom — P00+P01 loaded for every request; P30 references P15 format; frontend renders P15 contract; P90 fallback; task router selects task template.

  Now write everything. Use TodoList? It's a multi-step task; fine to just write. I'll skip todo and write files directly — actually tracking helps, but 14 files is straightforward. I'll just write.

  catalog.json — write with python to avoid typos? I'll write JSON directly via Write tool; it's long but fine. Actually generating from the source JSON with a python script reduces error risk for 23 entries. But Write is more transparent and the content is mostly hand-authored dispositions. I'll hand-write but keep each entry compact.

  Let me draft catalog.json structure:

  {
    "schema_version": "1.0",
    "generated_at": "2026-10-19",
    "source_files": [...],
    "review_rules": {...brief of rules...},
    "summary": {"total": 23, "candidates": 15, "excluded": 4, "deferred": 4},
    "overlap_note": "...",
    "assets": [ ... ]
  }

  Each candidate asset:
  {
    "id": "TPL-TREND-EMAX-H4",
    "name_zh": "双均线趋势（H4 经典版）",
    "source_style": "trend",
    "disposition": "candidate",
    "disposition_reason": "...",
    "classification": {"decision_mode":"rule_based","style":"trend","risk_tier":"unassessed","direction":"both_selective"},
    "mechanism_review": "单向持仓上限1，ATR动态止损，无加仓/网格/马丁机制",
    "pending_verification": [],
    "performance": {"backtest": null, "demo": null, "live": null},
    "validation_stage": "research",
    "execution_status": "disabled"
  }

  For excluded/deferred, point to excluded/index.json but still include disposition + reason inline.

  Overlap note: NN-T01 vs TPL-TREND-PULLBACK-H4 (both trend pullback, different engine/params/timeframes — NN-T01 is H1 EMA-pullback via NiuNiuStrategy.mq5; TPL one is H4 with D1 filter + RSI. Distinct assets, not double counted). NN-T02 vs TPL-BRK-DONCHIAN-PEND-D1/TPL-BRK-LONDON-ORB (breakout family but different mechanisms). NN-T03 vs TPL-MR-BBAND-H1 (bounded MR, TPL lacks hard time limit? TPL-MR-BBAND-H1 has fixed ATR stop + mid-band exit but no explicit time limit — still bounded since max_open_positions=1, has SL; NN-T03 has mandatory 48-bar time stop). Also NN-T03 is implemented in NiuNiuStrategy.mq5, the 23 assets are design-stage (no engine implementation).

  Now schema. JSON Schema draft 2020-12:

  required: schema_version, template_id, version, name_zh, provider_id, classification, compatibility, publication_status, validation_stage, execution_status, required_capabilities, prohibited_mechanisms_review, performance, evidence_refs, subscription.

  enums per blueprint table. performance: object with backtest/demo/live each nullable object. evidence_refs array of objects with source_type enum (backtest/demo/live), window, params_ref, review.

  Also add optional: name_en, one_liner_zh, parameters (object), fixed_protections, compatibility_notes, engine, source_ref, pending_verification.

  Publication validation rules （发布校验器） can go as description in schema.

  Write files now. Also README.md in prompts/.

  For P15 file content: contract with JSON example, frontend rendering rule, validation rules (sl_points>0 else no card/button; lots computed by system; risk_warning placeholder).

  Careful on the risk_warning example: "按 0.5% 风险、0.01 手计算，本笔最多亏约 X 元" — contains X placeholder, fine as template.

  P30 template per correction with fields list.

  Now write all files. Let me create directories and write.

  For the catalog — 23 entries hand-written. Long but OK. Let me write it.

  Also brief said manifests at `strategy-library/templates/NN-T01-trend-pullback/manifest.json` (flat). Do that.

  Now write catalog.json:

• 材料全部读完，机制审查结论已明确。开始写文件。

• Now the three manifests. Blueprint structure has `templates/<template_id>/<version>/manifest.json` but brief says `strategy-library/templates/NN-T01-trend-pullback/manifest.json` — follow brief (flat, no version subdir). Note this in the final report as blueprint deviation.Now the prompts. 10 files. Each with 用途/触发场景/模板正文/红线， {{占位符}} preserved.

error: failed to run prompt: Unable to acquire OAuth refresh lock for "kimi-code": EEXIST: file already exists, mkdir '/Users/a1234/.kimi-code/oauth/kimi-code.lock'
See log: /Users/a1234/.kimi-code/logs/kimi-code.log
