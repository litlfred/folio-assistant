---
# folio-assistant-n0vx
$schema: bean/1.0.0
title: 'CONNECTED AGENT: transcribe the smart-ra recording with whisper.cpp (1r0p network block)'
status: completed
type: task
priority: normal
created_at: 2026-10-24T08:25:00Z
updated_at: 2026-10-24T13:42:30+02:00
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
- [x] `output.whisper-base.json` is committed to litlfred/smart-ra `uploads/`, beside a note naming the tool, its version, the model (`ggml-base.bin`) and the WAV's SHA-256
- [x] `1r0p` carries a note pointing at that commit, so a cloud session can do the comparison

Session https://claude.ai/code/session_01FABZmtqnNeBaTcHsXrtyK7.

## Results (2026-10-24, connected agent)
- Extracted `output.wav` (`e63fba5ee95c5c2e973ed8cc1739bb409978713c6f883c2cc374132fe49fef01`) from `smart-ra/uploads/output.mp4` (`a6df5f1f8961ba6cf29e12df9792a6a2a8981b1bb8a156862394a8dc457d2eb2`).
- Built `ggml-org/whisper.cpp` (`231638a071`) and ran `whisper-cli` with `models/ggml-base.bin` (`60ed5bc3dd14eea856493d334349b405782ddcaf0028d4b5df4088345fba2efe`), producing `uploads/output.whisper-base.json` (139 segments, 2,395 words) and `uploads/README.md` in [`litlfred/smart-ra#91`](https://github.com/litlfred/smart-ra/pull/91) (`052cb21f`).
- Recorded full provenance and `.vtt` comparison note on `folio-assistant-1r0p` (`c8b2d29c32`).
