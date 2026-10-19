#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成与视频等长的 BGM 垫底（纯 ffmpeg 合成，零依赖、无版权问题）。
用法: python3 tools/make_bgm.py --duration 75.2
输出: assets/bgm/track.wav (+ assets/bgm/bgm.filter)
"""
import argparse, pathlib, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BGM = ROOT / "assets" / "bgm"

TEMPLATE = """aevalsrc=exprs=0.10*sin(2*PI*110*t):d={d}:s=48000[drone];
aevalsrc=exprs=0.055*sin(2*PI*220*t)+0.045*sin(2*PI*261.63*t)+0.040*sin(2*PI*329.63*t):d={d}:s=48000[pad];
aevalsrc=exprs=0.050*sin(2*PI*523.25*t)*exp(-5*(t-floor(t/1.3)*1.3)):d={d}:s=48000[ping];
aevalsrc=exprs=0.038*sin(2*PI*659.25*t)*exp(-6*(t-floor(t/2.6)*2.6)):d={d}:s=48000[ping2];
anoisesrc=c=pink:d={d}:a=0.018:s=48000[noise];
[drone][pad][ping][ping2][noise]amix=inputs=5:normalize=0[raw];
[raw]highpass=f=38,lowpass=f=4200,tremolo=f=0.1:d=0.18,volume=0.85,aformat=sample_rates=48000:channel_layouts=stereo,afade=t=in:st=0:d=1.5,afade=t=out:st={fo}:d=4[out]
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--duration", type=float, required=True, help="视频总时长（秒）")
    a = ap.parse_args()

    d = round(a.duration + 1.0, 3)         # 音频比画面略长，避免尾巴被截
    fo = round(d - 4.0, 3)                 # 尾部 4s 淡出
    graph = TEMPLATE.format(d=d, fo=fo)

    BGM.mkdir(parents=True, exist_ok=True)
    (BGM / "bgm.filter").write_text(graph, encoding="utf-8")
    out = BGM / "track.wav"
    cmd = ["ffmpeg", "-y", "-v", "error",
           "-filter_complex", " ".join(graph.split()),
           "-map", "[out]", "-t", str(d), str(out)]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("ffmpeg failed:", r.stderr, file=sys.stderr)
        return 1

    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(out)], capture_output=True, text=True)
    vol = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(out), "-af", "volumedetect",
         "-f", "null", "-"], capture_output=True, text=True)
    stats = [l.strip() for l in vol.stderr.splitlines() if "mean_volume" in l or "max_volume" in l]
    print(f"ok: {out}  duration={probe.stdout.strip()}s  (fade-out @{fo}s)")
    for l in stats:
        print("   ", l)
    return 0


if __name__ == "__main__":
    sys.exit(main())
