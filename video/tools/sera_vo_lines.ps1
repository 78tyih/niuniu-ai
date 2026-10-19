$ErrorActionPreference = "Stop"
$env:HF_HUB_OFFLINE = "1"
$env:TRANSFORMERS_OFFLINE = "1"
$env:PYTHONIOENCODING = "utf-8"
$env:PYTHONUTF8 = "1"

$py = "C:\Users\A\Miniconda3\envs\qwen3-tts\python.exe"
$env:PATH = "C:\Users\A\Miniconda3\envs\qwen3-tts;C:\Users\A\Miniconda3\envs\qwen3-tts\Library\bin;$env:PATH"

& $py "D:\AI\Voice\Qwen3-TTS\clone-test\sera_vo_lines.py"
exit $LASTEXITCODE
