---
# folio-assistant-jo87
title: 'QUEUED STREAM A: INGEST — uploads/ to a complete L1 library (slw1, 13 open beans)'
status: in-progress
type: task
priority: normal
created_at: 2026-09-22T18:29:28Z
updated_at: 2026-09-23T06:49:25Z
parent: folio-assistant-slw1
---

## What this is

A **queued** stream: not claimed, not started. The owner asked on 2026-09-22
that as one active stream ends, the next be launched rather than leaving an
agent idle — this is one of three such queue entries covering the 49 beans the
three-GOAL split parked.

Status is `todo` **deliberately**. It becomes `in-progress` when a session is
actually launched against it, because the whole subject of stream 4 (`upgd`'s
sibling) is that 76 of 98 `in-progress` beans had nobody behind them. A queue
entry that claims itself in advance is that defect, committed by the bean
meant to document it.

## Scope

**`slw1` — INGEST: one pipeline from uploads/ to a complete L1 library** (13 open).

`apui` (one pipeline entry point — uploads/ to library/ through a single
documented path), `d5f1` (narrative description per image, localized, including
images extracted from PDFs), `p67i` (CSV and spreadsheet), `r8br` (**blocker**:
pdf-images classifies browser-print nav icons as figures, so 7 documents cannot
be completed), `rkqp`, `1r0p` (audio), `3psh`, `eief` (CSVW), `ktt2`
(round-trip translation QA), `r279` (which transcription backend, and what CI
pays for it), `v1hw`, `xeg6`, and the `slw1` epic itself.

## Why this one is first in the queue

**It has a named external consumer that is already blocked.** PR #881
(stream 3's surface) recorded finding `m4xy` and did not act on it:

> WHO's conceptual figures are **vector** and invisible to the raster
> extraction arm. `9789240120747-eng` declares six figures and eighteen tables
> and extracts **zero** images, reporting a *determined empty*. An entry can be
> L1-complete, gate-green, and missing every figure it declares.

That is an ingest defect surfaced by a goal stream that correctly declined to
widen its PR to fix it. `r8br` is the same shape from the other direction — the
classifier admitting the wrong things while `m4xy` is it missing the right ones.

**An L1-complete entry that is missing its figures is the `1xhc` defect wearing
an ingest hat**: a gate that reports a determined empty over content it cannot
see. Coordinate with stream 4, which owns that thesis.

## Before starting

- Re-measure. This entry was written 2026-09-22 and its counts are only as good
  as that timestamp.
- `r279` and the `deletion-requires-confirmation` questions in `fgkb`
  (`qou/uploads/` still holds #881's originals) are **owner decisions**, not
  yours. Ask them as selectable options.

## Done when

- [ ] A session is launched against this entry and moves it to `in-progress`
- [ ] `m4xy` and `r8br` both have a root cause, not a workaround
- [ ] `apui`'s single documented path exists and is the only one
