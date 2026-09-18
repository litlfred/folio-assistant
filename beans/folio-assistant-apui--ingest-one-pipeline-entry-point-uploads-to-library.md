---
# folio-assistant-apui
title: 'INGEST: one pipeline entry point — uploads/ to library/ through a single documented path'
status: todo
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-16T06:44:42Z
---

## What

`uploads/` and `library/` are two stages of ONE pipeline, but there is no single
entry point that takes a file across. Today the move is done by
`scripts/migrate-uploads-to-library.py` plus whatever the ingesting agent
remembers to run.

## Why it matters more than it looks

**The corpus-grep checklist searches `library/` only.** Anything still in
`uploads/` is invisible to every "has the corpus already got this?" check — so
an un-ingested paper does not merely sit unread, it makes a *clean grep* mean
"nobody has done this" when the source is right there. That is exactly how a
held result gets re-derived.

## Done when

One documented command takes a file from `uploads/` to `library/<bib-slug>/`
with structure, derived content, the Dublin Core record and the manifest, and
every other path is a wrapper around it or is deleted.

Diagram: `docs/workflows/document-ingestion.bpmn` (`Process_Ingestion`).
