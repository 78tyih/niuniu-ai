#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""给录屏视频烧录字幕：PIL 生成字幕条 PNG → ffmpeg overlay。
（本机 ffmpeg 无 subtitles/drawtext 滤镜，故用 PIL + overlay 兜底。）
"""
import os
import subprocess
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, 'dist', 'video', 'tutorial-raw.webm')
OUT = os.path.join(ROOT, 'dist', 'video', '牛牛AI-上手教程.mp4')
BUILD = os.path.join(ROOT, '.build', 'subs')

W, H = 1680, 1050
BAR_H = 150
FONT = '/System/Library/Fonts/Hiragino Sans GB.ttc'

# (start_s, end_s, 主行, 副行) —— 副行可为空
SUBS = [
    (0.0, 3.0, '牛牛 AI · MT5 交易副驾驶', '概览页：账户 · 行情 · 持仓一目了然'),
    (3.0, 5.4, '终端与 EA', '扫描本机 MT5 · 一键安装桥接 EA · 绑定密钥'),
    (5.4, 7.4, '交易', '人工下单票据 + 回执跟踪'),
    (7.4, 10.4, '策略广场', '候选资产库（全部待回测）'),
    (10.4, 12.4, 'AI 副驾驶', 'AI 下单建议'),
    (12.4, 14.9, '建议卡', '方向 / 止损 / 止盈 · 手数由系统按「风险% × 余额」计算'),
    (14.9, 17.4, '一键下单', '二次确认弹窗'),
    (17.4, 19.9, '确认下单', '桥接 EA 发送到券商'),
    (19.9, 22.8, '回执跟踪', '已受理 → 已成交'),
]


def make_bar(idx, main, sub):
    img = Image.new('RGBA', (W, BAR_H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 底部圆角黑底
    d.rounded_rectangle([24, 10, W - 24, BAR_H - 10], radius=16, fill=(10, 12, 18, 172))
    f_main = ImageFont.truetype(FONT, 40)
    f_sub = ImageFont.truetype(FONT, 27)
    if sub:
        # 主行 + 副行上下排列
        main_w = d.textlength(main, font=f_main)
        sub_w = d.textlength(sub, font=f_sub)
        total_h = 40 + 8 + 34
        y_main = (BAR_H - total_h) // 2
        d.text(((W - main_w) // 2, y_main), main, font=f_main, fill=(255, 255, 255, 255))
        d.text(((W - sub_w) // 2, y_main + 48), sub, font=f_sub, fill=(168, 178, 192, 255))
    else:
        main_w = d.textlength(main, font=f_main)
        d.text(((W - main_w) // 2, (BAR_H - 46) // 2), main, font=f_main, fill=(255, 255, 255, 255))
    out = os.path.join(BUILD, f'sub_{idx:02d}.png')
    img.save(out)
    return out


os.makedirs(BUILD, exist_ok=True)
pngs = [make_bar(i, m, s) for i, (_, _, m, s) in enumerate(SUBS)]

# 构造 ffmpeg filter_complex：逐段 overlay + enable 时间窗
inputs = ['-i', RAW]
for p in pngs:
    inputs += ['-i', p]

fc = []
prev = '[0:v]'
for i, (start, end, _, _) in enumerate(SUBS):
    label = f'[v{i}]' if i < len(SUBS) - 1 else '[vout]'
    fc.append(f"{prev}[{i+1}:v]overlay=0:H-{BAR_H}:enable='between(t,{start},{end})'{label}")
    prev = label

cmd = ['ffmpeg', '-y', '-loglevel', 'error'] + inputs + [
    '-filter_complex', ';'.join(fc),
    '-map', '[vout]',
    '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', OUT,
]
print('生成字幕条:', len(pngs), '张')
r = subprocess.run(cmd, capture_output=True, text=True)
if r.returncode != 0:
    print('ffmpeg 失败:', r.stderr[-800:])
    raise SystemExit(1)
print('已生成', os.path.relpath(OUT, ROOT), f'({os.path.getsize(OUT)/1024:.0f} KB)')
