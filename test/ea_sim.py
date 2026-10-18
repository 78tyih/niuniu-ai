#!/usr/bin/env python3
"""
EA 侧校验逻辑的 Python 复刻 —— 用于在没有 MetaEditor 的机器上做协议一致性回归。

这不是"参考实现"，而是把 NiuNiuBridge.mq5 里的 JsonStr / JsonNum / PayloadSub /
NNFmtNum / HMACSHA256Hex / canonical 逐行照抄成 Python，用来验证 JS 侧 protocol.js
生成的签名能被 EA 侧原样验过。

之所以可信：MQL5 的 SHA256Hex 已对照 hashlib.sha256 逐例验证通过（6/6），
HMAC 是标准 ipad/opad 构造，canonical 是纯字符串拼接 —— 三者都不含语言特性差异。
"""
import hashlib
import hmac
import json
import sys


# ---- MQL5 JsonStr 的逐行复刻 ----
def json_str(src: str, key: str) -> str:
    needle = '"' + key + '"'
    p = src.find(needle)
    if p < 0:
        return ""
    p = src.find(":", p)
    if p < 0:
        return ""
    p += 1
    while p < len(src) and src[p] in " \t":
        p += 1
    if p >= len(src):
        return ""
    if src[p] == '"':
        q = src.find('"', p + 1)
        if q < 0:
            return ""
        return src[p + 1:q]
    e = p
    while e < len(src):
        if src[e] in ",}]":
            break
        if src[e] in " \n\r":
            break
        e += 1
    return src[p:e]


def json_num(src: str, key: str) -> float:
    v = json_str(src, key)
    if v == "" or v == "null":
        return 0.0
    try:
        return float(v)
    except ValueError:
        return 0.0


# ---- MQL5 PayloadSub 的逐行复刻 ----
def payload_sub(src: str) -> str:
    p = src.find('"payload"')
    if p < 0:
        return ""
    p = src.find(":", p)
    if p < 0:
        return ""
    b = src.find("{", p)
    if b < 0:
        return ""
    depth = 0
    instr = False
    i = b
    while i < len(src):
        c = src[i]
        if instr:
            if c == "\\":
                i += 2
                continue
            if c == '"':
                instr = False
            i += 1
            continue
        if c == '"':
            instr = True
            i += 1
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return src[b:i + 1]
        i += 1
    return ""


# ---- MQL5 NNFmtNum 的逐行复刻 ----
def nn_fmt_num(v: float) -> str:
    if abs(v) < 1e-12:
        return "0"
    if abs(v) >= 1e15:
        return "%.0f" % v
    s = "%.8f" % v
    while len(s) > 0 and s[-1] == "0":
        s = s[:-1]
    if len(s) > 0 and s[-1] == ".":
        s = s[:-1]
    return s


def ea_canonical(raw: str) -> str:
    """与 NiuNiuBridge.mq5 PumpInbox() 里的 canonical 完全一致（10 段）。"""
    psub = payload_sub(raw)
    return "|".join([
        json_str(raw, "id"),
        json_str(raw, "type"),
        json_str(raw, "account"),
        json_str(raw, "account_server"),
        nn_fmt_num(json_num(raw, "session_epoch")),
        json_str(psub, "symbol"),
        json_str(psub, "side"),
        nn_fmt_num(json_num(psub, "volume_lots")),
        nn_fmt_num(json_num(psub, "sl_points")),
        nn_fmt_num(json_num(psub, "tp_points")),
    ])


def ea_hmac(secret: str, msg: str) -> str:
    """标准 HMAC-SHA256 —— MQL5 侧 HMACSHA256Hex 的等价实现。"""
    return hmac.new(secret.encode("utf-8"), msg.encode("utf-8"), hashlib.sha256).hexdigest()


def verify(cmd: dict, secret: str) -> tuple:
    raw = json.dumps(cmd, separators=(",", ":"), ensure_ascii=False)
    expect = ea_hmac(secret, ea_canonical(raw))
    return expect == cmd.get("sig"), expect, ea_canonical(raw)


def main():
    vectors = json.load(open(sys.argv[1], encoding="utf-8"))
    secret = vectors["secret"]
    ok = fail = 0
    for i, c in enumerate(vectors["commands"], 1):
        good, expect, canon = verify(c, secret)
        if good:
            ok += 1
        else:
            fail += 1
            print(f"  ✗ #{i} {c['type']}")
            print(f"      canonical JS-side : {vectors['canonicals'][i-1]}")
            print(f"      canonical EA-side : {canon}")
            print(f"      sig(cmd)          : {c['sig']}")
            print(f"      sig(EA recompute) : {expect}")
    print(f"\nEA 侧验签: {ok} PASS / {fail} FAIL  (共 {ok+fail} 条)")
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
