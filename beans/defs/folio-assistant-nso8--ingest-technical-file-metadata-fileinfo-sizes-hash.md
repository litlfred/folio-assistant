---
# folio-assistant-nso8
title: 'INGEST: technical file metadata — fileinfo, sizes, hashes, timestamps, mimetype'
status: todo
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-16T06:44:43Z
---

## What

Capture the mechanical facts about every ingested asset: file name, size,
SHA-256, mtime, and the **sniffed** mimetype rather than the one the extension
claims.

## Why the checksum is the load-bearing one

The `assets[]` decision lets a bibliography entry point at a **remote URL**
instead of a local binary. A remote asset with no checksum is an assertion; one
with a checksum is verifiable, and can be re-fetched and compared later.

## Done when

Every asset in `manifest.jsonld` carries these fields, and they are produced by
the ingest path rather than backfilled.

Diagram: `skills/workflows/ingest-derive-content.bpmn`, `Task_TechMeta`.
