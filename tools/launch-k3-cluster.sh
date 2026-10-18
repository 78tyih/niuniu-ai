#!/usr/bin/env zsh
# K3 子代理集群：把 N 份 brief 并行喂给独立的 K3 进程，各自写各自的 answer 文件。
#
# 为什么加这些防御（都是踩过的坑）：
#   * K3 崩溃会遗留空锁目录 ~/.kimi-code/oauth/kimi-code.lock，再跑必报 EEXIST。
#     并行时不能直接 mv 别人正在用的锁，所以只在「锁存在且 >20 分钟没动」时才判定为僵尸锁并改名归档。
#   * EEXIST 说明是活锁（别人在跑），那就等 20 秒重试，最多 3 次。
#   * 每份 brief 独立子进程、独立输出文件，失败不影响其他任务。
set -u

DIR=/Users/a1234/projects/WorkBuddy/2026-10-15-09-27-05/niuniu-ai/research/2026-10-18
KIMI=$HOME/.kimi-code/bin/kimi
LOCK=$HOME/.kimi-code/oauth/kimi-code.lock

clear_stale_lock() {
  # 只处理「明显过期」的锁；活跃锁一律不动，避免踩到别人还在跑的会话
  if [ -d "$LOCK" ]; then
    if find "$LOCK" -maxdepth 0 -mmin +20 2>/dev/null | grep -q .; then
      mv "$LOCK" "$LOCK.stale.cluster.$(date +%s)" 2>/dev/null && echo "[cluster] 清理僵尸锁"
    fi
  fi
}

run() {
  tag=$1; brief=$2; delay=$3
  sleep $delay
  out=$DIR/answer-K3-$tag.md
  prompt=$(cat "$brief")
  for i in 1 2 3; do
    clear_stale_lock
    timeout 1800 "$KIMI" -m kimi-code/k3 -p "$prompt" > "$out" 2>&1
    if ! grep -q "EEXIST" "$out"; then break; fi
    echo "[cluster] $tag 遇到 OAuth 锁冲突，20s 后重试（第 $i 次）"
    sleep 20
  done
  lines=$(wc -l < "$out" | tr -d ' ')
  echo "[cluster] DONE $tag → ${lines} 行"
}

run A "$DIR/brief-K3-A.md" 0 &
run B "$DIR/brief-K3-B.md" 12 &
run C "$DIR/brief-K3-C.md" 24 &
run D "$DIR/brief-K3-D.md" 36 &
wait
echo "[cluster] ALL DONE"
ls -la "$DIR"
