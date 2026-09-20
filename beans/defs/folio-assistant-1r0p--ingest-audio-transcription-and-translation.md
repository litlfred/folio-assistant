---
# folio-assistant-1r0p
title: 'INGEST: audio — transcription and translation'
status: todo
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-19T16:20:36Z
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
