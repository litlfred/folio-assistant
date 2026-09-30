---
# folio-assistant-x80s
title: 'INGEST: agent summaries of prose blocks, a QA sidecar drained slowly during ingestion'
status: in-progress
type: task
priority: normal
created_at: 2026-09-24T05:54:04Z
updated_at: 2026-09-30T08:24:16Z
parent: folio-assistant-slw1
---

Issue #1250.

Owner, 2026-09-24:

> on library/ page, the extract of a node is shown, but no agentic summary

and, on scope:

> Make as QA sidecar as part of general doc ingestion to slowly drain.

## The design

- `library/<slug>/summaries.json`, `folio-block-summaries/v1` (`schemas/block-summary.ts`): one record per prose block with `block`, `source`, `source_hash` (sha256 of the section text the summariser saw) and a `narrative` from `schemas/narrative.ts`. The block itself stays verbatim and `ingested`.
- A changed source makes the record STALE: back in the queue, and `bun run narratives` refuses to confirm it.
- The queue is derived: prose blocks in every declared library, minus current drafts and confirmations. `bun run summaries`, `summaries:next -- --n K`, `summaries:record`.
- The backlog is reported by `check:l1-complete` (`block-summaries`, advisory) and on the library page. A malformed sidecar or a record for a missing block is `unmet`.
- `document-ingestion.bpmn` has the step `Task_SummaryQueue` after promotion.

## Backlog

Measured 2026-09-24: 1335 prose blocks, 10 with empty text, so 1325 to summarise. The first drain did `cat-harness/library/arxiv-2312.07755v1` (22 blocks, drafts), which leaves **1303**. `bun run summaries` has the current figure.

## Todo

- [x] sidecar schema, registered on the `library` graph kind, with its semantic QA in `check:l1-complete`
- [x] drain commands, and the narratives review reads the sidecar
- [x] viewer: the summary beside the extract, with a state badge; wireframe updated
- [x] first drain: arxiv-2312.07755v1, 22 drafts
- [ ] drain the rest a few blocks at a time during ingestion work
- [ ] a person reviews the drafts (`bun run narratives`)

## Owner decision, 2026-09-24

**Library summaries for `agent-skills` entries → "No, keep held back".** The drain does not draft summaries for the entries in `agent-skills/library/`. No code change.



## Claim released 2026-09-29

Released `in-progress` → `todo` on the owner's instruction (review session https://claude.ai/code/session_014Qj8wncQhqV52QGN1yZDnj). No git change to this bean since before 2026-09-26, no holder recorded, and no open branch touches it; the sessions that held theme D (content folios, SMART/FHIR stack, ingest) work stopped on the 2026-09-25 weekly usage limit. Nothing in the body was changed: re-claim with `bun run beans:claim <id>`.


## 2026-09-30 — owner decisions, applied
- **Hold-back enforced** (owner: 'Enforce in queue'). New ContentDirectory field summaries: 'drain'|'held', declared on agent-skills' OWN library entry (not the cat-harness mirror). summaries.ts heldLibraries() reads it from the owning declaration; entryDirs/next/backlog/check:l1-complete skip it; the listing prints 'held: agent-skills/library/'. Backlog 1693 → 1509 of 1531.
- **Attribution** (owner: options B+C, after the model field was explained in full). model stays REQUIRED for an agent (C); MODEL_NOT_DISCLOSED = 'not-disclosed' is now DECLARED in schemas/attribution.ts (B) and requires a session URL so the model stays recoverable. 28 earlier figure descriptions already used it. The viewer says 'model not disclosed (recoverable from its session)'. Drafts from sessions that may not write a model identifier can now be recorded honestly.
- [ ] drain the rest a few blocks at a time (unblocked)
- [ ] a person reviews the drafts (bun run narratives)
