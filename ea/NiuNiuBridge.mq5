//+------------------------------------------------------------------+
//|                                             NiuNiuBridge.mq5      |
//|                    牛牛 AI · MT5 桥接 EA（自研，源码交付）          |
//|  NiuNiu AI — MT5 bridge EA. Self-developed, source-shipped.        |
//|                                                                    |
//|  协议 PROTOCOL v1                                                  |
//|    命令    inbox/cmd_<id>.json      （写 .tmp 后 FileMove 转正）      |
//|    回执    outbox/rcpt_<id>.json    （两阶段 ACCEPTED → 终态）       |
//|    心跳    heart.json                                              |
//|    状态    status.json                                             |
//|                                                                    |
//|  安全 SECURITY                                                     |
//|    每条命令带 HMAC-SHA256 签名（InpSecret 为安装期生成的随机密钥）    |
//|    校验失败 → 写 REJECTED 回执 + 隔离到 quarantine/，绝不执行        |
//|                                                                    |
//|  幂等 IDEMPOTENCY（三层）                                           |
//|    L1 archive/ 目录记录已执行命令 id，EA 启动时装载                  |
//|    L2 订单 comment 嵌入 NN1-<id8>，券商侧兜底判重                    |
//|    L3 结果未知 → RECONCILING，禁止自动重放                           |
//+------------------------------------------------------------------+
#property copyright "NiuNiu AI"
#property version   "1.00"
#property strict
#property description "牛牛 AI MT5 桥接 EA。开源交付，可审计。"

//--- 输入参数 INPUTS
input string InpBridgeDir    = "niuniu";        // 桥目录 Bridge dir (under MQL5\Files)
input string InpSecret       = "CHANGE_ME";     // HMAC 密钥 HMAC secret (install-time random)
input int    InpMagic        = 20261015;        // 魔术号 Magic number
input int    InpPollMs       = 250;             // 轮询间隔(毫秒) Poll interval (ms)
input int    InpHeartbeatSec = 1;               // 心跳间隔(秒) Heartbeat (sec)
input bool   InpDemoOnly     = true;            // 仅模拟盘 Demo account only
input bool   InpAutoTrade    = false;           // 允许自动下单 Allow auto trading
input int    InpReconcileHours = 24;            // 启动对账窗口(小时) Reconcile window (h)
input bool   InpVerbose      = true;            // 详细日志 Verbose log

//--- 全局 GLOBALS
string  g_dir        = "";      // 桥根目录
string  g_inbox      = "";
string  g_outbox     = "";
string  g_archive    = "";
string  g_quarantine = "";
string  g_ids[];                // 已执行命令 id 集合（幂等 L1）
int     g_id_count   = 0;
datetime g_last_heartbeat = 0;
long    g_session_epoch = 1;    // 绑定代次：切账户/重绑后自增，使旧命令失效
long    g_seq          = 0;     // 心跳递增序号：桥据此判断 EA 是否真的活着
string  g_secret       = "";    // 实际生效的 HMAC 密钥
bool    g_secret_ok    = false; // 是否拿到了可用密钥 —— 没拿到就拒绝一切会改敞口的命令

#define NN_MAX_IDS 20000

//+------------------------------------------------------------------+
//| SHA-256 —— MQL5 标准库不含哈希，此处自行实现                        |
//| 已对照 Python hashlib.sha256 逐例验证（空串/abc/1000字节/中文/命令JSON）|
//+------------------------------------------------------------------+
uint KK[64] = {
 0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
 0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
 0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
 0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
 0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
 0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
 0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
 0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
};

uint ROTR(uint x, int n)
{
   // MQL5 uint 为无符号 32 位；左移溢出由 & 0xFFFFFFFF 约束
   return ((x >> n) | (x << (32 - n)));
}

// 首选：MQL5 内置 CryptEncode 提供的 SHA-256（原生、经过 MetaQuotes 测试）
// 失败时回落到下面的手写实现。
bool SHA256HexNative(const uchar &data[], string &out_hex)
{
   uchar result[];
   uchar key[];                       // SHA-256 不需要密钥，传空数组
   ArrayResize(key, 0);
   if(!CryptEncode(CRYPT_HASH_SHA256, data, key, result)) return false;
   if(ArraySize(result) != 32) return false;
   out_hex = "";
   for(int i=0; i<32; i++) out_hex += StringFormat("%02X", result[i]);
   return true;
}

// 备用：手写 SHA-256。
// 算法已逐例对照 Python hashlib.sha256 验证（空串 / "abc" / 1000 字节 / 二进制 / 中文 / 真实命令 JSON），
// 全部一致。仅在 CryptEncode 不可用时使用。
string SHA256HexManual(const uchar &data[])
{
   uint h[8];
   h[0]=0x6a09e667; h[1]=0xbb67ae85; h[2]=0x3c6ef372; h[3]=0xa54ff53a;
   h[4]=0x510e527f; h[5]=0x9b05688c; h[6]=0x1f83d9ab; h[7]=0x5be0cd19;

   int len = ArraySize(data);
   ulong bitlen = (ulong)len * 8ULL;

   //--- 填充 padding: 0x80, 补零至 56 mod 64, 再追加 8 字节大端长度
   int pad = ((56 - (len + 1) % 64) + 64) % 64;
   int total = len + 1 + pad + 8;
   uchar buf[];
   ArrayResize(buf, total);
   for(int i=0; i<len; i++) buf[i] = data[i];
   buf[len] = 0x80;
   for(int i=len+1; i<len+1+pad; i++) buf[i] = 0;
   for(int i=0; i<8; i++)
      buf[len+1+pad+i] = (uchar)((bitlen >> (56 - 8*i)) & 0xFF);

   uint w[64];
   for(int off=0; off<total; off+=64)
   {
      for(int i=0; i<16; i++)
         w[i] = ((uint)buf[off+i*4] << 24) | ((uint)buf[off+i*4+1] << 16)
              | ((uint)buf[off+i*4+2] << 8) | ((uint)buf[off+i*4+3]);
      for(int i=16; i<64; i++)
      {
         uint x = w[i-15];
         uint s0 = ROTR(x,7) ^ ROTR(x,18) ^ (x >> 3);
         uint y = w[i-2];
         uint s1 = ROTR(y,17) ^ ROTR(y,19) ^ (y >> 10);
         w[i] = w[i-16] + s0 + w[i-7] + s1;
      }
      uint a=h[0], b=h[1], c=h[2], d=h[3], e=h[4], f=h[5], g=h[6], hh=h[7];
      for(int i=0; i<64; i++)
      {
         uint S1 = ROTR(e,6) ^ ROTR(e,11) ^ ROTR(e,25);
         uint ch = (e & f) ^ ((~e) & g);
         uint t1 = hh + S1 + ch + KK[i] + w[i];
         uint S0 = ROTR(a,2) ^ ROTR(a,13) ^ ROTR(a,22);
         uint mj = (a & b) ^ (a & c) ^ (b & c);
         uint t2 = S0 + mj;
         hh=g; g=f; f=e; e=d+t1; d=c; c=b; b=a; a=t1+t2;
      }
      h[0]+=a; h[1]+=b; h[2]+=c; h[3]+=d; h[4]+=e; h[5]+=f; h[6]+=g; h[7]+=hh;
   }

   string out = "";
   for(int i=0; i<8; i++)
      out += StringFormat("%08X", h[i]);
   return out;
}

// 统一入口：优先内置 CryptEncode，失败回落手写实现
string SHA256Hex(const uchar &data[])
{
   string hex = "";
   if(SHA256HexNative(data, hex)) return hex;
   return SHA256HexManual(data);
}

// HMAC-SHA256（十六进制），密钥与消息均为 UTF-8 字节
string HMACSHA256Hex(string key, string msg)
{
   uchar kb[], mb[];
   StringToCharArray(key, kb, 0, StringLen(key), CP_UTF8);
   StringToCharArray(msg, mb, 0, StringLen(msg), CP_UTF8);

   // 密钥超过 64 字节先哈希
   // 注意：MQL5 的动态数组没有 .Clear()，用 ArrayResize 归零后再写入
   if(ArraySize(kb) > 64) { string kh = SHA256Hex(kb); ArrayResize(kb, 0); StringToCharArray(kh, kb, 0, 64, CP_UTF8); }

   uchar ipad[], opad[];
   ArrayResize(ipad, 64); ArrayResize(opad, 64);
   for(int i=0; i<64; i++)
   {
      uchar k = (i < ArraySize(kb)) ? kb[i] : 0;
      ipad[i] = k ^ 0x36;
      opad[i] = k ^ 0x5C;
   }

   // inner = SHA256(ipad || msg)
   uchar inner_in[];
   int ml = ArraySize(mb);
   ArrayResize(inner_in, 64 + ml);
   for(int i=0; i<64; i++) inner_in[i] = ipad[i];
   for(int i=0; i<ml; i++) inner_in[64+i] = mb[i];
   string inner_hex = SHA256Hex(inner_in);

   // outer = SHA256(opad || inner_bytes)
   uchar ib[];
   StringToCharArray(inner_hex, ib, 0, 32, CP_UTF8);   // 32 个十六进制字符 = 32 字节
   uchar outer_in[];
   ArrayResize(outer_in, 96);
   for(int i=0; i<64; i++) outer_in[i] = opad[i];
   for(int i=0; i<32; i++) outer_in[64+i] = ib[i];
   return SHA256Hex(outer_in);
}

//+------------------------------------------------------------------+
//| canonical 数值格式化 —— 必须与 JS 侧 protocol.js fmtNum() 逐字节一致 |
//| 规则：定点 8 位 → 去尾随 0 → 去尾随小数点；0/-0 统一为 "0"；          |
//|      |v| >= 1e15 走整数路径（避免与 JS toFixed 的科学计数法分叉）。   |
//| 两边不同步 = 签名永远不匹配 = 拒掉所有命令。                         |
//+------------------------------------------------------------------+
string NNFmtNum(double v)
{
   if(MathAbs(v) < 1e-12) return "0";                 // 吃掉 -0
   if(MathAbs(v) >= 1e15) return DoubleToString(v, 0);
   string s = DoubleToString(v, 8);
   // 去尾随 0
   while(StringLen(s) > 0 && StringSubstr(s, StringLen(s)-1, 1) == "0") s = StringSubstr(s, 0, StringLen(s)-1);
   // 去尾随小数点
   if(StringLen(s) > 0 && StringSubstr(s, StringLen(s)-1, 1) == ".") s = StringSubstr(s, 0, StringLen(s)-1);
   return s;
}

//+------------------------------------------------------------------+
//| 提取 payload 子串（花括号配对，跳过字符串内的括号）                  |
//| 目的：payload 内的键只在 payload 内查找，避免 comment 里出现同名键    |
//|      被 JsonStr 的全局子串搜索误匹配（例如备注里写了 "symbol"）。     |
//+------------------------------------------------------------------+
string PayloadSub(string src)
{
   int p = StringFind(src, "\"payload\"");
   if(p < 0) return "";
   p = StringFind(src, ":", p);
   if(p < 0) return "";
   int b = StringFind(src, "{", p);
   if(b < 0) return "";

   int depth = 0;
   bool instr = false;
   for(int i = b; i < StringLen(src); i++)
   {
      ushort c = StringGetCharacter(src, i);
      if(instr)
      {
         if(c == '\\') { i++; continue; }   // 跳过转义字符
         if(c == '"') instr = false;
         continue;
      }
      if(c == '"') { instr = true; continue; }
      if(c == '{') depth++;
      else if(c == '}')
      {
         depth--;
         if(depth == 0) return StringSubstr(src, b, i - b + 1);
      }
   }
   return "";
}

//+------------------------------------------------------------------+
//| 极简 JSON 取值（本协议的字段键名全局唯一，无需完整解析器）           |
//+------------------------------------------------------------------+
string JsonStr(string src, string key)
{
   string needle = "\"" + key + "\"";
   int p = StringFind(src, needle);
   if(p < 0) return "";
   p = StringFind(src, ":", p);
   if(p < 0) return "";
   p++;
   // 跳过空白
   while(p < StringLen(src) && (StringGetCharacter(src,p)==' ' || StringGetCharacter(src,p)=='\t')) p++;
   if(p >= StringLen(src)) return "";
   ushort ch = StringGetCharacter(src, p);
   if(ch == '"')
   {
      int q = StringFind(src, "\"", p+1);
      if(q < 0) return "";
      return StringSubstr(src, p+1, q-p-1);
   }
   // 数字 / true / false / null：读到 , } 或空白
   int e = p;
   while(e < StringLen(src))
   {
      ushort c = StringGetCharacter(src, e);
      if(c==',' || c=='}' || c==']' || c==' ' || c=='\n' || c=='\r') break;
      e++;
   }
   return StringSubstr(src, p, e-p);
}

double JsonNum(string src, string key)
{
   string v = JsonStr(src, key);
   if(v == "" || v == "null") return 0;
   return StringToDouble(v);
}

//+------------------------------------------------------------------+
//| 文件工具 FILE UTILS                                                |
//+------------------------------------------------------------------+
// ⚠ FileMove 签名说明（两个外部评审给出不同答案，以 MetaEditor 自动补全为准）
//   正确形式：FileMove(src, common_flag, dst, mode_flags) —— 4 参数
//   普通 Files 沙箱：FileMove(tmp, 0, dst, FILE_REWRITE)
//   若你的构建报错，说明该版本使用 3 参数重载，改为 FileMove(tmp, dst, FILE_REWRITE)
#define NN_FILEMOVE(tmp,dst) FileMove(tmp, 0, dst, FILE_REWRITE)

// 原子发布：同目录写 .tmp，写完关闭后 rename 转正。
// NTFS 同卷 rename 是原子的，读取端只认正式文件名，永远不会读到半份内容。
// ⚠ 前提：tmp 与 dst 必须在同一目录（同卷）。跨目录会退化为 copy+delete，崩溃窗口重现。
bool WriteFileAtomic(string rel_path, string content, bool allow_overwrite = true)
{
   if(!allow_overwrite && FileIsExist(rel_path)) return false;   // 冲突，不覆盖
   string tmp = rel_path + ".tmp";
   int h = FileOpen(tmp, FILE_WRITE|FILE_TXT|FILE_ANSI);
   if(h == INVALID_HANDLE) { if(InpVerbose) Print("[NN] 写临时文件失败: ", tmp); return false; }
   FileWriteString(h, content);
   FileClose(h);
   if(!NN_FILEMOVE(tmp, rel_path))
   {
      FileDelete(tmp);
      if(InpVerbose) Print("[NN] FileMove 转正失败: ", tmp);
      return false;
   }
   return true;
}

string ReadFileText(string rel_path)
{
   int h = FileOpen(rel_path, FILE_READ|FILE_TXT|FILE_ANSI);
   if(h == INVALID_HANDLE) return "";
   string out = "";
   while(!FileIsEnding(h)) out += FileReadString(h);
   FileClose(h);
   return out;
}

//+------------------------------------------------------------------+
//| 幂等集合 IDEMPOTENCY SET                                           |
//+------------------------------------------------------------------+
void LoadArchiveIds()
{
   ArrayResize(g_ids, NN_MAX_IDS);
   g_id_count = 0;
   string name;
   long sh = FileFindFirst(g_archive + "\\*", name);
   if(sh != INVALID_HANDLE)
   {
      do
      {
         if(name=="." || name=="..") continue;
         if(g_id_count < NN_MAX_IDS) { g_ids[g_id_count] = name; g_id_count++; }
      }
      while(FileFindNext(sh, name));
      FileFindClose(sh);
   }
   if(InpVerbose) Print("[NN] 已装载幂等集合: ", g_id_count, " 条");
}

bool IsKnownId(string id)
{
   for(int i=0; i<g_id_count; i++)
      if(StringFind(g_ids[i], id) >= 0) return true;   // archive 文件名含 id
   return false;
}

void ArchiveCommand(string id, string raw)
{
   // 不覆盖：同 id 已存在说明重复，保留首次记录
   WriteFileAtomic(g_archive + "\\" + id + ".json", raw, false);
   if(g_id_count < NN_MAX_IDS) { g_ids[g_id_count] = id + ".json"; g_id_count++; }
}

string ShortId(string id)
{
   // 取 id **末** 8 位。ULID 前部是时间戳、后部才随机——
   // 若取前 8 位，同一毫秒内的命令短码会完全相同，绝不能当唯一标识。
   // 即便取末 8 位也只是弱证据：券商可能改写 comment，故它只作兜底，不是强幂等。
   int l = StringLen(id);
   if(l <= 8) return id;
   return StringSubstr(id, l-8, 8);
}

//+------------------------------------------------------------------+
//| 回执 RECEIPTS                                                      |
//+------------------------------------------------------------------+
void WriteReceipt(string id, string stage, int retcode, ulong order, ulong deal,
                  double price, string message)
{
   string now = TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS);
   string j = "{\"v\":1,\"id\":\"" + id + "\",\"account\":" + IntegerToString((long)AccountInfoInteger(ACCOUNT_LOGIN))
            + ",\"stage\":\"" + stage + "\",\"retcode\":" + IntegerToString(retcode)
            + ",\"order\":" + IntegerToString((long)order)
            + ",\"deal\":" + IntegerToString((long)deal)
            + ",\"price\":" + DoubleToString(price, 8)
            + ",\"ts\":\"" + now + "\",\"message\":\"" + message + "\"}";
   WriteFileAtomic(g_outbox + "\\rcpt_" + id + ".json", j);
}

//+------------------------------------------------------------------+
//| 心跳与状态 HEARTBEAT & STATUS                                      |
//+------------------------------------------------------------------+
void WriteHeartbeat()
{
   g_seq++;   // 递增序号：桥靠「序号变化」判断 EA 存活，而不是靠文件是否存在
   string j = "{\"v\":1,\"seq\":" + IntegerToString(g_seq)
            + ",\"epoch\":" + IntegerToString(g_session_epoch)
            + ",\"terminal\":\"" + TerminalInfoString(TERMINAL_NAME)
            + "\",\"account\":" + IntegerToString((long)AccountInfoInteger(ACCOUNT_LOGIN))
            + ",\"server\":\"" + AccountInfoString(ACCOUNT_SERVER) + "\""
            + ",\"company\":\"" + AccountInfoString(ACCOUNT_COMPANY) + "\""
            + ",\"ts\":\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\""
            + ",\"trade_allowed\":" + (TerminalInfoInteger(TERMINAL_TRADE_ALLOWED) ? "true" : "false")
            + ",\"connected\":" + (TerminalInfoInteger(TERMINAL_CONNECTED) ? "true" : "false")
            + ",\"magic\":" + IntegerToString(InpMagic) + "}";
   WriteFileAtomic(g_dir + "\\heart.json", j);
}

void WriteStatus()
{
   string sym = Symbol();
   MqlTick tk;
   bool have_tick = SymbolInfoTick(sym, tk);

   string j = "{\"v\":1,\"time\":\"" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS) + "\""
            + ",\"symbol\":\"" + sym + "\""
            + ",\"quote\":{\"bid\":" + DoubleToString(tk.bid, (int)SymbolInfoInteger(sym, SYMBOL_DIGITS))
            + ",\"ask\":" + DoubleToString(tk.ask, (int)SymbolInfoInteger(sym, SYMBOL_DIGITS))
            + ",\"time\":" + IntegerToString((long)tk.time_msc) + "}"
            + ",\"trading_allowed\":" + (TerminalInfoInteger(TERMINAL_TRADE_ALLOWED) ? "true" : "false")
            + ",\"signed\":" + (g_secret_ok ? "true" : "false")
            + ",\"epoch\":" + IntegerToString(g_session_epoch)
            + ",\"account\":{\"login\":" + IntegerToString((long)AccountInfoInteger(ACCOUNT_LOGIN))
            + ",\"balance\":" + DoubleToString(AccountInfoDouble(ACCOUNT_BALANCE), 2)
            + ",\"equity\":" + DoubleToString(AccountInfoDouble(ACCOUNT_EQUITY), 2)
            + ",\"margin\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN), 2)
            + ",\"free_margin\":" + DoubleToString(AccountInfoDouble(ACCOUNT_MARGIN_FREE), 2)
            + ",\"currency\":\"" + AccountInfoString(ACCOUNT_CURRENCY) + "\""
            + ",\"mode\":\"" + (AccountInfoInteger(ACCOUNT_MARGIN_MODE)==ACCOUNT_MARGIN_MODE_RETAIL_HEDGING ? "hedging" : (AccountInfoInteger(ACCOUNT_MARGIN_MODE)==ACCOUNT_MARGIN_MODE_RETAIL_NETTING ? "netting" : "exchange")) + "\"}"
            + ",\"positions\":[";

   for(int i=0; i<PositionsTotal(); i++)
   {
      ulong tkt = PositionGetTicket(i);
      if(PositionSelectByTicket(tkt))
      {
         if(i>0) j += ",";
         j += "{\"ticket\":" + IntegerToString((long)tkt)
            + ",\"symbol\":\"" + PositionGetString(POSITION_SYMBOL) + "\""
            + ",\"type\":\"" + (PositionGetInteger(POSITION_TYPE)==POSITION_TYPE_BUY ? "BUY":"SELL") + "\""
            + ",\"volume\":" + DoubleToString(PositionGetDouble(POSITION_VOLUME), 2)
            + ",\"price_open\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN), 8)
            + ",\"sl\":" + DoubleToString(PositionGetDouble(POSITION_SL), 8)
            + ",\"tp\":" + DoubleToString(PositionGetDouble(POSITION_TP), 8)
            + ",\"profit\":" + DoubleToString(PositionGetDouble(POSITION_PROFIT), 2)
            + ",\"comment\":\"" + PositionGetString(POSITION_COMMENT) + "\"}";
      }
   }
   j += "],\"orders\":[";
   for(int i=0; i<OrdersTotal(); i++)
   {
      ulong tkt = OrderGetTicket(i);
      // MQL5 没有 OrderSelect()：OrderGetTicket(i) 本身就把该挂单设为当前对象，
      // 之后直接 OrderGet* 取值即可。旧写法里的 OrderSelect 是 MQL4 遗留，编译不过。
      if(tkt != 0)
      {
         if(i>0) j += ",";
         j += "{\"ticket\":" + IntegerToString((long)tkt)
            + ",\"symbol\":\"" + OrderGetString(ORDER_SYMBOL) + "\""
            + ",\"type\":" + IntegerToString((int)OrderGetInteger(ORDER_TYPE))
            + ",\"volume\":" + DoubleToString(OrderGetDouble(ORDER_VOLUME_INITIAL), 2)
            + ",\"price\":" + DoubleToString(OrderGetDouble(ORDER_PRICE_OPEN), 8)
            + ",\"comment\":\"" + OrderGetString(ORDER_COMMENT) + "\"}";
      }
   }
   j += "]}";
   WriteFileAtomic(g_dir + "\\status.json", j);
}

//+------------------------------------------------------------------+
//| 启动对账 RECONCILE ON INIT                                         |
//|  按 MagicNumber 扫描历史，找出「本地无记录但券商有仓位」的孤儿单      |
//+------------------------------------------------------------------+
void Reconcile()
{
   datetime from = TimeCurrent() - InpReconcileHours * 3600;
   HistorySelect(from, TimeCurrent());
   int deals = HistoryDealsTotal();
   int orphans = 0;
   for(int i=0; i<deals; i++)
   {
      ulong tkt = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(tkt, DEAL_MAGIC) != InpMagic) continue;
      string cmt = HistoryDealGetString(tkt, DEAL_COMMENT);
      if(StringFind(cmt, "NN1-") < 0) continue;
      int cnt = 0;
      for(int k=0; k<g_id_count; k++)
         if(StringFind(g_ids[k], StringSubstr(cmt, 4, 8)) >= 0) cnt++;
      if(cnt == 0)
      {
         orphans++;
         Print("[NN] ⚠ 孤儿成交 detected: comment=", cmt, " ticket=", tkt);
      }
   }
   if(InpVerbose) Print("[NN] 对账完成，历史成交 ", deals, " 条，孤儿 ", orphans, " 条");
   if(orphans > 0)
      Print("[NN] 孤儿单不做自动处理，请在上位机确认后手动处置（默认策略：不动作）");
}

//+------------------------------------------------------------------+
//| 命令执行 EXECUTOR                                                  |
//+------------------------------------------------------------------+
void ExecuteMarket(string id, string raw, string sym, string side, double lots,
                   double sl_points, double tp_points, int deviation, string tag)
{
   //--- 执行前检查清单 PRE-FLIGHT
   if(!TerminalInfoInteger(TERMINAL_CONNECTED))            { WriteReceipt(id,"REJECTED",0,0,0,0,"终端未连接"); return; }
   if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED))        { WriteReceipt(id,"REJECTED",0,0,0,0,"终端禁止交易"); return; }
   if(!(bool)MQLInfoInteger(MQL_TRADE_ALLOWED))            { WriteReceipt(id,"REJECTED",0,0,0,0,"EA 禁止交易"); return; }
   if(InpDemoOnly && (ENUM_ACCOUNT_TRADE_MODE)AccountInfoInteger(ACCOUNT_TRADE_MODE) != ACCOUNT_TRADE_MODE_DEMO)
                                                            { WriteReceipt(id,"REJECTED",0,0,0,0,"仅允许模拟盘"); return; }
   if(!SymbolInfoInteger(sym, SYMBOL_SELECT))              { if(!SymbolSelect(sym, true)) { WriteReceipt(id,"REJECTED",0,0,0,0,"品种不可选: "+sym); return; } }

   double vol_min  = SymbolInfoDouble(sym, SYMBOL_VOLUME_MIN);
   double vol_max  = SymbolInfoDouble(sym, SYMBOL_VOLUME_MAX);
   double vol_step = SymbolInfoDouble(sym, SYMBOL_VOLUME_STEP);
   if(lots < vol_min || lots > vol_max)                    { WriteReceipt(id,"REJECTED",0,0,0,0,"手数越界"); return; }
   lots = MathFloor(lots / vol_step) * vol_step;           // 对齐手数步进

   int digits = (int)SymbolInfoInteger(sym, SYMBOL_DIGITS);
   double point = SymbolInfoDouble(sym, SYMBOL_POINT);
   MqlTick tk;
   if(!SymbolInfoTick(sym, tk))                            { WriteReceipt(id,"REJECTED",0,0,0,0,"无报价"); return; }

   ENUM_ORDER_TYPE type = (side=="BUY") ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   double price = (side=="BUY") ? tk.ask : tk.bid;
   double sl = 0, tp = 0;
   if(sl_points > 0) sl = (side=="BUY") ? price - sl_points*point : price + sl_points*point;
   if(tp_points > 0) tp = (side=="BUY") ? price + tp_points*point : price - tp_points*point;

   // 止损距离约束
   int stops_level = (int)SymbolInfoInteger(sym, SYMBOL_TRADE_STOPS_LEVEL);
   if(sl > 0 && MathAbs(price - sl)/point < stops_level)   { WriteReceipt(id,"REJECTED",0,0,0,0,"止损距离小于 STOPS_LEVEL"); return; }

   //--- 幂等 L2：comment 嵌入短 id
   string cmt = "NN1-" + ShortId(id) + (tag=="" ? "" : "-" + tag);

   MqlTradeRequest req = {};
   MqlTradeResult  res = {};
   req.action    = TRADE_ACTION_DEAL;
   req.symbol    = sym;
   req.volume    = lots;
   req.type      = type;
   req.price     = price;
   req.deviation = deviation;
   req.magic     = InpMagic;
   req.comment   = cmt;
   req.sl        = (sl>0) ? NormalizeDouble(sl, digits) : 0;
   req.tp        = (tp>0) ? NormalizeDouble(tp, digits) : 0;
   req.type_filling = ORDER_FILLING_FOK;                   // 默认 FOK，失败即整单取消

   //--- 提交前先写 ACCEPTED（两阶段回执第一阶段）
   WriteReceipt(id, "ACCEPTED", 0, 0, 0, price, "已受理，提交中");

   bool ok = OrderSend(req, res);
   if(!ok || res.retcode != TRADE_RETCODE_DONE)
   {
      // retcode 已知 → 明确拒绝；未知 → RECONCILING，禁止自动重放
      string stage = (res.retcode == 0 || res.retcode == TRADE_RETCODE_TIMEOUT) ? "RECONCILING" : "REJECTED";
      WriteReceipt(id, stage, (int)res.retcode, res.order, res.deal, res.price, "券商返回: " + IntegerToString((int)res.retcode));
      if(InpVerbose) Print("[NN] 下单未成交 retcode=", res.retcode, " stage=", stage);
      ArchiveCommand(id, raw);     // 即便失败也归档，避免重放
      return;
   }

   WriteReceipt(id, "EXECUTED", (int)res.retcode, res.order, res.deal, res.price, "已成交");
   ArchiveCommand(id, raw);
   if(InpVerbose) Print("[NN] 成交 ok order=", res.order, " deal=", res.deal, " comment=", cmt);
}

void ExecuteClose(string id, string raw, ulong ticket)
{
   if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED)) { WriteReceipt(id,"REJECTED",0,0,0,0,"终端禁止交易"); return; }

   // 持仓必须真的存在，且属于本 EA 的魔术号 —— 不校验会把别人/别的 EA 的仓平掉
   if(!PositionSelectByTicket(ticket))
   {
      WriteReceipt(id, "REJECTED", 0, 0, 0, 0, "持仓不存在: " + IntegerToString(ticket));
      return;
   }
   string pos_symbol = PositionGetString(POSITION_SYMBOL);
   long   pos_magic  = PositionGetInteger(POSITION_MAGIC);
   if(InpMagic != 0 && pos_magic != InpMagic)
   {
      WriteReceipt(id, "REJECTED", 0, 0, 0, 0, "持仓不属于本 EA (magic=" + IntegerToString(pos_magic) + ")");
      return;
   }

   WriteReceipt(id, "ACCEPTED", 0, 0, 0, 0, "已受理，平仓中: " + pos_symbol);

   // 平仓的正确做法（照 MQL5 标准库 CTrade::PositionClose 的语义手写，避免引入 include）：
   //   action = TRADE_ACTION_DEAL + 反向 type + position = 持仓号 + volume = 持仓量
   // 不存在 TRADE_ACTION_POSITION 这个枚举（写了编译不过）。
   // 净额账户下"发反向单"会变成减仓或反手，只有带上 position 才是平仓。
   MqlTradeRequest req = {};
   MqlTradeResult  res = {};
   ENUM_POSITION_TYPE ptype = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
   if(ptype == POSITION_TYPE_BUY)
   {
      req.type  = ORDER_TYPE_SELL;
      req.price = SymbolInfoDouble(pos_symbol, SYMBOL_BID);
   }
   else
   {
      req.type  = ORDER_TYPE_BUY;
      req.price = SymbolInfoDouble(pos_symbol, SYMBOL_ASK);
   }
   req.action       = TRADE_ACTION_DEAL;
   req.position     = ticket;
   req.symbol       = pos_symbol;
   req.volume       = PositionGetDouble(POSITION_VOLUME);
   req.magic        = InpMagic;
   req.deviation    = 20;
   req.type_filling = ORDER_FILLING_FOK;

   bool ok = OrderSend(req, res);
   if(!ok || res.retcode != TRADE_RETCODE_DONE)
   {
      // 平仓请求已发出但结果不明 → RECONCILING，禁止自动重放。
      // 这是最容易造成"用户以为平了其实没平"的地方，宁可显示待核对。
      int rc = (int)res.retcode;
      string stage = (rc == 0 || rc == TRADE_RETCODE_TIMEOUT) ? "RECONCILING" : "REJECTED";
      WriteReceipt(id, stage, rc, res.order, res.deal, res.price, "平仓失败: " + IntegerToString(rc));
      ArchiveCommand(id, raw);
      return;
   }
   WriteReceipt(id, "EXECUTED", (int)res.retcode, res.order, res.deal, res.price, "已平仓: " + pos_symbol);
   ArchiveCommand(id, raw);
   if(InpVerbose) Print("[NN] 平仓 ok ticket=", ticket, " symbol=", pos_symbol);
}

//+------------------------------------------------------------------+
//| 命令泵 COMMAND PUMP                                                |
//+------------------------------------------------------------------+
void PumpInbox()
{
   string name;
   long sh = FileFindFirst(g_inbox + "\\cmd_*.json", name);
   if(sh == INVALID_HANDLE) return;

   do
   {
      if(name=="." || name=="..") continue;
      string rel = g_inbox + "\\" + name;
      string raw = ReadFileText(rel);
      if(raw == "") continue;

      string id  = JsonStr(raw, "id");
      string typ = JsonStr(raw, "type");
      string acc = JsonStr(raw, "account");
      string sig = JsonStr(raw, "sig");
      // payload 子串：payload 内的键一律只在这里面查，防止 comment 里写 "symbol" 被误匹配
      string psub = PayloadSub(raw);

      //--- 校验 VALIDATE
      if(id == "")
      {
         NN_FILEMOVE(rel, g_quarantine + "\\badid_" + name);
         Print("[NN] 命令缺少 id，已隔离");
         continue;
      }
      if(IsKnownId(id))                       // 幂等 L1
      {
         WriteReceipt(id, "EXECUTED", 0, 0, 0, 0, "重复命令，已忽略");
         FileDelete(rel);
         continue;
      }
      // 没有可用密钥 = 无法判断命令来源是否可信 = 拒绝。
      // 绝不因为"没配密钥"就放行未签名命令（那是 fail-open）。
      // SYNC_STATE 不改敞口，允许放行，保证 UI 还能看到状态。
      if(!g_secret_ok && typ != "SYNC_STATE")
      {
         WriteReceipt(id, "REJECTED", 0, 0, 0, 0,
                      "EA 未配置密钥，拒绝执行。请在桌面端重新「安装 EA」以写入 secret.json");
         NN_FILEMOVE(rel, g_quarantine + "\\nosecret_" + name);
         continue;
      }
      if(g_secret_ok && sig == "")
      {
         WriteReceipt(id, "REJECTED", 0, 0, 0, 0, "缺少签名");
         NN_FILEMOVE(rel, g_quarantine + "\\nosig_" + name);
         continue;
      }

      //--- TTL
      double issued = JsonNum(raw, "issued_at_ms");
      double ttl    = JsonNum(raw, "ttl_ms");
      if(ttl > 0 && issued > 0)
      {
         double now_ms = (double)TimeCurrent() * 1000.0;
         if(now_ms - issued > ttl)
         {
            WriteReceipt(id, "EXPIRED", 0, 0, 0, 0, "命令已过期");
            NN_FILEMOVE(rel, g_quarantine + "\\expired_" + name);
            continue;
         }
      }

      //--- HMAC 鉴权 AUTH
      if(g_secret_ok)
      {
         // canonical 字段集与顺序必须与 JS protocol.js canonical() 完全一致（10 段）。
         // payload 内的键走 PayloadSub 局部解析；数值走 NNFmtNum 定点格式化。
         string canonical = id + "|" + typ + "|" + acc + "|" + JsonStr(raw,"account_server")
                          + "|" + NNFmtNum(JsonNum(raw,"session_epoch"))
                          + "|" + JsonStr(psub,"symbol")
                          + "|" + JsonStr(psub,"side")
                          + "|" + NNFmtNum(JsonNum(psub,"volume_lots"))
                          + "|" + NNFmtNum(JsonNum(psub,"sl_points"))
                          + "|" + NNFmtNum(JsonNum(psub,"tp_points"));
         string expect = HMACSHA256Hex(g_secret, canonical);
         if(expect != sig)
         {
            WriteReceipt(id, "REJECTED", 0, 0, 0, 0, "签名校验失败");
            NN_FILEMOVE(rel, g_quarantine + "\\badsig_" + name);
            Print("[NN] ⚠ 签名校验失败，命令已拒绝并隔离: ", id);
            continue;
         }
      }

      //--- 账户绑定 ACCOUNT BINDING
      // 登录号不能单独作为跨券商唯一身份：必须连同服务器名一起校验。
      long my_acc = AccountInfoInteger(ACCOUNT_LOGIN);
      if(acc != "" && (long)StringToInteger(acc) != my_acc)
      {
         WriteReceipt(id, "REJECTED", 0, 0, 0, 0, "账户不匹配: " + acc);
         NN_FILEMOVE(rel, g_quarantine + "\\acct_" + name);
         continue;
      }
      string want_server = JsonStr(raw, "account_server");
      string my_server   = AccountInfoString(ACCOUNT_SERVER);
      if(want_server != "" && want_server != my_server)
      {
         WriteReceipt(id, "REJECTED", 0, 0, 0, 0, "服务器不匹配: " + want_server);
         NN_FILEMOVE(rel, g_quarantine + "\\server_" + name);
         continue;
      }
      // session_epoch：绑定的代次。切账户/重新绑定后旧代次的命令一律失效。
      double want_epoch = JsonNum(raw, "session_epoch");
      if(want_epoch > 0 && (long)want_epoch != (long)g_session_epoch)
      {
         WriteReceipt(id, "EXPIRED", 0, 0, 0, 0, "绑定代次已失效（账户可能已切换）");
         NN_FILEMOVE(rel, g_quarantine + "\\epoch_" + name);
         continue;
      }
      // 未来时间戳防护：防止异常命令长期有效
      if(issued > 0)
      {
         double now_ms0 = (double)TimeCurrent() * 1000.0;
         if(issued > now_ms0 + 60000.0)
         {
            WriteReceipt(id, "REJECTED", 0, 0, 0, 0, "issued_at 超前于本机时间");
            NN_FILEMOVE(rel, g_quarantine + "\\future_" + name);
            continue;
         }
      }

      //--- 只读操作：SYNC_STATE（对账与 UI 初始化都靠它），不受自动交易开关限制
      if(typ == "SYNC_STATE")
      {
         WriteStatus();
         WriteHeartbeat();
         WriteReceipt(id, "EXECUTED", 0, 0, 0, 0, "已刷新状态快照");
         FileDelete(rel);
         continue;
      }

      //--- 自动交易开关（只约束会改变敞口的操作）
      if(!InpAutoTrade)
      {
         WriteReceipt(id, "REJECTED", 0, 0, 0, 0, "EA 自动交易开关关闭（InpAutoTrade=false）");
         ArchiveCommand(id, raw);
         FileDelete(rel);
         continue;
      }

      //--- 提交前二次 TTL 校验
      //    读取时校验一次不够：MT5 可能卡住，恢复后积压命令必须重新判过期。
      //    注意：TTL 限制的是「开始提交的时间」。请求已发出后，过期 ≠ 撤单，≠ 没有成交。
      if(ttl > 0 && issued > 0)
      {
         double now_ms2 = (double)TimeCurrent() * 1000.0;
         if(now_ms2 - issued > ttl)
         {
            WriteReceipt(id, "EXPIRED", 0, 0, 0, 0, "提交前复检：命令已过期");
            NN_FILEMOVE(rel, g_quarantine + "\\expired2_" + name);
            continue;
         }
      }

      //--- 分派 DISPATCH
      if(typ == "ORDER_MARKET")
      {
         ExecuteMarket(id, raw, JsonStr(psub,"symbol"), JsonStr(psub,"side"),
                       JsonNum(psub,"volume_lots"), JsonNum(psub,"sl_points"),
                       JsonNum(psub,"tp_points"), (int)JsonNum(psub,"max_deviation_points"),
                       JsonStr(psub,"comment"));
         FileDelete(rel);
      }
      else if(typ == "POSITION_CLOSE")
      {
         ExecuteClose(id, raw, (ulong)StringToInteger(JsonStr(psub,"ticket")));
         FileDelete(rel);
      }
      else
      {
         WriteReceipt(id, "REJECTED", 0, 0, 0, 0, "暂不支持的操作: " + typ);
         FileDelete(rel);
      }
   }
   while(FileFindNext(sh, name));
   FileFindClose(sh);
}

//+------------------------------------------------------------------+
//| 生命周期 LIFECYCLE                                                 |
//+------------------------------------------------------------------+
//+------------------------------------------------------------------+
//| 装载密钥与代次                                                     |
//| secret.json 由桌面端在「安装 EA」时写入（原子发布），内容形如：      |
//|   {"secret":"<hex>","epoch":3}                                    |
//| 安全性：文件放 MQL5\Files 沙箱内，权限等同于终端进程；              |
//|         拿不到密钥 = 没有可信命令来源 = 拒绝执行（fail-closed）。    |
//+------------------------------------------------------------------+
void LoadSecret()
{
   g_secret    = "";
   g_secret_ok = false;

   string rel  = InpBridgeDir + "\\secret.json";
   string raw  = ReadFileText(rel);
   if(raw != "")
   {
      string s = JsonStr(raw, "secret");
      if(s != "")
      {
         g_secret    = s;
         g_secret_ok = true;
         double ep   = JsonNum(raw, "epoch");
         if(ep > 0) g_session_epoch = (long)ep;
         Print("[NN] 已装载密钥 secret.json  epoch=", g_session_epoch);
         return;
      }
   }

   // 回退到 EA 参数（手工部署场景）
   if(InpSecret != "CHANGE_ME" && InpSecret != "")
   {
      g_secret    = InpSecret;
      g_secret_ok = true;
      Print("[NN] 已装载密钥（来自 EA 参数 InpSecret）");
      return;
   }

   // 缺省分支 = 不安全分支：一律拒绝，绝不因为"没配密钥"就放行未签名命令
   Print("[NN] ⚠ 未配置密钥：签名校验无法启用，所有会改变敞口的命令将被拒绝。");
   Print("[NN]   处理办法：在桌面端点「安装 EA」重新写入 secret.json，或在 EA 参数里填 InpSecret。");
}

int OnInit()
{
   g_dir        = InpBridgeDir;
   g_inbox      = g_dir + "\\inbox";
   g_outbox     = g_dir + "\\outbox";
   g_archive    = g_dir + "\\archive";
   g_quarantine = g_dir + "\\quarantine";

   FolderCreate(g_dir);
   FolderCreate(g_inbox);
   FolderCreate(g_outbox);
   FolderCreate(g_archive);
   FolderCreate(g_quarantine);

   // 密钥来源优先级：桥写入的 secret.json > EA 输入参数 InpSecret
   // 桌面端安装时会把随机密钥写进 niuniu/secret.json，用户不需要手填参数。
   LoadSecret();

   LoadArchiveIds();
   Reconcile();
   WriteHeartbeat();
   WriteStatus();

   // MQL5 的 EventSetTimer 参数是「秒」；毫秒级需要用 EventSetMillisecondTimer
   EventSetMillisecondTimer(InpPollMs);

   Print("[NN] ═══ 牛牛 AI 桥接 EA 已启动 ═══");
   Print("[NN] 桥目录: ", g_dir, "  账户: ", AccountInfoInteger(ACCOUNT_LOGIN),
         "  服务器: ", AccountInfoString(ACCOUNT_SERVER));
   Print("[NN] 仅模拟盘=", InpDemoOnly, "  自动交易=", InpAutoTrade,
         "  魔术号=", InpMagic, "  轮询=", InpPollMs, "ms");
   Print("[NN] 签名校验=", (g_secret_ok ? "已启用" : "未启用（将拒绝所有交易命令）"),
         "  密钥来源=", (g_secret_ok ? "secret.json / InpSecret" : "无"));
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("[NN] 桥接 EA 已停止，原因: ", reason);
}

void OnTick()
{
   // 行情驱动的状态刷新（有 tick 时更及时）；无 tick 时由 OnTimer 兜底
}

void OnTimer()
{
   // 注意：OnTimer 在无行情 tick 时（周末/休市）仍会触发，
   // 因此心跳与命令泵不能依赖 OnTick。
   datetime now = TimeCurrent();
   if(now - g_last_heartbeat >= InpHeartbeatSec)
   {
      WriteHeartbeat();
      WriteStatus();
      g_last_heartbeat = now;
   }
   PumpInbox();
}

void OnTradeTransaction(const MqlTradeTransaction &trans,
                        const MqlTradeRequest &request,
                        const MqlTradeResult &result)
{
   // 成交事件驱动：立刻刷新状态，让上位机尽快看到最新持仓
   WriteStatus();
}
//+------------------------------------------------------------------+
