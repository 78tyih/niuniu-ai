#!/bin/bash
# 把 ea/NiuNiuBridge.mq5 编译成 NiuNiuBridge.ex5
#
# 为什么需要这一步：客户机上不一定装 MetaEditor，只发 .mq5 等于交付失败。
# 本脚本通过 SSH 在装了 MT5 的 Windows 机器上远程调用 MetaEditor64.exe 编译，
# 再把 .ex5 拉回本地 ea/ 目录，供打包分发。
#
# 用法：
#   ./tools/build-ex5.sh [ssh-host]        # 默认 serawin
#
# 前置：目标机装了 MetaTrader 5（含 MetaEditor64.exe），且本机可免密 SSH 登录。
set -euo pipefail

HOST="${1:-serawin}"
HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
SRC="$ROOT/ea/NiuNiuBridge.mq5"
STAGE="$ROOT/.build"
REMOTE_DIR='C:\Temp\nn'

PY="${PYTHON:-/Users/a1234/.workbuddy/binaries/python/versions/3.13.12/bin/python3}"
[ -x "$PY" ] || PY="$(command -v python3)"

mkdir -p "$STAGE"
echo "==> 1/4 加 UTF-8 BOM（无 BOM 时 MetaEditor 会把中文字符串编坏）"
"$PY" - "$SRC" "$STAGE/NiuNiuBridge.mq5" <<'PY'
import sys
src, dst = sys.argv[1], sys.argv[2]
d = open(src, 'rb').read()
if d[:3] != b'\xef\xbb\xbf':
    d = b'\xef\xbb\xbf' + d
open(dst, 'wb').write(d)
print("    staged", len(d), "bytes")
PY

echo "==> 2/4 上传到 $HOST:$REMOTE_DIR"
ssh -o ConnectTimeout=10 "$HOST" "New-Item -ItemType Directory -Force -Path '$REMOTE_DIR' | Out-Null; Remove-Item '$REMOTE_DIR\\NiuNiuBridge.ex5' -ErrorAction SilentlyContinue; Remove-Item '$REMOTE_DIR\\compile.log' -ErrorAction SilentlyContinue"
# scp 的远端路径用正斜杠：反斜杠会被当成转义，报 "No such file or directory"
scp -o ConnectTimeout=10 "$STAGE/NiuNiuBridge.mq5" "$HOST:${REMOTE_DIR//\\//}/NiuNiuBridge.mq5" >/dev/null

echo "==> 3/4 MetaEditor64.exe /compile"
ssh -o ConnectTimeout=90 "$HOST" "& 'C:\Program Files\MetaTrader 5\MetaEditor64.exe' /compile:\"${REMOTE_DIR}\\NiuNiuBridge.mq5\" /log:\"${REMOTE_DIR}\\compile.log\"; Start-Sleep -Seconds 15"

echo "==> 4/4 取回日志与产物"
LOG="$STAGE/compile.log"
ssh -o ConnectTimeout=15 "$HOST" "Get-Content -Path '${REMOTE_DIR}\\compile.log' -Encoding Unicode | Out-String" > "$LOG" 2>/dev/null || true
cat "$LOG"

if grep -q "0 errors" "$LOG"; then
  scp -o ConnectTimeout=15 "$HOST:${REMOTE_DIR//\\//}/NiuNiuBridge.ex5" "$ROOT/ea/NiuNiuBridge.ex5" >/dev/null
  echo
  echo "✅ 编译成功 -> $ROOT/ea/NiuNiuBridge.ex5"
  ls -l "$ROOT/ea/NiuNiuBridge.ex5"
  exit 0
else
  echo
  echo "❌ 编译失败，日志见 $LOG"
  exit 1
fi
