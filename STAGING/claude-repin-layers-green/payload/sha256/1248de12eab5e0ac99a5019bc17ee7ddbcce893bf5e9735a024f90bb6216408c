---
# folio-assistant-n0vx
$schema: bean/1.0.0
title: 'CONNECTED AGENT: transcribe the smart-ra recording with whisper.cpp (1r0p network block)'
status: todo
type: task
priority: normal
created_at: 2026-10-24T08:25:00Z
updated_at: 2026-10-24T08:25:00Z
parent: folio-assistant-slw1
---

Owner, 2026-10-24 (structured question Q5 on `1r0p`): *"make bean for connected agent"*. Cloud sessions can't download recogniser weights: every one is on huggingface.co, which this network policy refuses (owner, 2026-10-11: *"i cant unblock huggingface.co"*). The connected agent, the owner's local agent with ordinary internet, does this one step. Everything after it (comparing with the Teams `.vtt`, the name and term list) needs no network, so `1r0p` resumes in any session.

The default independent recogniser is whisper.cpp (owner ruling, 2026-10-10, recorded on `1r0p`).

## Steps (from `1r0p`)

```sh
ffmpeg -i smart-ra/uploads/output.mp4 -vn -ac 1 -ar 16000 -c:a pcm_s16le output.wav
git clone https://github.com/ggml-org/whisper.cpp && cd whisper.cpp && cmake -B build && cmake --build build -j
sh ./models/download-ggml-model.sh base
./build/bin/whisper-cli -m models/ggml-base.bin -f ../output.wav -oj -of output.whisper-base
```

## Done when
- [ ] `output.whisper-base.json` is committed to litlfred/smart-ra `uploads/`, beside a note naming the tool, its version, the model (`ggml-base.bin`) and the WAV's SHA-256
- [ ] `1r0p` carries a note pointing at that commit, so a cloud session can do the comparison

Session https://claude.ai/code/session_01FABZmtqnNeBaTcHsXrtyK7.
