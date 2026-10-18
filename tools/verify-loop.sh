#!/bin/bash
# 在真实 MT5 终端上跑一遍完整下单闭环（远程执行，无需在 Windows 上装任何东西）
#
# 用法：
#   ./tools/verify-loop.sh <ssh-host>        # 例：./tools/verify-loop.sh serawin
#
# 前置（Windows 侧只需做一次，约 60 秒）：
#   1. 打开 MT5，登录一个【模拟账户】
#   2. 把导航器 → EA 交易 里的 NiuNiuBridge 拖到任意图表
#   3. 确认工具栏「自动交易」是绿色，图表右上角是笑脸
#   本脚本会自动发现终端实例、下发密钥、建目录、发命令、收回执。
#
# 它验证的完整链路：
#   SYNC_STATE → status.json（账户/签名/代次）
#   → ORDER_MARKET（签名 + 执行前检查 + OrderSend）
#   → 回执 EXECUTED + 持仓出现在 status.json 且 comment = NN1-<id8>
#   → POSITION_CLOSE（按持仓号平，不是发反向单）
#   → 持仓从 status.json 消失
set -uo pipefail

HOST="${1:-serawin}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PY="${PYTHON:-/Users/a1234/.workbuddy/binaries/python/versions/3.13.12/bin/python3}"
NODE="${NODE:-/Users/a1234/.workbuddy/binaries/node/versions/22.22.2-6/bin/node}"
[ -x "$NODE" ] || NODE="$(command -v node)"
[ -x "$PY" ] || PY="$(command -v python3)"

ACCOUNT=""; SERVER=""                    # 先初始化，set -u 下不能未定义

sshq() { ssh -o ConnectTimeout=15 "$HOST" "$1" 2>/dev/null | tr -d '\r'; }

# ---- 1. 发现终端实例 ----
# 注意：PowerShell 单引号里 $env:APPDATA 不会展开，所以先在远端解析出真实路径，
# 之后一律用字面量路径（bash 双引号里 \M 不是转义，会原样保留）。
WINROOT="$(sshq 'Write-Output $env:APPDATA')"
if [ -z "$WINROOT" ]; then echo "❌ 取不到 %APPDATA%"; exit 1; fi
TERM_WIN="${WINROOT}\MetaQuotes\Terminal"

INST="$(sshq "Get-ChildItem -LiteralPath '$TERM_WIN' -Directory -ErrorAction SilentlyContinue | Where-Object { \$_.Name -notmatch '^(Common|Community)\$' } | Select-Object -First 1 -ExpandProperty Name")"
if [ -z "$INST" ]; then echo "❌ 没找到 MT5 终端实例：$TERM_WIN"; exit 1; fi
echo "终端实例: $INST"

SANDBOX="$TERM_WIN\\$INST\\MQL5\\Files\\niuniu"
# scp 要的是完整绝对路径 + 正斜杠（反斜杠会被当转义，报 No such file）
WINROOT="$(sshq 'Write-Output $env:APPDATA')"
SCP_BASE="$WINROOT/MetaQuotes/Terminal/$INST/MQL5/Files/niuniu"
echo "桥目录:   $SANDBOX"

# ---- 2. 建目录 + 密钥 ----
sshq "New-Item -ItemType Directory -Force -Path '$SANDBOX\\inbox' | Out-Null; New-Item -ItemType Directory -Force -Path '$SANDBOX\\outbox' | Out-Null; New-Item -ItemType Directory -Force -Path '$SANDBOX\\archive' | Out-Null; New-Item -ItemType Directory -Force -Path '$SANDBOX\\quarantine' | Out-Null" 

SECRET="$(sshq "if(Test-Path '$SANDBOX\\secret.json'){ (Get-Content '$SANDBOX\\secret.json' -Raw | ConvertFrom-Json).secret }")"
if [ -z "$SECRET" ]; then
  SECRET="$("$PY" -c 'import secrets;print(secrets.token_hex(32))')"
  sshq "Set-Content -Path '$SANDBOX\\secret.json' -Value '{\"secret\":\"$SECRET\",\"epoch\":1}' -Encoding UTF8"
  echo "已生成并下发新密钥 —— ⚠ 请重新挂载一次 EA（密钥只在 OnInit 装载）"
fi
echo "密钥:     ${SECRET:0:8}…（已下发）"

# ---- 工具函数 ----
send_cmd() {   # $1=type  $2=payload-json  → 输出 command id
  local type="$1" payload="$2" epoch="$3"
  local out="$ROOT/.build/cmd.json"
  mkdir -p "$ROOT/.build"
  "$NODE" "$ROOT/test/make-cmd.js" --type "$type" --secret "$SECRET" \
      --account "$ACCOUNT" --server "$SERVER" --epoch "$epoch" \
      --payload "$payload" > "$out"
  local id="$("$PY" -c 'import json,sys;print(json.load(open(sys.argv[1]))["id"])' "$out")"
  scp -o ConnectTimeout=15 "$out" "$HOST:$SCP_BASE/inbox/cmd_$id.json" >/dev/null 2>&1
  echo "$id"
}

wait_receipt() {  # $1=id  $2=timeout-s → 输出回执 JSON
  local id="$1" t="${2:-45}" i=0
  while [ "$i" -lt "$((t*2))" ]; do
    local r
    r="$(sshq "if(Test-Path '$SANDBOX\\outbox\\rcpt_$id.json'){ Get-Content '$SANDBOX\\outbox\\rcpt_$id.json' -Raw }")"
    if [ -n "$r" ]; then echo "$r"; return 0; fi
    sleep 0.5; i=$((i+1))
  done
  return 1
}

read_status() {
  sshq "if(Test-Path '$SANDBOX\\status.json'){ Get-Content '$SANDBOX\\status.json' -Raw }"
}

# ---- 3. SYNC_STATE ----
echo
echo "── 第 1 步 · SYNC_STATE ──"
ID1="$(send_cmd SYNC_STATE '{}' 1)"
R1="$(wait_receipt "$ID1" 30)" || { echo "❌ 超时：EA 没回执。EA 挂上图表了吗？自动交易开了吗？"; exit 1; }
echo "$R1" | "$PY" -c 'import json,sys;d=json.load(sys.stdin);print("  回执:",d.get("stage"),"·",d.get("message",""))'

ST="$(read_status)"
[ -z "$ST" ] && { echo "❌ status.json 没生成"; exit 1; }

eval "$("$PY" - "$ST" <<'PY'
import json,sys
d=json.loads(sys.argv[1])
a=d.get("account",{}) or {}
print(f'ACCOUNT="{a.get("login","")}"')
print(f'SERVER="{d.get("server","")}"')
print(f'MODE="{a.get("mode","")}"')
print(f'TRADE="{d.get("trading_allowed")}"')
print(f'SIGNED="{d.get("signed")}"')
print(f'EPOCH="{d.get("epoch",1)}"')
print(f'SYMBOL="{d.get("symbol","")}"')
PY
)"
echo "  账户 $ACCOUNT · $MODE 模式 · 交易许可 $TRADE · 签名 $SIGNED · 代次 $EPOCH · 品种 $SYMBOL"

if [ "$SIGNED" != "True" ]; then
  echo "❌ EA 未启用签名（缺密钥）。请重新挂载 EA。"; exit 1
fi

# ---- 4. ORDER_MARKET ----
echo
echo "── 第 2 步 · ORDER_MARKET ──"
SYM="$SYMBOL"; [ -z "$SYM" ] && SYM="EURUSD"
ID2="$(send_cmd ORDER_MARKET "{\"symbol\":\"$SYM\",\"side\":\"BUY\",\"volume_lots\":0.01,\"sl_points\":0,\"tp_points\":0,\"max_deviation_points\":20,\"comment\":\"verify\"}" "$EPOCH")"
echo "  命令 $ID2 → 短码 NN1-${ID2: -8}"
R2="$(wait_receipt "$ID2" 60)" || { echo "❌ 下单超时无回执（可能还在 RECONCILING）"; exit 1; }
echo "$R2" | "$PY" -c 'import json,sys;d=json.load(sys.stdin);print("  回执:",d.get("stage"),"·retcode",d.get("retcode"),"·deal",d.get("deal"),"·",d.get("message",""))'

STAGE="$(echo "$R2" | "$PY" -c 'import json,sys;print(json.load(sys.stdin).get("stage",""))')"
if [ "$STAGE" != "EXECUTED" ]; then echo "❌ 下单未成交（$STAGE）"; exit 1; fi

sleep 1
ST2="$(read_status)"
echo "  当前持仓："
echo "$ST2" | "$PY" - <<'PY'
import json,sys
d=json.loads(sys.stdin)
for p in d.get("positions",[]) or []:
    print(f'    #{p.get("ticket")} {p.get("symbol")} {p.get("type")} {p.get("volume")}手  comment={p.get("comment")}')
PY

# ---- 5. POSITION_CLOSE ----
echo
echo "── 第 3 步 · POSITION_CLOSE ──"
TICKET="$(echo "$ST2" | "$PY" -c '
import json,sys
d=json.loads(sys.stdin)
ps=[p for p in (d.get("positions") or []) if (p.get("comment") or "").startswith("NN1-")]
print(ps[0]["ticket"] if ps else "")')"
if [ -z "$TICKET" ]; then echo "❌ 没找到带 NN1- 短码的持仓，无法验证平仓"; exit 1; fi
echo "  平掉持仓 $TICKET"

ID3="$(send_cmd POSITION_CLOSE "{\"ticket\":\"$TICKET\",\"symbol\":\"$SYM\",\"side\":\"\",\"volume_lots\":0,\"sl_points\":0,\"tp_points\":0,\"comment\":\"\"}" "$EPOCH")"
R3="$(wait_receipt "$ID3" 60)" || { echo "❌ 平仓超时无回执"; exit 1; }
echo "$R3" | "$PY" -c 'import json,sys;d=json.load(sys.stdin);print("  回执:",d.get("stage"),"·retcode",d.get("retcode"),"·",d.get("message",""))'

sleep 1
ST3="$(read_status)"
LEFT="$(echo "$ST3" | "$PY" -c '
import json,sys
d=json.loads(sys.stdin)
print(len([p for p in (d.get("positions") or []) if (p.get("comment") or "").startswith("NN1-")]))')"

echo
echo "════════ 结论 ════════"
echo "  SYNC_STATE     : $(echo "$R1" | "$PY" -c 'import json,sys;print(json.load(sys.stdin).get("stage"))')"
echo "  ORDER_MARKET   : $STAGE"
echo "  POSITION_CLOSE : $(echo "$R3" | "$PY" -c 'import json,sys;print(json.load(sys.stdin).get("stage"))')"
echo "  平仓后残留 NN1- 持仓: $LEFT"
if [ "$LEFT" = "0" ]; then echo "  ✅ 完整闭环跑通"; else echo "  ⚠ 闭环未完全收敛，请人工核对 MT5"; fi
