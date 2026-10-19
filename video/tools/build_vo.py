#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把逐句配音拼成每幕 VO，并输出 vo_manifest.json（含每句精确起止）。牛牛AI 终端演示版。

输入：assets/vo/lines/<KEY>-<n>.wav（SeraWin 逐句克隆产物，已拉回）
输出：assets/vo/<scene_id>.wav（每幕一条，句间插入固定停顿）
      tools/vo_manifest.json（每幕 VO 时长 + 每句相对 VO 起点的 start/end）
"""
import json, pathlib, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SPEC = ROOT / "tools" / "vo_lines.json"
LINES_DIR = ROOT / "assets" / "vo" / "lines"
OUT_DIR = ROOT / "assets" / "vo"
TMP = ROOT / ".tmpvo"

KEY_TO_SCENE = {f"S{i}": f"s{i}" for i in range(8)}

SR = 48000


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        sys.exit("ffmpeg 失败: " + " ".join(cmd) + "\n" + r.stderr[-1500:])
    return r


def dur(path):
    r = run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(path)])
    return float(r.stdout.strip())


def main():
    spec = json.loads(SPEC.read_text(encoding="utf-8"))
    gap = float(spec["gap"])
    TMP.mkdir(exist_ok=True)
    manifest = {"gap": gap, "scenes": {}}

    for key, node in spec["scenes"].items():
        scene = KEY_TO_SCENE[key]
        pieces, lines, cursor = [], [], 0.0
        for i, text in enumerate(node["lines"], 1):
            lid = f"{key}-{i}"
            src = LINES_DIR / f"{lid}.wav"
            if not src.exists():
                sys.exit(f"缺配音文件: {src}")
            # 响度统一（逐句），再转 48k 单声道
            norm = TMP / f"{lid}.norm.wav"
            run(["ffmpeg", "-y", "-v", "error", "-i", str(src),
                 "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", str(SR), "-ac", "1", str(norm)])
            d = dur(norm)
            pieces.append(norm)
            lines.append({"id": lid, "text": text,
                          "start": round(cursor, 3), "end": round(cursor + d, 3)})
            cursor += d
            if i < len(node["lines"]):
                sil = TMP / f"{lid}.gap.wav"
                run(["ffmpeg", "-y", "-v", "error", "-f", "lavfi",
                     "-i", f"anullsrc=r={SR}:cl=mono", "-t", str(gap), str(sil)])
                pieces.append(sil)
                cursor += gap

        # 拼接
        listfile = TMP / f"{scene}.txt"
        listfile.write_text("".join(f"file '{p.name}'\n" for p in pieces), encoding="utf-8")
        out = OUT_DIR / f"{scene}.wav"
        run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0",
             "-i", str(listfile), "-ar", str(SR), "-ac", "1", str(out)])

        vo = dur(out)
        manifest["scenes"][key] = {"scene": scene, "vo": round(vo, 3), "lines": lines}
        peaks = run(["ffmpeg", "-hide_banner", "-i", str(out), "-af", "volumedetect",
                     "-f", "null", "-"]).stderr
        stats = [l.split("]")[-1].strip() for l in peaks.splitlines()
                 if "mean_volume" in l or "max_volume" in l]
        print(f"{key} -> {scene}  vo={vo:6.2f}s  lines={len(lines)}  " + " | ".join(stats))

    (ROOT / "tools" / "vo_manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")
    total = sum(v["vo"] for v in manifest["scenes"].values())
    print(f"\n合计 VO {total:.2f}s，共 {sum(len(v['lines']) for v in manifest['scenes'].values())} 句")
    print("manifest -> tools/vo_manifest.json")
    shutil.rmtree(TMP, ignore_errors=True)


if __name__ == "__main__":
    main()
