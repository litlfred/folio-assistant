---
# folio-assistant-dwf1
$schema: bean/1.0.0
title: 'Memory: Q-VO-1 = A (2026-11-11): Chatterbox Multilingual (MIT) chosen for game narration in 6 UN languages; sandbox setup and gotchas'
status: completed
type: task
priority: low
created_at: 2026-11-11T11:13:59Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `voiceover-chatterbox.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Q-VO-1 = A (2026-11-11): Chatterbox Multilingual (MIT) chosen for game narration in 6 UN languages; sandbox setup and gotchas

User picked Chatterbox Multilingual (Resemble AI, MIT, pip chatterbox-tts) for GDHCN onboarding game narration, one voice across ar/en/es/fr/ru/zh. Thread "Find open voiceover tools for game videos" (cmsg_017WNUkNK8kdDziPK58Pv6G9XbRVsqzVDdj3KADugUDPDT). eSpeak samples were judged "horrible" by user — don't offer eSpeak again.

Setup that works in the cloud sandbox (Default env now allows huggingface.co, us.aws.cdn.hf.co and xethub hosts; download.pytorch.org still 403, so torch comes from PyPI):
- venv, `pip install chatterbox-tts`, then `pip install "setuptools<81"` (perth watermarker needs pkg_resources).
- `ChatterboxMultilingualTTS.from_pretrained(device="cpu")`, generate per sentence (whole paragraph gets cut short), join with 0.35 s gaps. ~80 s CPU per 20 s beat.
- Spell "T N G bot" and "G P G". Takes vary: check each with faster-whisper (feed numpy audio; av open() bug) and regenerate bad ones (es pass 1 had a junk tail).
- Q-VO-2 = B: only beat-04 en/fr replaced (other beats keep Naomi/Hélène). User said first take "too fast but sounds ok": fix = ffmpeg atempo=0.88 + loudnorm (en -29.7, fr -17.3 LUFS); lower cfg_weight added junk words. Issue smart-trust#190, PR #191 merged by user 2026-11-11 18:07Z (script onboarding-game/scripts/narrate-chatterbox.py). Samples in /mnt/project-files/voiceover-tools-2026-11-11/chatterbox/.
Related: folio-assistant-jjwk.
