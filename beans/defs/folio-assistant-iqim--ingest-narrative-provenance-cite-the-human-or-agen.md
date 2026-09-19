---
# folio-assistant-iqim
title: 'INGEST: narrative provenance — cite the human or agent (with model version) that wrote it'
status: in-progress
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-19T15:17:59Z
parent: folio-assistant-slw1
---

## What

Every generated narrative — an image description, a transcript, a translation,
a dataset summary — records **who wrote it**: a human, or an agent together with
its **model version**.

## Why

A narrative description is a claim by someone, not a property of the file. The
difference between "a human curator described this figure" and "a model
described this figure, version X" is exactly the difference a reader needs in
order to weigh it — and it is unrecoverable once lost.

It also makes a stale description findable: when a model is superseded, its
descriptions can be re-generated or re-reviewed *as a set*.

## Done when

The provenance field is required by the schema, not merely permitted, and the
L1 completeness gate (`folio-assistant-pn6j`) fails a narrative that lacks it.

Diagram: `skills/workflows/ingest-derive-content.bpmn`, `Task_Provenance`.

_2026-09-19T15:17:59Z_ — Claimed by claude/ecstatic-goldberg-eroyaz — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
