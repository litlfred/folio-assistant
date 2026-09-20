---
# folio-assistant-1r0p
title: 'INGEST: audio — transcription and translation'
status: todo
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-20T04:16:04Z
parent: folio-assistant-slw1
blocked_by:
    - folio-assistant-68dt
---

## What

Audio content is transcribed, and the transcript translated into the folio's
languages.

## Done when

`library/<slug>/transcript/` holds the source-language transcript and each
translation, both referenced from `manifest.jsonld`, both carrying the
provenance stamp (`folio-assistant-iqim`), and both subject to the round-trip
QA (`folio-assistant-ktt2`).

Diagram: `skills/workflows/ingest-derive-content.bpmn`, `Task_Audio`.

_2026-09-19T16:20Z_ — **Blocked on `folio-assistant-68dt`** (declare Python
dependencies and install them in CI).

- **waits on**: a working backend for audio transcription that CI also has. Measured absent
  2026-09-19; `pip` reaches an index but CI installs only `ruff`, so anything
  built now would ship an untested path — the `5rfy` defect.
- **since**: 2026-09-19.
- **expires**: 2026-10-19. After that, presume this stale and re-measure rather
  than trusting it.
- **handoff**: if `68dt` has landed, this is ordinary work — unblock and
  proceed. If it has not, do NOT hand-roll a parser; say what is missing.
  For `d5f1`, read this bean's measurement first: the image count is not the
  figure count, and 121 of `who-pub-tps-931`'s images are page scans.

_2026-09-20T04:20Z_ — **Still blocked. I unblocked this in error and am
correcting it in the same turn.**

`68dt` declared the Python dependencies the scripts actually IMPORT, and
**there is no audio script**, so nothing declared or installed a transcription
backend. `whisper`, `faster_whisper`, `vosk`, `speech_recognition`, `pydub` and
`soundfile` were all absent when measured 2026-09-19 and all still are —
`68dt` changed nothing for this arm.

What `68dt` did change: the MECHANISM is now in place. Adding a transcription
backend is one entry in `schemas/python-deps.ts` with its tier and cost, and
`check:python-deps` will refuse an audio script that imports something
undeclared. So the block is narrower than it was — it needs a decision about
WHICH backend and what it costs, not a missing convention.

- **waits on**: a transcription backend chosen and declared, plus audio in
  `uploads/` to run it over. Zero audio files present.
- **since**: 2026-09-19. **expires**: 2026-10-19.
- **handoff**: size the backend before proposing it. The `68dt` precedent is
  that a 323 MB dependency for one script is declared `extended` and kept out
  of CI rather than dropped — a local Whisper model is likely that shape or
  larger, so measure before assuming CI can carry it.
