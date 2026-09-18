---
# folio-assistant-pn6j
title: 'INGEST: L1 completeness gate — derived content must be present before L1 KG is complete'
status: todo
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-16T06:44:43Z
---

## What

**L1 source to L1 KG is NOT complete while a required derived artefact is
missing.** Make that a gate rather than an aspiration.

## What it checks

Archive contents, technical metadata, image descriptions, audio transcripts,
tabular records, and the provenance stamp on each narrative — each required
only where the document actually has that kind of content.

## Why a gate and not a report

Without it, every derivation step above is optional in practice: the document
lands in `library/`, reads as ingested, and the gap is discovered by whoever
next needs the missing artefact. A gate turns that into a tracked bean at
ingest time, which is the one moment the context is still in hand.

## Done when

The gate runs in the ingest path, a failure opens a bean and holds the document
in `uploads/`, and the verdict is recorded on the document.

Diagram: `skills/workflows/ingest-l1-completeness-gate.bpmn`.
