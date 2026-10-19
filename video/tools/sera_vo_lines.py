# -*- coding: utf-8 -*-
"""逐句生成 Sera 克隆配音（Qwen3-TTS ICL）。一次加载模型，循环出全部句子。牛牛AI 终端演示版。"""
import os, json, wave
import numpy as np
import torch
from qwen_tts import Qwen3TTSModel

MODEL = r"E:\AI_Models\huggingface\hub\models--Qwen--Qwen3-TTS-12Hz-1.7B-Base\snapshots\fd4b254389122332181a7c3db7f27e918eec64e3"
REF = r"D:\AI\Voice\Qwen3-TTS\voice-reference\sera_upload_24k.wav"
REF_TXT = r"D:\AI\Voice\Qwen3-TTS\voice-reference\sera_ref_transcript.txt"
LINES_JSON = r"D:\AI\Voice\Qwen3-TTS\clone-test\vo_lines.json"
OUTDIR = r"D:\AI\Voice\Qwen3-TTS\clone-test\nn-lines"
os.makedirs(OUTDIR, exist_ok=True)

spec = json.load(open(LINES_JSON, encoding="utf-8"))
ref_text = open(REF_TXT, encoding="utf-8").read().strip()

print("loading Qwen3-TTS Base ...", flush=True)
tts = Qwen3TTSModel.from_pretrained(MODEL, torch_dtype="auto", local_files_only=True)
tts.model = tts.model.to("cuda")
tts.device = torch.device("cuda")

report = []
for scene, node in spec["scenes"].items():
    for i, text in enumerate(node["lines"], 1):
        lid = f"{scene}-{i}"
        print("generating", lid, flush=True)
        wavs, sr = tts.generate_voice_clone(
            text=text, language="Chinese", ref_audio=REF, ref_text=ref_text,
            x_vector_only_mode=False, non_streaming_mode=True,
        )
        arr = np.clip(np.asarray(wavs[0]), -1, 1)
        pcm = (arr * 32767).astype(np.int16)
        out = os.path.join(OUTDIR, lid + ".wav")
        with wave.open(out, "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
            w.writeframes(pcm.tobytes())
        dur = round(len(arr) / sr, 3)
        peak = round(float(np.max(np.abs(arr))), 3)
        report.append({"id": lid, "text": text, "dur": dur, "sr": sr, "peak": peak})
        print("   saved", lid, "dur=", dur, "peak=", peak, flush=True)

print("SERA_LINES_REPORT " + json.dumps({"lines": report}, ensure_ascii=False), flush=True)
print("SERA_LINES_DONE", flush=True)
