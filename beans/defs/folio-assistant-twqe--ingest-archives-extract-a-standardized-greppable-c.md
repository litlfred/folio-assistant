---
# folio-assistant-twqe
title: 'INGEST: archives — extract a standardized greppable contents manifest'
status: todo
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-16T06:44:43Z
---

## What

A tar or zip lands in `uploads/` and its contents are opaque to every grep in
the corpus until something lists them **as data**.

Extract a standardized `contents` manifest — one schema, whatever the archive
format — so the entry list is greppable and joins the L1 source graph as part
of that document's own record.

## Per entry

Path, size, mimetype, checksum, timestamp. These are the same fields the
technical-metadata bean (`folio-assistant-nso8`) defines for a loose file; an
archive entry is not a different kind of thing.

## Done when

`library/<slug>/contents.jsonld` exists for every archive, is referenced from
`manifest.jsonld`, and a grep for a filename inside an archive finds it.

Diagram: `skills/workflows/ingest-derive-content.bpmn`, `Task_Archive`.
