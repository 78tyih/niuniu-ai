#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""时间轴编译器（牛牛AI 终端演示版）：把「以字幕句为锚点」的动画编排编译成 index.html 时间轴。

一次改完：
  · 8 幕 data-start / data-duration
  · 8 条 VO 音频 + BGM / 进度条 / 根时长
  · 全部动画提示点（CUES 区）——含光标滑动 / 点击光圈 / 区域放大
  · 逐句字幕（SUBS 区）与字幕淡入淡出（SUBS-TL 区）
  · 音效时间戳

锚点类型：
  ("head", d)              全片起点 + d
  ("head", key, d)         场景起点 + d
  ("line", key, n, d)      第 n 句起点 + d
  ("frac", key, n, f)      第 n 句内 f 处（0-1）
时长类型：
  数值                      固定秒数
  ("span", key, n1, n2)     从第 n1 句起点到第 n2 句终点
  ("between", a, b)         两个锚点之间
"""
import json, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
HTML = ROOT / "index.html"
MANIFEST = ROOT / "tools" / "vo_manifest.json"

LEAD = 0.4
PAD = {"S0": 1.4, "S1": 1.3, "S2": 1.1, "S3": 1.6, "S4": 1.5, "S5": 1.3, "S6": 1.4, "S7": 2.6}
ORDER = [f"S{i}" for i in range(8)]
SCENE_ID = {f"S{i}": f"s{i}" for i in range(8)}
TITLES = {"S0": "封面", "S1": "连接 MT5", "S2": "挂 EA", "S3": "自检",
          "S4": "人工下单", "S5": "AI 建议", "S6": "二次确认", "S7": "结论"}

# ============================ 动画编排 ============================
# mode: fade | scalex | wipe(width) | grow(height) | pulse | dim | glide | ring | zoom
C = lambda sel, at, mode="fade", dur=0.65, **kw: {
    "sel": sel, "at": at, "mode": mode, "dur": dur, "vars": kw}

CUR0 = (620, 900)  # 每幕光标出场位

CUES = {
    # ---------- S0 · 封面 ----------
    "S0": [
        C("#s0-kicker", ("head", "S0", 0.10), "fade", y=-20, duration=0.6),
        C("#s0-title", ("head", "S0", 0.45), "fade", y=34, duration=0.9),
        C("#s0-rule", ("head", "S0", 1.20), "scalex", 0.7),
        C("#s0-thesis", ("line", "S0", 1, 0.30), "fade", y=22, duration=0.7),
        C("#s0-map", ("line", "S0", 2, -0.30), "fade", y=18, duration=0.6),
        C("#s0-foot", ("line", "S0", 2, 0.80), "fade", y=14, duration=0.5),
    ],
    # ---------- S1 · 连接 MT5 ----------
    "S1": [
        C("#s1-chip", ("head", "S1", 0.05), "fade", y=-14, duration=0.5),
        C("#s1-cur", ("head", "S1", 0.05), "show", duration=0.35),
        C("#s1-cur", ("line", "S1", 1, -0.15), "glide", 0.95, x0=CUR0[0], y0=CUR0[1], x1=103, y1=150),
        C("#s1-ring1", ("line", "S1", 1, 0.85), "ring", 0.8, repeats=2),
        C("#s1-cur", ("line", "S1", 1, 1.40), "glide", 0.85, x0=103, y0=150, x1=406, y1=511),
        C("#s1-ring2", ("line", "S1", 2, -0.05), "ring", 0.8, repeats=2),
        C("#s1-zoom", ("line", "S1", 2, 0.15), "zoom", 0.85, to=1.55, origin="406px 511px"),
        C("#s1-co", ("line", "S1", 2, 0.50), "show", y=10, duration=0.5),
        C("#s1-zoom", ("frac", "S1", 2, 0.85), "zoom", 0.70, to=1.0, origin="406px 511px"),
        C("#s1-co", ("frac", "S1", 2, 0.88), "dim", 0.6, to=0.35),
    ],
    # ---------- S2 · 挂 EA ----------
    "S2": [
        C("#s2-chip", ("head", "S2", 0.05), "fade", y=-14, duration=0.5),
        C("#s2-eyebrow", ("head", "S2", 0.10), "fade", y=-20, duration=0.6),
        C("#s2-head", ("head", "S2", 0.35), "fade", y=24, duration=0.7),
        C("#s2-c1", ("line", "S2", 1, 0.40), "fade", dur=0.7, y=30),
        C("#s2-c2", ("line", "S2", 2, -1.00), "fade", dur=0.7, y=30),
        C("#s2-c3", ("line", "S2", 2, 0.50), "fade", dur=0.7, y=30),
        C("#s2-c3", ("frac", "S2", 2, 0.80), "pulse", 0.5, to=1.015),
        C("#s2-note", ("frac", "S2", 2, 0.85), "fade", y=16, duration=0.6),
    ],
    # ---------- S3 · 自检 ----------
    "S3": [
        C("#s3-chip", ("head", "S3", 0.05), "fade", y=-14, duration=0.5),
        C("#s3-cur", ("head", "S3", 0.05), "show", duration=0.35),
        C("#s3-cur", ("line", "S3", 1, 0.15), "glide", 1.05, x0=CUR0[0], y0=CUR0[1], x1=330, y1=430),
        C("#s3-ring", ("line", "S3", 1, 1.30), "ring", 0.8, repeats=1),
        C("#s3-zoom", ("line", "S3", 1, 1.50), "zoom", 0.80, to=1.32, origin="330px 430px"),
        C("#s3-co", ("line", "S3", 1, 1.70), "show", y=10, duration=0.5),
        C("#s3-zoom", ("frac", "S3", 1, 0.85), "zoom", 0.70, to=1.0, origin="330px 430px"),
        C("#s3-co", ("frac", "S3", 1, 0.88), "dim", 0.6, to=0.35),
    ],
    # ---------- S4 · 人工下单 ----------
    "S4": [
        C("#s4-chip", ("head", "S4", 0.05), "fade", y=-14, duration=0.5),
        C("#s4-cur", ("head", "S4", 0.05), "show", duration=0.35),
        C("#s4-cur", ("line", "S4", 1, -0.20), "glide", 0.90, x0=CUR0[0], y0=CUR0[1], x1=98, y1=187),
        C("#s4-ring1", ("line", "S4", 1, 0.75), "ring", 0.8, repeats=2),
        C("#s4-cur", ("line", "S4", 1, 1.90), "glide", 1.00, x0=98, y0=187, x1=605, y1=848),
        C("#s4-ring2", ("line", "S4", 2, -0.50), "ring", 0.8, repeats=2),
        # 放大原点放低到 1000px：把按钮推离底部字幕区，避免字幕压住按钮
        C("#s4-zoom", ("line", "S4", 2, -0.30), "zoom", 0.80, to=1.50, origin="605px 1000px"),
        C("#s4-co", ("line", "S4", 2, 0.10), "show", y=10, duration=0.5),
        C("#s4-zoom", ("frac", "S4", 2, 0.85), "zoom", 0.70, to=1.0, origin="605px 1000px"),
        C("#s4-co", ("frac", "S4", 2, 0.87), "dim", 0.6, to=0.35),
    ],
    # ---------- S5 · AI 建议 ----------
    "S5": [
        C("#s5-chip", ("head", "S5", 0.05), "fade", y=-14, duration=0.5),
        C("#s5-cur", ("head", "S5", 0.05), "show", duration=0.35),
        C("#s5-cur", ("line", "S5", 1, -0.20), "glide", 0.90, x0=CUR0[0], y0=CUR0[1], x1=103, y1=264),
        C("#s5-ring1", ("line", "S5", 1, 0.75), "ring", 0.8, repeats=1),
        C("#s5-cur", ("frac", "S5", 1, 0.50), "glide", 0.80, x0=103, y0=264, x1=347, y1=443),
        C("#s5-ring2", ("line", "S5", 2, -0.55), "ring", 0.8, repeats=2),
        C("#s5-co", ("line", "S5", 2, -0.35), "show", y=10, duration=0.5),
        C("#s5-cur", ("line", "S5", 2, 0.10), "glide", 0.90, x0=347, y0=443, x1=700, y1=560),
        C("#s5-ring3", ("line", "S5", 2, 1.10), "ring", 0.8, repeats=1),
        C("#s5-zoom", ("line", "S5", 2, 1.30), "zoom", 0.80, to=1.28, origin="700px 560px"),
        C("#s5-zoom", ("frac", "S5", 2, 0.88), "zoom", 0.60, to=1.0, origin="700px 560px"),
        C("#s5-co", ("frac", "S5", 2, 0.60), "dim", 0.6, to=0.35),
    ],
    # ---------- S6 · 二次确认 ----------
    "S6": [
        C("#s6-chip", ("head", "S6", 0.05), "fade", y=-14, duration=0.5),
        C("#s6-cur", ("head", "S6", 0.05), "show", duration=0.35),
        C("#s6-cur", ("line", "S6", 1, 0.50), "glide", 1.00, x0=CUR0[0], y0=CUR0[1], x1=982, y1=749),
        C("#s6-ring1", ("line", "S6", 1, 1.60), "ring", 0.8, repeats=2),
        C("#s6-zoom", ("line", "S6", 1, 1.80), "zoom", 0.85, to=1.45, origin="982px 749px"),
        C("#s6-co", ("line", "S6", 1, 2.20), "show", y=10, duration=0.5),
        C("#s6-ring2", ("line", "S6", 2, 0.30), "ring", 0.8, repeats=1),
        C("#s6-zoom", ("frac", "S6", 2, 0.80), "zoom", 0.70, to=1.0, origin="982px 749px"),
        C("#s6-co", ("frac", "S6", 2, 0.82), "dim", 0.6, to=0.35),
    ],
    # ---------- S7 · 结论 ----------
    "S7": [
        C("#s7-chip", ("head", "S7", 0.05), "fade", y=-14, duration=0.5),
        C("#s7-eyebrow", ("head", "S7", 0.10), "fade", y=-20, duration=0.6),
        C("#s7-head", ("head", "S7", 0.35), "fade", y=24, duration=0.7),
        C("#s7-k1", ("line", "S7", 1, 0.50), "fade", y=26, duration=0.6),
        C("#s7-k2", ("line", "S7", 1, 1.70), "fade", y=26, duration=0.6),
        C("#s7-k3", ("line", "S7", 1, 3.00), "fade", y=26, duration=0.6),
        C("#s7-cta", ("line", "S7", 2, -0.30), "fade", dur=0.75, y=22),
        C("#s7-cta", ("line", "S7", 2, 1.00), "pulse", 0.5, to=1.012),
        C("#s7-foot", ("line", "S7", 2, 1.30), "fade", y=14, duration=0.5),
    ],
}

# 音效：(id, 锚点, 时长锚点或数值, 音量)
CLICKS = [
    ("sfx-c01", ("line", "S1", 1, 0.85)),
    ("sfx-c02", ("line", "S1", 2, -0.05)),
    ("sfx-c03", ("line", "S2", 1, 0.40)),
    ("sfx-c04", ("line", "S2", 2, -1.00)),
    ("sfx-c05", ("line", "S2", 2, 0.50)),
    ("sfx-c06", ("line", "S3", 1, 1.30)),
    ("sfx-c07", ("line", "S4", 1, 0.75)),
    ("sfx-c08", ("line", "S4", 2, -0.50)),
    ("sfx-c09", ("line", "S5", 1, 0.75)),
    ("sfx-c10", ("line", "S5", 2, -0.55)),
    ("sfx-c11", ("line", "S5", 2, 1.10)),
    ("sfx-c12", ("line", "S6", 1, 1.60)),
    ("sfx-c13", ("line", "S6", 2, 0.30)),
]
SFX = ([("sfx-whoosh", ("head", "S0", 0.20), 2.0, 0.18)] +
       [(sid, at, 0.37, 0.30) for sid, at in CLICKS] +
       [("sfx-sparkle", ("line", "S7", 2, -0.30), 1.8, 0.30),
        ("sfx-chime", ("line", "S7", 2, 1.50), 2.5, 0.34)])


def main():
    m = json.loads(MANIFEST.read_text(encoding="utf-8"))["scenes"]
    for k in ORDER:
        if k not in m:
            sys.exit(f"manifest 缺 {k}")

    vo = {k: m[k]["vo"] for k in ORDER}
    dur = {k: round(LEAD + vo[k] + PAD[k], 3) for k in ORDER}
    start, acc = {}, 0.0
    for k in ORDER:
        start[k] = round(acc, 3)
        acc = round(acc + dur[k], 3)
    TOTAL = round(acc, 3)

    def line(key, n):
        return m[key]["lines"][n - 1]

    def lt(key, n):
        return start[key] + LEAD + line(key, n)["start"]

    def ldur(key, n):
        L = line(key, n)
        return L["end"] - L["start"]

    def t_of(at):
        kind = at[0]
        if kind == "head":
            if len(at) == 3:
                return round(start[at[1]] + at[2], 3)
            return round(start["S0"] + at[1], 3)
        if kind == "line":
            return round(lt(at[1], at[2]) + at[3], 3)
        if kind == "frac":
            return round(lt(at[1], at[2]) + at[3] * ldur(at[1], at[2]), 3)
        raise ValueError(at)

    def d_of(d):
        if isinstance(d, (int, float)):
            return round(d, 3)
        if d[0] == "span":
            return round((lt(d[1], d[3]) + ldur(d[1], d[3])) - lt(d[1], d[2]), 3)
        if d[0] == "between":
            return round(t_of(d[2]) - t_of(d[1]), 3)
        raise ValueError(d)

    # ---------------- 生成 CUES ----------------
    out = ['        tl.from("#prog", { width: 0, duration: %s, ease: "none" }, 0);' % TOTAL]
    for k in ORDER:
        out.append("")
        out.append(f'        /* ---------- {SCENE_ID[k]} · {TITLES[k]} '
                   f'({start[k]} – {round(start[k]+dur[k],3)}) ---------- */')
        for c in CUES[k]:
            t = t_of(c["at"]); d = d_of(c["dur"]); sel = c["sel"]
            v = dict(c["vars"])
            ease = v.pop("ease", None)
            if c["mode"] == "fade":
                p = {"opacity": 0, "duration": d, "ease": ease or "power3.out"}
                p.update(v)
                out.append('        F("%s", %s, %s);' % (sel, t, _js(p)))
            elif c["mode"] == "show":
                # CSS 自然态 opacity:0 的元素（光标/标注框）必须用 fromTo 显式点亮
                y0 = v.pop("y", 0)
                out.append('        tl.fromTo("%s", { opacity: 0, y: %s }, { opacity: 1, y: 0, duration: %s, '
                           'ease: "%s", immediateRender: false }, %s);'
                           % (sel, y0, d, ease or "power3.out", t))
            elif c["mode"] == "glide":
                out.append('        tl.fromTo("%s", { x: %s, y: %s }, { x: %s, y: %s, duration: %s, '
                           'ease: "power2.inOut", immediateRender: false }, %s);'
                           % (sel, v["x0"], v["y0"], v["x1"], v["y1"], d, t))
            elif c["mode"] == "ring":
                rep = v.pop("repeats", 2)
                out.append('        tl.fromTo("%s", { scale: 0.3, opacity: 0.95 }, { scale: 1.7, opacity: 0, '
                           'duration: %s, repeat: %s, repeatDelay: 0.25, ease: "power1.out", '
                           'immediateRender: false }, %s);' % (sel, d, rep, t))
            elif c["mode"] == "zoom":
                out.append('        tl.fromTo("%s", { scale: 1 }, { scale: %s, transformOrigin: "%s", '
                           'duration: %s, ease: "power2.inOut", immediateRender: false }, %s);'
                           % (sel, v["to"], v["origin"], d, t))
            elif c["mode"] == "scalex":
                out.append('        tl.from("%s", { scaleX: 0, opacity: 0, duration: %s, ease: "%s" }, %s);'
                           % (sel, d, ease or "power2.out", t))
            elif c["mode"] == "wipe":
                out.append('        tl.from("%s", { width: 0, duration: %s, ease: "%s" }, %s);'
                           % (sel, d, ease or "power3.out", t))
            elif c["mode"] == "pulse":
                out.append('        tl.fromTo("%s", { scale: 1 }, { scale: %s, duration: %s, '
                           'ease: "power2.out", immediateRender: false }, %s);'
                           % (sel, v.pop("to", 1.02), d, t))
            elif c["mode"] == "dim":
                out.append('        tl.fromTo("%s", { opacity: 1 }, { opacity: %s, duration: %s, '
                           'ease: "power2.inOut", immediateRender: false }, %s);'
                           % (sel, v.pop("to", 0.4), d, t))
            else:
                sys.exit("未知 mode: " + c["mode"])
    cues_block = "\n".join(out)

    # ---------------- 生成字幕 ----------------
    subs, subs_tl = [], []
    for k in ORDER:
        for i, L in enumerate(m[k]["lines"], 1):
            sid = f"sub-{L['id']}"
            s0 = round(start[k] + LEAD + L["start"], 3)
            s1 = round(start[k] + LEAD + L["end"], 3)
            subs.append(f'        <div class="sline" id="{sid}">{L["text"]}</div>')
            subs_tl.append(
                f'        tl.fromTo("#{sid}", {{ opacity: 0 }}, {{ opacity: 1, duration: 0.16, '
                f'ease: "power1.out", immediateRender: false }}, {s0});')
            is_scene_last = (i == len(m[k]["lines"]))
            is_film_last = is_scene_last and (k == ORDER[-1])
            t_out = (round(start[k] + dur[k] - 0.45, 3) if is_film_last
                     else round(s1 + 0.10, 3))
            subs_tl.append(
                f'        tl.fromTo("#{sid}", {{ opacity: 1 }}, {{ opacity: 0, duration: 0.20, '
                f'ease: "power1.in", immediateRender: false }}, {t_out});')
    subs_block = "\n".join(subs)
    subs_tl_block = "\n".join(subs_tl)

    # ---------------- 生成 VO 音频 ----------------
    vo_block = []
    for i, k in enumerate(ORDER, 1):
        vo_block.append(
            f'      <audio id="vo{i}" data-start="{round(start[k] + LEAD, 3)}" '
            f'data-duration="{vo[k]}" data-track-index="1" src="assets/vo/{SCENE_ID[k]}.wav"></audio>')
    vo_block = "\n".join(vo_block)

    # ---------------- 写回 index.html ----------------
    s = HTML.read_text(encoding="utf-8")
    s = re.sub(r'^[ \t]*tl\.from\("#prog"[^\n]*\n', '', s, flags=re.M)
    s = re.sub(r'(/\* CUES:BEGIN \*/)[\s\S]*?(/\* CUES:END \*/)',
               lambda x: x.group(1) + "\n" + cues_block + "\n        " + x.group(2), s, count=1)
    s = re.sub(r'(/\* SUBS-TL:BEGIN \*/)[\s\S]*?(/\* SUBS-TL:END \*/)',
               lambda x: x.group(1) + "\n" + subs_tl_block + "\n        " + x.group(2), s, count=1)
    s = re.sub(r'(<!-- SUBS:BEGIN -->)[\s\S]*?(<!-- SUBS:END -->)',
               lambda x: x.group(1) + "\n" + subs_block + "\n        " + x.group(2), s, count=1)
    s = re.sub(r'(<!-- VO:BEGIN -->)[\s\S]*?(<!-- VO:END -->)',
               lambda x: x.group(1) + "\n" + vo_block + "\n      " + x.group(2), s, count=1)

    for k in ORDER:
        s = re.sub(rf'(<section class="scene clip" id="{SCENE_ID[k]}" data-start=")[0-9.]+(" data-duration=")[0-9.]+(")',
                   lambda x, a=start[k], b=dur[k]: x.group(1) + str(a) + x.group(2) + str(b) + x.group(3),
                   s, count=1)
    s = re.sub(r'(id="root"[\s\S]{0,400}?data-duration=")[0-9.]+(")',
               lambda x: x.group(1) + str(TOTAL) + x.group(2), s, count=1)
    s = re.sub(r'(id="bgm"\s*\n\s*data-start="0"\s*\n\s*data-duration=")[0-9.]+(")',
               lambda x: x.group(1) + str(TOTAL) + x.group(2), s, count=1)
    for sid, at, dn, vol in SFX:
        t = t_of(at); d = d_of(dn)
        pats = [re.compile(rf'(id="{sid}" data-start=")[0-9.]+(" data-duration=")[0-9.]+(")'),
                re.compile(rf'(id="{sid}"\s*\n\s*data-start=")[0-9.]+("\s*\n\s*data-duration=")[0-9.]+(")')]
        pat = next((p for p in pats if p.search(s)), None)
        if not pat:
            sys.exit(f"音效未找到: {sid}")
        s = pat.sub(lambda x, a=t, b=d: x.group(1) + str(a) + x.group(2) + str(b) + x.group(3), s, count=1)

    HTML.write_text(s, encoding="utf-8")
    print(json.dumps({"total": TOTAL,
                      "scene": {k: {"start": start[k], "dur": dur[k], "vo": vo[k]} for k in ORDER},
                      "lines": sum(len(m[k]["lines"]) for k in ORDER)}, ensure_ascii=False, indent=1))


def _js(p):
    parts = []
    for kk, vv in p.items():
        if isinstance(vv, str):
            parts.append(f'{kk}: "{vv}"')
        else:
            parts.append(f"{kk}: {vv}")
    return "{ " + ", ".join(parts) + " }"


if __name__ == "__main__":
    main()
