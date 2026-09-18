---
# folio-assistant-ktt2
title: 'INGEST: round-trip translation QA — back-translate to catch semantic drift and bad terminology'
status: todo
type: task
priority: normal
created_at: 2026-09-16T06:43:50Z
updated_at: 2026-09-16T06:44:43Z
---

## What

Back-translate each localized narrative into its source language and compare
meaning with the original. Flag semantic mismatch and bad terminology.

## Why a round trip rather than a forward check

A forward-only check asks "is this fluent target-language text?" — which a
confident mistranslation passes. The round trip asks whether the MEANING
survived, which is the property actually wanted, and it needs no reference
translation to work.

## What it cannot do

It can establish that two readings differ. **Which one is right is a human
call** — the diagram routes a flagged passage to a reviewer rather than
auto-correcting it.

## Done when

The round trip runs over every localized narrative in the completeness gate,
mismatches become reviewer-adjudicated findings, and a terminology miss is
distinguishable in the output from a general semantic drift.

Diagram: `skills/workflows/ingest-l1-completeness-gate.bpmn`, `Task_RoundTrip`.
