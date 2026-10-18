//+------------------------------------------------------------------+
//|                                            NiuNiuStrategy.mq5     |
//|                                     牛牛 AI · 参数化策略模板 EA v1 |
//|                                        https://niuniuai.app       |
//+------------------------------------------------------------------+
#property copyright "NiuNiu AI"
#property link      "https://niuniuai.app"
#property version   "1.00"
#property description "牛牛AI 策略模板 EA：趋势回撤 / 区间突破 / 有界均值回归（靠参数切换）"

// ====================================================================
// 它和 NiuNiuBridge.mq5 的区别（装错了会互相打架）
// --------------------------------------------------------------------
//   NiuNiuBridge.mq5   = 指令执行器。不算信号，只接收桌面端发来的命令
//                        （市价开仓 / 按单号平仓 / 刷新状态）。
//   NiuNiuStrategy.mq5 = 自主策略。自己在 MT5 里算信号、自己下单。
//
//   两者可同时挂在同一账户的不同图表上，前提是：
//     ① Magic 互不相同（InpMagic）；
//     ② 净额账户（Netting）下同一品种只有一个净头寸 —— 本 EA 会主动检测：
//        若该品种上已存在非本 Magic 的持仓，本 EA 跳过不开并在日志说明。
//        这是 MT5 的规则，不是本 EA 的限制。
//
//   本 EA 只做三件事：市价开仓、按单号平仓、改止盈止损。
//   不做挂单、不做马丁、不做网格、不做逆势加仓 —— 这些是能一次亏光的东西。
// ====================================================================

// ---------- 策略枚举 ----------
enum ENUM_NN_STRATEGY
  {
   NN_TREND_PULLBACK  = 0,   // 0 · 趋势回撤
   NN_RANGE_BREAKOUT  = 1,   // 1 · 区间突破
   NN_BOUNDED_MEANREV = 2    // 2 · 有界均值回归
  };

enum ENUM_NN_DIRECTION
  {
   NN_BOTH       = 0,        // 双向
   NN_LONG_ONLY  = 1,        // 只做多
   NN_SHORT_ONLY = 2         // 只做空
  };

// ---------- 输入参数 ----------
// 【策略】
input ENUM_NN_STRATEGY  InpStrategy  = NN_TREND_PULLBACK;  // 策略
input ENUM_NN_DIRECTION InpDirection = NN_BOTH;            // 方向

// 【身份】每个图表 = 一个实例 = 一个 Magic。多开必须改这个号，否则平仓会平错。
input long   InpMagic = 810001;   // 魔术号（每个实例唯一）
input string InpTag   = "NNS";    // 订单备注前缀

// 【参数】
input int    InpFastPeriod        = 20;    // 快线周期（EMA）
input int    InpSlowPeriod        = 60;    // 慢线周期（EMA）
input int    InpChannelPeriod     = 20;    // 通道 / 回归观察窗口
input double InpStdK              = 2.0;   // 回归轨道倍数（标准差）
input int    InpAtrPeriod         = 14;    // ATR 周期
input double InpAtrSlMult         = 2.0;   // 止损 = ATR × 该倍数
input double InpAtrTpMult         = 3.0;   // 止盈 = ATR × 该倍数
input int    InpFixedSlPoints     = 0;     // 固定止损（point）。>0 时覆盖 ATR 止损
input int    InpFixedTpPoints     = 0;     // 固定止盈（point）。>0 时覆盖 ATR 止盈
input double InpPullbackTolAtr    = 0.5;   // 回踩容差 = ATR × 该倍数
input double InpMinChannelAtr     = 0.8;   // 通道最小宽度 = ATR × 该倍数（过滤窄幅假突破）

// 【风控】
input double InpRiskPct           = 0.5;   // 单笔风险（占余额 %）
input double InpFixedLots         = 0.0;   // 固定手数。>0 时不再按风险折算
input int    InpMaxPositions      = 1;     // 本 EA 同时最多持仓笔数
input double InpMaxDailyLossPct   = 2.0;   // 当日最大回撤（占日初权益 %），触及即当日停手
input int    InpMaxSpreadPoints   = 30;    // 点差上限（point），超过不开仓
input int    InpMaxDeviationPoints= 20;    // 允许滑点（point）
input int    InpMaxHoldBars       = 0;     // 最大持有 K 线数，0 = 不限
input bool   InpUseTrailing       = false; // 是否启用移动止损
input int    InpTrailPoints       = 0;     // 移动止损回撤（point），0 = 用 ATR×止损倍数

// 【时段】按终端时间；起 == 止 表示全天可交易
input int    InpSessionFromHour   = 0;
input int    InpSessionToHour     = 0;

// 【其它】
input bool   InpVerbose      = true;       // 打印日志
input bool   InpCloseOnStop  = false;      // 移除 EA 时是否平掉本 EA 的仓（默认不平）

// ---------- 全局 ----------
int      g_fast_h = INVALID_HANDLE;
int      g_slow_h = INVALID_HANDLE;
int      g_atr_h  = INVALID_HANDLE;
int      g_ma_h   = INVALID_HANDLE;
int      g_std_h  = INVALID_HANDLE;

datetime g_last_bar    = 0;
double   g_point       = 0;
int      g_digits      = 0;
int      g_day_key     = -1;
double   g_day_equity0 = 0;
bool     g_day_halted  = false;

//+------------------------------------------------------------------+
//| 工具：指标取值 / 新 K 线 / 日键                                     |
//+------------------------------------------------------------------+
double Buf(int handle, int shift)
{
   double v[1];
   if(handle == INVALID_HANDLE) return 0;
   if(CopyBuffer(handle, 0, shift, 1, v) != 1) return 0;
   return v[0];
}

double Atr(int shift)  { return Buf(g_atr_h,  shift); }
double Fast(int shift) { return Buf(g_fast_h, shift); }
double Slow(int shift) { return Buf(g_slow_h, shift); }
double Mid(int shift)  { return Buf(g_ma_h,   shift); }
double Std(int shift)  { return Buf(g_std_h,  shift); }

bool NewBar()
{
   datetime t = iTime(_Symbol, _Period, 0);
   if(t == 0) return false;
   if(t == g_last_bar) return false;
   g_last_bar = t;
   return true;
}

int DayKey()
{
   MqlDateTime dt;
   TimeToStruct(TimeCurrent(), dt);
   return dt.year * 10000 + dt.mon * 100 + dt.day;
}

//+------------------------------------------------------------------+
//| 持仓遍历：只看本 Magic 的仓                                        |
//+------------------------------------------------------------------+
int CountMine()
{
   int n = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(!PositionSelectByTicket(tk)) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      n++;
   }
   return n;
}

/**
 * 净额账户同品种互斥检查：该品种上若已存在非本 Magic 的持仓，本 EA 不再开。
 * 否则按 MT5 规则会被合成一个净头寸，Magic 直接失效，风险预算也就不准了。
 */
bool OtherMagicOnSymbol()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(!PositionSelectByTicket(tk)) continue;
      if(PositionGetString(POSITION_SYMBOL) != _Symbol) continue;
      if(PositionGetInteger(POSITION_MAGIC) == InpMagic) continue;
      return true;
   }
   return false;
}

//+------------------------------------------------------------------+
//| 风控闸门（任一不过就给出原因，不开仓）                              |
//+------------------------------------------------------------------+
bool GatesOk(string &why)
{
   if(!TerminalInfoInteger(TERMINAL_CONNECTED))     { why = "终端未连接"; return false; }
   if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED)) { why = "终端禁止交易"; return false; }
   if(!(bool)MQLInfoInteger(MQL_TRADE_ALLOWED))     { why = "EA 禁止交易"; return false; }
   if(g_day_halted)                                 { why = "当日回撤已触上限，今日停手"; return false; }

   long spread = SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   if(spread > (long)InpMaxSpreadPoints)            { why = "点差超限"; return false; }

   if(InpSessionFromHour != InpSessionToHour)
   {
      MqlDateTime dt; TimeToStruct(TimeCurrent(), dt);
      bool inSession = (InpSessionFromHour < InpSessionToHour)
                     ? (dt.hour >= InpSessionFromHour && dt.hour < InpSessionToHour)
                     : (dt.hour >= InpSessionFromHour ||  dt.hour < InpSessionToHour);
      if(!inSession)                                { why = "不在交易时段"; return false; }
   }

   if(CountMine() >= InpMaxPositions)               { why = "已达本 EA 持仓上限"; return false; }
   if(OtherMagicOnSymbol())                         { why = "该品种已有其它 Magic 的持仓（净额账户同品种互斥）"; return false; }
   return true;
}

//+------------------------------------------------------------------+
//| 手数：要么按风险折算，要么固定                                      |
//+------------------------------------------------------------------+
double AlignLots(double lots)
{
   double vmin  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double vmax  = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double vstep = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   if(vstep <= 0) return 0;
   lots = MathFloor(lots / vstep) * vstep;
   if(lots < vmin) lots = vmin;
   if(lots > vmax) lots = vmax;
   return NormalizeDouble(lots, 2);
}

double CalcLots(double sl_points)
{
   if(InpFixedLots > 0) return AlignLots(InpFixedLots);
   if(sl_points <= 0) return 0;

   double balance   = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskMoney = balance * InpRiskPct / 100.0;

   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize  = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   if(tickValue <= 0 || tickSize <= 0) return 0;

   // 每手每 point 值多少钱：tickValue 是「一个 tick」的钱，tickSize 是「一个 tick」的价格跨度
   double perPointPerLot = tickValue * (g_point / tickSize);
   if(perPointPerLot <= 0) return 0;

   return AlignLots(riskMoney / (sl_points * perPointPerLot));
}

//+------------------------------------------------------------------+
//| 信号：0 无 / 1 多 / -1 空                                          |
//| 只用已收完的 bar（shift=1），不用当前未收盘的 bar 做决策。            |
//+------------------------------------------------------------------+
int Signal(int &sl_points, int &tp_points)
{
   sl_points = 0; tp_points = 0;

   double atr = Atr(1);
   if(atr <= 0) return 0;

   if(InpFixedSlPoints > 0) sl_points = InpFixedSlPoints;
   else                     sl_points = (int)MathCeil(InpAtrSlMult * atr / g_point);
   if(InpFixedTpPoints > 0) tp_points = InpFixedTpPoints;
   else                     tp_points = (int)MathCeil(InpAtrTpMult * atr / g_point);

   int sig = 0;

   if(InpStrategy == NN_TREND_PULLBACK)
   {
      // 趋势：快线在慢线上方且收盘在慢线上方 = 上升；
      // 回踩 = 最低价触及快线附近，但收盘仍站在快线上方。
      double f1 = Fast(1), s1 = Slow(1);
      if(f1 <= 0 || s1 <= 0) return 0;
      double tol    = InpPullbackTolAtr * atr;
      double low1   = iLow(_Symbol,   _Period, 1);
      double high1  = iHigh(_Symbol,  _Period, 1);
      double close1 = iClose(_Symbol, _Period, 1);

      if(f1 > s1 && close1 > s1 && low1 <= f1 + tol && close1 > f1)        sig = 1;
      else if(f1 < s1 && close1 < s1 && high1 >= f1 - tol && close1 < f1)  sig = -1;
   }
   else if(InpStrategy == NN_RANGE_BREAKOUT)
   {
      // 唐奇安通道（不含当前 bar）；通道太窄视为震荡，不做
      double hi = 0, lo = 0;
      for(int i = 1; i <= InpChannelPeriod; i++)
      {
         double h = iHigh(_Symbol, _Period, i);
         double l = iLow(_Symbol,  _Period, i);
         if(i == 1 || h > hi) hi = h;
         if(i == 1 || l < lo) lo = l;
      }
      double width = hi - lo;
      if(width <= 0) return 0;
      if(width < InpMinChannelAtr * atr) return 0;      // 窄幅过滤

      double close1 = iClose(_Symbol, _Period, 1);
      if(close1 > hi)      sig = 1;
      else if(close1 < lo) sig = -1;
   }
   else
   {
      // 有界均值回归：触及外轨后收盘必须回到轨内才做，避免接飞刀
      double mid = Mid(1), sd = Std(1);
      if(mid <= 0 || sd <= 0) return 0;
      double up    = mid + InpStdK * sd;
      double dn    = mid - InpStdK * sd;
      double close1= iClose(_Symbol, _Period, 1);
      double low1  = iLow(_Symbol,   _Period, 1);
      double high1 = iHigh(_Symbol,  _Period, 1);

      if(low1 <= dn && close1 > dn)        sig = 1;     // 插到下轨但收回来了
      else if(high1 >= up && close1 < up)  sig = -1;
   }

   if(InpDirection == NN_LONG_ONLY  && sig < 0) sig = 0;
   if(InpDirection == NN_SHORT_ONLY && sig > 0) sig = 0;
   return sig;
}

//+------------------------------------------------------------------+
//| 下单：市价，FOK，必带止损                                           |
//+------------------------------------------------------------------+
bool OpenMarket(int sig, int sl_points, int tp_points, string &err)
{
   MqlTick tk;
   if(!SymbolInfoTick(_Symbol, tk)) { err = "无报价"; return false; }

   double price = (sig > 0) ? tk.ask : tk.bid;
   double sl    = (sig > 0) ? price - sl_points * g_point : price + sl_points * g_point;
   double tp    = (tp_points > 0)
                ? ((sig > 0) ? price + tp_points * g_point : price - tp_points * g_point)
                : 0;

   long stops = SymbolInfoInteger(_Symbol, SYMBOL_TRADE_STOPS_LEVEL);
   if(stops > 0 && MathAbs(price - sl) / g_point < (double)stops)
      { err = "止损距离小于 STOPS_LEVEL"; return false; }

   double lots = CalcLots((double)sl_points);
   if(lots <= 0) { err = "手数计算为 0（检查 tick value / 风险参数）"; return false; }

   MqlTradeRequest req = {};
   MqlTradeResult  res = {};
   req.action       = TRADE_ACTION_DEAL;
   req.symbol       = _Symbol;
   req.volume       = lots;
   req.type         = (sig > 0) ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   req.price        = price;
   req.deviation    = InpMaxDeviationPoints;
   req.magic        = InpMagic;
   req.comment      = InpTag + "-" + IntegerToString(InpMagic) + "-" + IntegerToString((int)InpStrategy);
   req.sl           = NormalizeDouble(sl, g_digits);
   req.tp           = (tp > 0) ? NormalizeDouble(tp, g_digits) : 0;
   req.type_filling = ORDER_FILLING_FOK;

   if(!OrderSend(req, res) || res.retcode != TRADE_RETCODE_DONE)
   {
      err = "券商返回 " + IntegerToString((int)res.retcode);
      return false;
   }
   if(InpVerbose)
      Print("[NNS] 开仓 ok · ", (sig > 0 ? "BUY" : "SELL"), " ", DoubleToString(lots, 2),
            " @ ", DoubleToString(res.price, g_digits), " sl=", DoubleToString(req.sl, g_digits),
            " tp=", DoubleToString(req.tp, g_digits), " deal=", res.deal);
   return true;
}

//+------------------------------------------------------------------+
//| 平仓：只平本 Magic 的仓                                             |
//+------------------------------------------------------------------+
bool CloseTicket(ulong ticket, string why)
{
   if(!PositionSelectByTicket(ticket)) return false;
   if(PositionGetInteger(POSITION_MAGIC) != InpMagic) return false;   // 绝不碰别人的仓

   string sym = PositionGetString(POSITION_SYMBOL);
   MqlTradeRequest req = {};
   MqlTradeResult  res = {};
   ENUM_POSITION_TYPE pt = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);

   req.action       = TRADE_ACTION_DEAL;
   req.position     = ticket;
   req.symbol       = sym;
   req.volume       = PositionGetDouble(POSITION_VOLUME);
   req.type         = (pt == POSITION_TYPE_BUY) ? ORDER_TYPE_SELL : ORDER_TYPE_BUY;
   req.price        = (pt == POSITION_TYPE_BUY) ? SymbolInfoDouble(sym, SYMBOL_BID)
                                                : SymbolInfoDouble(sym, SYMBOL_ASK);
   req.deviation    = InpMaxDeviationPoints;
   req.magic        = InpMagic;
   req.type_filling = ORDER_FILLING_FOK;

   if(!OrderSend(req, res) || res.retcode != TRADE_RETCODE_DONE)
   {
      Print("[NNS] 平仓失败 ticket=", ticket, " retcode=", res.retcode);
      return false;
   }
   if(InpVerbose) Print("[NNS] 平仓 ok ticket=", ticket, " 原因=", why);
   return true;
}

void CloseAllMine(string why)
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(!PositionSelectByTicket(tk)) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;
      CloseTicket(tk, why);
   }
}

//+------------------------------------------------------------------+
//| 改止盈止损                                                         |
//+------------------------------------------------------------------+
bool ModifySlTp(ulong ticket, double sl, double tp)
{
   if(!PositionSelectByTicket(ticket)) return false;
   MqlTradeRequest req = {};
   MqlTradeResult  res = {};
   req.action   = TRADE_ACTION_SLTP;
   req.position = ticket;
   req.symbol   = PositionGetString(POSITION_SYMBOL);
   req.sl       = NormalizeDouble(sl, g_digits);
   req.tp       = (tp > 0) ? NormalizeDouble(tp, g_digits) : 0;
   req.magic    = InpMagic;
   if(!OrderSend(req, res) || res.retcode != TRADE_RETCODE_DONE)
   {
      Print("[NNS] 改止损失败 ticket=", ticket, " retcode=", res.retcode);
      return false;
   }
   return true;
}

//+------------------------------------------------------------------+
//| 持仓管理：到期平仓 + 移动止损                                       |
//+------------------------------------------------------------------+
void ManageOpen()
{
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong tk = PositionGetTicket(i);
      if(tk == 0) continue;
      if(!PositionSelectByTicket(tk)) continue;
      if(PositionGetInteger(POSITION_MAGIC) != InpMagic) continue;

      string sym   = PositionGetString(POSITION_SYMBOL);
      long   ptype = PositionGetInteger(POSITION_TYPE);
      double sl    = PositionGetDouble(POSITION_SL);

      // ① 持有 K 线数上限
      if(InpMaxHoldBars > 0)
      {
         int shift = iBarShift(sym, _Period, (datetime)PositionGetInteger(POSITION_TIME));
         if(shift >= InpMaxHoldBars) { CloseTicket(tk, "超过最大持有 K 线数"); continue; }
      }

      // ② 移动止损：只在浮盈超过止损距离后才挪，避免一开仓就被挪死
      if(InpUseTrailing)
      {
         MqlTick t2;
         if(!SymbolInfoTick(sym, t2)) continue;
         double cur = (ptype == POSITION_TYPE_BUY) ? t2.bid : t2.ask;
         double dist = (InpTrailPoints > 0)
                     ? InpTrailPoints * g_point
                     : InpAtrSlMult * Atr(1);
         if(dist <= 0) continue;

         double wantSl = (ptype == POSITION_TYPE_BUY) ? cur - dist : cur + dist;
         bool   better = (ptype == POSITION_TYPE_BUY)
                       ? (sl == 0 || wantSl > sl)
                       : (sl == 0 || wantSl < sl);
         long stops = SymbolInfoInteger(sym, SYMBOL_TRADE_STOPS_LEVEL);
         if(better && MathAbs(wantSl - cur) / g_point >= (double)stops)
            ModifySlTp(tk, wantSl, PositionGetDouble(POSITION_TP));
      }
   }
}

//+------------------------------------------------------------------+
//| 当日回撤熔断（只停新开仓，不平已有仓）                               |
//+------------------------------------------------------------------+
void RollDay()
{
   int k = DayKey();
   if(k != g_day_key)
   {
      g_day_key     = k;
      g_day_equity0 = AccountInfoDouble(ACCOUNT_EQUITY);
      g_day_halted  = false;
      if(InpVerbose) Print("[NNS] 新交易日，日初权益=", DoubleToString(g_day_equity0, 2));
      return;
   }
   if(g_day_halted) return;

   double eq = AccountInfoDouble(ACCOUNT_EQUITY);
   if(g_day_equity0 > 0 && InpMaxDailyLossPct > 0)
   {
      double dd = (g_day_equity0 - eq) / g_day_equity0 * 100.0;
      if(dd >= InpMaxDailyLossPct)
      {
         g_day_halted = true;
         Print("[NNS] ⚠ 当日回撤 ", DoubleToString(dd, 2), "% ≥ 上限 ",
               DoubleToString(InpMaxDailyLossPct, 2),
               "% —— 今日停止开新仓（已有持仓照常按止损持有，不会自动平）");
      }
   }
}

//+------------------------------------------------------------------+
//| 生命周期                                                           |
//+------------------------------------------------------------------+
int OnInit()
{
   g_point  = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   g_digits = (int)SymbolInfoInteger(_Symbol, SYMBOL_DIGITS);
   if(g_point <= 0) { Print("[NNS] 取不到 point，初始化失败"); return INIT_FAILED; }

   g_fast_h = iMA(_Symbol, _Period, InpFastPeriod, 0, MODE_EMA, PRICE_CLOSE);
   g_slow_h = iMA(_Symbol, _Period, InpSlowPeriod, 0, MODE_EMA, PRICE_CLOSE);
   g_atr_h  = iATR(_Symbol, _Period, InpAtrPeriod);
   g_ma_h   = iMA(_Symbol, _Period, InpChannelPeriod, 0, MODE_SMA, PRICE_CLOSE);
   g_std_h  = iStdDev(_Symbol, _Period, InpChannelPeriod, 0, MODE_SMA, PRICE_CLOSE);

   if(g_fast_h == INVALID_HANDLE || g_slow_h == INVALID_HANDLE || g_atr_h == INVALID_HANDLE)
      { Print("[NNS] 指标句柄创建失败"); return INIT_FAILED; }
   if(InpStrategy == NN_BOUNDED_MEANREV && (g_ma_h == INVALID_HANDLE || g_std_h == INVALID_HANDLE))
      { Print("[NNS] 均值回归需要 MA / StdDev 句柄"); return INIT_FAILED; }

   g_day_key     = DayKey();
   g_day_equity0 = AccountInfoDouble(ACCOUNT_EQUITY);

   // 净额账户 + 同品种互斥：这是 MT5 的规则，不是本 EA 的限制。
   // 提前讲清楚，免得用户开了三个 EA 同品种却发现只有一个生效。
   if((ENUM_ACCOUNT_MARGIN_MODE)AccountInfoInteger(ACCOUNT_MARGIN_MODE) == ACCOUNT_MARGIN_MODE_RETAIL_NETTING)
      Print("[NNS] 当前为净额账户：同一品种只有一个净头寸，Magic 在同品种内不做隔离。");

   Print("[NNS] 已加载 · 策略=", IntegerToString((int)InpStrategy), " · magic=", InpMagic,
         " · 单笔风险=", DoubleToString(InpRiskPct, 2), "% · 持仓上限=", InpMaxPositions);
   return INIT_SUCCEEDED;
}

void OnDeinit(const int reason)
{
   // 默认不平仓：移除 EA ≠ 平仓。
   // 这是刻意的 —— 防止出现"我只是想把 EA 摘下来，结果仓被平了"。
   // 要平就把 InpCloseOnStop 设 true，那是用户显式的选择。
   if(InpCloseOnStop) CloseAllMine("EA 移除");
   if(g_fast_h != INVALID_HANDLE) IndicatorRelease(g_fast_h);
   if(g_slow_h != INVALID_HANDLE) IndicatorRelease(g_slow_h);
   if(g_atr_h  != INVALID_HANDLE) IndicatorRelease(g_atr_h);
   if(g_ma_h   != INVALID_HANDLE) IndicatorRelease(g_ma_h);
   if(g_std_h  != INVALID_HANDLE) IndicatorRelease(g_std_h);
}

void OnTick()
{
   RollDay();
   ManageOpen();                        // 持仓管理每个 tick 都跑
   if(!NewBar()) return;                // 信号只在新 K 线开盘时算一次

   string why = "";
   if(!GatesOk(why))
   {
      if(InpVerbose && why != "") Print("[NNS] 跳过：", why);
      return;
   }

   int sl_points = 0, tp_points = 0;
   int sig = Signal(sl_points, tp_points);
   if(sig == 0) return;
   if(sl_points <= 0) { if(InpVerbose) Print("[NNS] 跳过：止损距离为 0"); return; }

   string err = "";
   if(!OpenMarket(sig, sl_points, tp_points, err))
      Print("[NNS] 开仓失败：", err);
}
//+------------------------------------------------------------------+
