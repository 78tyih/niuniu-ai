#!/bin/bash
# 教学视频：14 张幻灯片 → 慢速推近 + 0.6s 叠化 → 1080p30 MP4
set -e
cd "$(dirname "$0")/.."
mkdir -p dist/video .build/vid

FPS=30
D=(5 12 10 9 10 11 11 13 10 11 12 9 11 8)   # 每张停留秒数
N=${#D[@]}
X=0.6                                       # 叠化时长

echo "== 1) 逐张生成推近片段 =="
for i in $(seq 0 $((N-1))); do
  nn=$(printf "%02d" $((i+1)))
  F=$(( ${D[$i]} * FPS ))
  ffmpeg -y -loglevel error -i "docs/slides/${nn}.png" -filter_complex \
    "scale=3840:2160:force_original_aspect_ratio=increase,crop=3840:2160,\
zoompan=z='1+0.05*on/${F-1}':d=${F}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=${FPS},\
format=yuv420p" \
    -c:v libx264 -preset medium -crf 18 ".build/vid/seg_${nn}.mp4"
  echo "  seg_${nn}.mp4 (${D[$i]}s)"
done

echo "== 2) 叠化串联 =="
IN=""
for i in $(seq 0 $((N-1))); do
  nn=$(printf "%02d" $((i+1))); IN="$IN -i .build/vid/seg_${nn}.mp4"
done
FC=""
for i in $(seq 0 $((N-2))); do
  OFF=$(python3 -c "
d=[$(IFS=,; echo "${D[*]}")]
x=$X
print('%.2f' % (sum(d[:$i+1]) - ($i+1)*x))")
  if [ $i -eq 0 ]; then
    FC="[0:v][1:v]xfade=transition=fade:duration=${X}:offset=${OFF}[v1]"
  else
    FC="$FC;[v${i}][$((i+1)):v]xfade=transition=fade:duration=${X}:offset=${OFF}[v$((i+1))]"
  fi
done
echo "  filter: $FC"
ffmpeg -y -loglevel error $IN -filter_complex "$FC" -map "[v$((N-1))]" \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -movflags +faststart \
  "dist/牛牛AI-安装与上手教程.mp4"

echo "== 完成 =="
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "dist/牛牛AI-安装与上手教程.mp4"
