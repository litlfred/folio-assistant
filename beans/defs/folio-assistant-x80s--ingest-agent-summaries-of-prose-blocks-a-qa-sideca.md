---
# folio-assistant-x80s
$schema: bean/1.0.0
title: 'INGEST: agent summaries of prose blocks, a QA sidecar drained slowly during ingestion'
status: todo
type: task
priority: normal
created_at: 2026-09-24T05:54:04Z
updated_at: 2026-10-26T15:06:00Z
parent: folio-assistant-slw1
---

Issue #1250.

Owner, 2026-09-24:

> on library/ page, the extract of a node is shown, but no agentic summary

and, on scope:

> Make as QA sidecar as part of general doc ingestion to slowly drain.

## The design

- `library/<slug>/summaries.json`, `folio-block-summaries/v1` (`schemas/block-summary.ts`): one record per prose block with `block`, `source`, `source_hash` (sha256 of the section text the summariser saw) and a `narrative` from `schemas/narrative.ts`. The block itself stays verbatim and `ingested`.
- A changed source makes the record STALE: back in the queue, and `bun run cat narratives` refuses to confirm it.
- The queue is derived: prose blocks in every declared library, minus current drafts and confirmations. `bun run cat summaries`, `summaries:next -- --n K`, `summaries:record`.
- The backlog is reported by `check:l1-complete` (`block-summaries`, advisory) and on the library page. A malformed sidecar or a record for a missing block is `unmet`.
- `document-ingestion.bpmn` has the step `Task_SummaryQueue` after promotion.

## Backlog

Measured 2026-09-24: 1335 prose blocks, 10 with empty text, so 1325 to summarise. The first drain did `cat-harness/library/arxiv-2312.07755v1` (22 blocks, drafts), which leaves **1303**. `bun run cat summaries` has the current figure.

## Todo

- [x] sidecar schema, registered on the `library` graph kind, with its semantic QA in `check:l1-complete`
- [x] drain commands, and the narratives review reads the sidecar
- [x] viewer: the summary beside the extract, with a state badge; wireframe updated
- [x] first drain: arxiv-2312.07755v1, 22 drafts
- [ ] drain the rest a few blocks at a time during ingestion work
- [ ] a person reviews the drafts (`bun run cat narratives`)

## Owner decision, 2026-09-24

**Library summaries for `agent-skills` entries → "No, keep held back".** The drain does not draft summaries for the entries in `agent-skills/library/`. No code change.



## Claim released 2026-09-29

Released `in-progress` → `todo` on the owner's instruction (review session https://claude.ai/code/session_014Qj8wncQhqV52QGN1yZDnj). No git change to this bean since before 2026-09-26, no holder recorded, and no open branch touches it; the sessions that held theme D (content folios, SMART/FHIR stack, ingest) work stopped on the 2026-09-25 weekly usage limit. Nothing in the body was changed: re-claim with `bun run cat beans:claim <id>`.


## 2026-09-30 — owner decisions, applied
- **Hold-back enforced** (owner: 'Enforce in queue'). New ContentDirectory field summaries: 'drain'|'held', declared on agent-skills' OWN library entry (not the cat-harness mirror). summaries.ts heldLibraries() reads it from the owning declaration; entryDirs/next/backlog/check:l1-complete skip it; the listing prints 'held: agent-skills/library/'. Backlog 1693 → 1509 of 1531.
- **Attribution** (owner: options B+C, after the model field was explained in full). model stays REQUIRED for an agent (C); MODEL_NOT_DISCLOSED = 'not-disclosed' is now DECLARED in schemas/attribution.ts (B) and requires a session URL so the model stays recoverable. 28 earlier figure descriptions already used it. The viewer says 'model not disclosed (recoverable from its session)'. Drafts from sessions that may not write a model identifier can now be recorded honestly.
- [ ] drain the rest a few blocks at a time (unblocked)
- [ ] a person reviews the drafts (bun run cat narratives)

_2026-09-30T08:24:12Z_ — Claimed by claude/brave-hawking-511rrx — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

_2026-10-16T10:30:00Z_ — Back to `todo`: nobody is holding this; its last note says it is parked (waiting on a trigger, a ruling or a deferred row), and an untouched `in-progress` claim misleads sibling sessions (owner choice, https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP).

## 2026-10-24 — drain batch
- 13 drafts for `cat-harness/library/kg-folio-asst-2026-09-30` (the scfh deck), in `litlfred/cat-harness#493`. `drafted_by.model` is `not-disclosed` with the session URL.
- Measured with `bun run cat summaries` at the folio-assistant lock: 2848 of 3267 prose blocks awaited a summary before this batch, so 2835 after it. 419 drafts (432 after) await a person; 0 confirmed.
Session https://claude.ai/code/session_01TkFVzHu3LN6P5Nj2psquPU.

_2026-10-24T08:16:00Z_ — Claimed by the cloud drain thread "Drain content model and ingest beans" (session https://claude.ai/code/session_01TkFVzHu3LN6P5Nj2psquPU). Open work: summary batches, litlfred/cat-harness#493.

_2026-10-24T09:27:19Z_ — litlfred/cat-harness#493 merged (40254023): 13 kg-deck drafts are on main and wait for a person in `bun run cat narratives`. More batches still to drain.

_2026-10-24T10:55:29Z_ — Claim released by the cloud drain thread; the next batch is open to anyone.

_2026-10-24T10:56:06Z_ — Re-claimed by the cloud drain thread "Drain content model and ingest beans" (owner extended the window to ~13:48Z; session https://claude.ai/code/session_01TkFVzHu3LN6P5Nj2psquPU).

_2026-10-24T13:37:00Z_ — litlfred/cat-harness#543 merged (e8e4cb0f): 15 English drafts for Halko–Martinsson–Tropp (arxiv-0909.4061v2, pages 1–15) are on main and wait for a person. Claim released; later batches are open to anyone.

_2026-10-24T13:42:00Z_ — Re-claimed by the cloud drain thread "Drain content model and ingest beans" (owner window to ~16:48Z; session https://claude.ai/code/session_01TkFVzHu3LN6P5Nj2psquPU).

_2026-10-24T14:14:00Z_ — litlfred/folio-assistant-core#217 merged (231045cd): 22 English drafts for Doc-Researcher (arxiv-2510.21603v1, every prose block) are on main and wait for a person.

_2026-10-24T14:27Z_ — cat-harness#585 merged (summaries batch).

_2026-10-24T14:45Z_ — batch 5 opened as cat-harness#587: 18 blocks in arxiv-2504.21474v1, sammut-bonnici-galea-2015-swot-analysis.

_2026-10-24T14:41Z_ — cat-harness#587 merged (batch 5, 18 blocks).

_2026-10-24T15:05Z_ — batch 6 opened as cat-harness#589: 25 blocks in arxiv-2508.05192v2, gurel-tat-2017-swot-analysis.

_2026-10-24T14:53Z_ — cat-harness#589 merged (batch 6, 25 blocks).

_2026-10-24T14:56Z_ — batch 7 opened as cat-harness#591: 35 blocks in arxiv-2605.03537v1, arxiv-2505.10399v1.

_2026-10-24T15:10Z_ — cat-harness#591 merged (batch 7, 35 blocks of arxiv-2605.03537v1 and arxiv-2505.10399v1).

_2026-10-24T15:22Z_ — cat-harness#593 merged (batch 8, 19 blocks of arxiv-2504.07199v3).

_2026-10-24T15:24Z_ — cat-harness#594 merged (batch 9, 19 blocks of arxiv-2601.04544v1).

_2026-10-24T15:45Z_ — cat-harness#596 merged (batch 10, 20 blocks of arxiv-2202.02427v1).

_2026-10-24T15:48Z_ — cat-harness#598 merged (batch 11, 26 blocks of arxiv-2504.19675v2).

_2026-10-24T16:00Z_ — cat-harness#600 merged (batch 12, 32 blocks of arxiv-2405.14766v2).

_2026-10-24T16:03Z_ — cat-harness#601 merged (batch 13, 31 blocks of arxiv-2507.23348v1).

_2026-10-24T16:03Z_ — cat-harness#602 merged (batch 14, 31 blocks of arxiv-2402.02172v5).

_2026-10-24T16:13Z_ — cat-harness#603 merged (batch 15, 20 blocks of arxiv-2508.21620v2).

_2026-10-24T16:21Z_ — cat-harness#605 merged (batch 17, 24 blocks of arxiv-2606.04382v1).

_2026-10-24T16:24Z_ — cat-harness#604 merged (batch 16, 21 blocks of arxiv-2404.04834v4).

_2026-10-24T16:24Z_ — Window wrap-up: cat-harness#583 and #585–#605 merged; all drafts are on main and wait for a person. Claim released; later batches are open to anyone.

_2026-10-26T10:43Z_ — batch 18 opened as litlfred/cat-harness#617: 43 English drafts, every prose block of arxiv-2607.00053v1 (22) and qi-hessen-vanderheijden-2023-ca-vs-lsa (21); `drafted_by.model` is `claude-opus-5-5`. Backlog 1195 → 1152 of 1591. Session https://claude.ai/code/session_013ZJ1uYnvBifNcPaVPVJbUS.

_2026-10-26T10:57Z_ — cat-harness#617 merged (a0802db6, batch 18, 43 blocks); the drafts wait for a person. Not claimed; later batches are open to anyone.

_2026-10-26T14:03:00Z_ — batch 19 opened as `litlfred/cat-harness#621` (`2962f3a5`): 25 English draft summaries across `arxiv-2607.14456v1` (all 24 prose blocks) and `strauch-carbno-2025-spdx-3-1-supply-chain` (all 1 prose block); `drafted_by.model` is `not-disclosed` with session `conversation://4b870190-b691-495d-b192-749a1f7716b4`. Backlog in `cat-harness/library/` 1152 → 1127 of 1591 prose blocks (464 drafts await human confirmation).

_2026-10-26T14:37:00Z_ — batch 20 opened as `litlfred/cat-harness#624` (`00f84c34`): 26 English draft summaries across `w3c-2013-prov-o` (all 26 non-empty prose blocks); `drafted_by.model` is `not-disclosed` with session `conversation://9d378f5b-95ff-4698-940b-031bda9dd228`. Backlog in `cat-harness/library/` 1127 → 1101 of 1591 prose blocks (when combined with `#621`; 1152 → 1126 against `main` alone; 490 drafts await human confirmation).

_2026-10-26T14:59:00Z_ — batch 21 opened as `litlfred/cat-harness#628` (`ac9d846f`): 34 English draft summaries across `deerwester-1990-indexing-by-lsa` (all 34 prose blocks); `drafted_by.model` is `not-disclosed` with session `conversation://a78f04cc-123c-4278-9eaf-5fe7207e634e`. Backlog in `cat-harness/library/` 1101 → 1067 of 1591 prose blocks (when combined with `#621` and `#624`; 1152 → 1118 against `main` alone; 524 drafts await human confirmation).

_2026-10-26T15:06:00Z_ — batch 22 opened as `litlfred/cat-harness#629` (`2c5e5f59`): 37 English draft summaries across `arxiv-2608.18294v2` (all 37 prose blocks); `drafted_by.model` is `not-disclosed` with session `conversation://9687caef-53f8-45ea-ad49-8d32f4f32eba`. Backlog in `cat-harness/library/` 1067 → 1030 of 1591 prose blocks (when combined with `#621`, `#624`, and `#628`; 1152 → 1115 against `main` alone; 561 drafts await human confirmation).
