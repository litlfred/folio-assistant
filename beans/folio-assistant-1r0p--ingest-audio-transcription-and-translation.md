---
# folio-assistant-1r0p
title: 'INGEST: audio — transcription and translation'
status: todo
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-16T06:44:43Z
---

## What

Audio content is transcribed, and the transcript translated into the folio's
languages.

## Done when

`library/<slug>/transcript/` holds the source-language transcript and each
translation, both referenced from `manifest.jsonld`, both carrying the
provenance stamp (`folio-assistant-iqim`), and both subject to the round-trip
QA (`folio-assistant-ktt2`).

Diagram: `docs/workflows/ingest-derive-content.bpmn`, `Task_Audio`.
