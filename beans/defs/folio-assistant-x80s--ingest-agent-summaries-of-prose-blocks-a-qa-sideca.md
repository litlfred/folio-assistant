---
# folio-assistant-x80s
$schema: bean/1.0.0
title: 'INGEST: agent summaries of prose blocks, a QA sidecar drained slowly during ingestion'
status: todo
type: task
priority: normal
created_at: 2026-09-24T05:54:04Z
updated_at: 2026-10-27T14:03:00Z
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

_2026-10-26T15:10:00Z_ — batch 23 opened as `litlfred/cat-harness#630` (`9f81da25`): 39 English draft summaries across `wang-rangaiah-2026-mcdm-aggregation` (all 39 prose blocks); `drafted_by.model` is `not-disclosed` with session `conversation://9985fca2-19f0-4684-87bd-b3dc84e07c72`. Backlog in `cat-harness/library/` 1030 → 991 of 1591 prose blocks (when combined with `#621`, `#624`, `#628`, and `#629`; 1152 → 1113 against `main` alone; 600 drafts await human confirmation).

_2026-10-26T15:21:00Z_ — batch 24 opened as `litlfred/cat-harness#631` (`58fff929`): 41 English draft summaries across `landauer-foltz-laham-1998-intro-lsa` (all 41 prose blocks); `drafted_by.model` is `not-disclosed` with session `conversation://7272f3f0-deb8-4fe4-8e47-2ce5b9ae3bc3`. Backlog in `cat-harness/library/` 991 → 950 of 1591 prose blocks (when combined with `#621`, `#624`, `#628`, `#629`, and `#630`; 1152 → 1111 against `main` alone; 641 drafts await human confirmation).

_2026-10-26T15:23:00Z_ — batch 25 opened as `litlfred/cat-harness#632` (`16641dc3`): 57 English draft summaries across `w3c-2018-odrl-model-2-2` (all 57 prose blocks); `drafted_by.model` is `not-disclosed` with session `conversation://0f4a617a-003d-4645-b2ba-f6e2c5ff60f5`. Backlog in `cat-harness/library/` 950 → 893 of 1591 prose blocks (when combined with `#621`, `#624`, `#628`, `#629`, `#630`, and `#631`; 1152 → 1095 against `main` alone; 698 drafts await human confirmation).

_2026-10-26T15:33:00Z_ — batch 26 opened as `litlfred/cat-harness#633` (`85a2fe68`): 71 English draft summaries across `w3c-2024-prov-jsonld` (all 71 prose blocks); `drafted_by.model` is `not-disclosed` with session `conversation://6224d9d6-5943-496b-a0a9-31a95705f4aa`. Backlog in `cat-harness/library/` 893 → 822 of 1591 prose blocks (when combined with `#621`, `#624`, `#628`, `#629`, `#630`, `#631`, and `#632`; 1152 → 1081 against `main` alone; 769 drafts await human confirmation).

_2026-10-26T15:36:00Z_ — batch 27 opened as `litlfred/cat-harness#634` (`80d6b7b5`): 50 English draft summaries across `w3c-2020-json-ld-1-1` (first 50 of 139 prose blocks, `prose-sec-000` through `prose-sec-056`); `drafted_by.model` is `not-disclosed` with session `conversation://06bea140-d38a-452e-ad75-a5e8e9f8af00`. Backlog in `cat-harness/library/` 822 → 772 of 1591 prose blocks (when combined with `#621`, `#624`, `#628`, `#629`, `#630`, `#631`, `#632`, and `#633`; 1152 → 1102 against `main` alone; 819 drafts await human confirmation).

_2026-10-26T15:45:00Z_ — batch 28 opened as `litlfred/cat-harness#635` (`e04d74d4`): 50 English draft summaries across `omg-2024-spdx-3-0` (first 50 of 400 prose blocks, `prose-sec-front-matter` and `prose-sec-000` through `prose-sec-048`); `drafted_by.model` is `not-disclosed` with session `conversation://60bf5d72-a28c-4963-be20-fa0922d95bc2`. Backlog in `cat-harness/library/` 772 → 722 of 1591 prose blocks (when combined with `#621`, `#624`, `#628`, `#629`, `#630`, `#631`, `#632`, `#633`, and `#634`; 1152 → 1102 against `main` alone; 869 drafts await human confirmation).

_2026-10-26T15:49:00Z_ — batch 29 opened as `litlfred/cat-harness#636` (`b27d25a5`, stacked on `#634`): 45 English draft summaries across `w3c-2020-json-ld-1-1` (blocks 51–95 of 139 prose blocks, `prose-sec-057` through `prose-sec-102`); `drafted_by.model` is `not-disclosed` with session `conversation://058ee54f-ea98-4422-9a59-a587c16f4ca7`. Backlog in `cat-harness/library/` 722 → 677 of 1591 prose blocks (when combined with `#621`, `#624`, `#628`, `#629`, `#630`, `#631`, `#632`, `#633`, `#634`, and `#635`; 1152 → 1057 against `main` with `#634`; 914 drafts await human confirmation).

_2026-10-27T13:58:00Z_ — batch 30 opened as `litlfred/cat-harness#641` (`507540e3`, stacked on `#635`): 50 English draft summaries across `omg-2024-spdx-3-0` (blocks 51–100 of 400 prose blocks, `prose-sec-049` through `prose-sec-098`); `drafted_by.model` is `not-disclosed` with session `conversation://fb5e9aad-2a1c-4139-af26-2bd5ea10f938`. Backlog in `cat-harness/library/` 677 → 627 of 1591 prose blocks (when combined with `#621`, `#624`, `#628`, `#629`, `#630`, `#631`, `#632`, `#633`, `#634`, `#635`, and `#636`; 1152 → 1052 against `main` with `#635`; 964 drafts await human confirmation).

_2026-10-27T14:03:00Z_ — batch 31 opened as `litlfred/cat-harness#642` (`bd5c6188`, stacked on `#636`): 44 English draft summaries across `w3c-2020-json-ld-1-1` (final blocks 96–139 of 139 prose blocks, `prose-sec-103` through `prose-sec-163`, completing `w3c-2020-json-ld-1-1`); `drafted_by.model` is `not-disclosed` with session `conversation://9e5d59e6-d716-4bc8-bfef-31d95b29b55c`. Backlog in `cat-harness/library/` 627 → 583 of 1591 prose blocks (when combined with `#621`, `#624`, `#628`, `#629`, `#630`, `#631`, `#632`, `#633`, `#634`, `#635`, `#636`, and `#641`; 1152 → 1013 against `main` with `#634` and `#636`; 1008 drafts await human confirmation).

_2026-10-27T14:15:00Z_ — batch 32 opened as `litlfred/cat-harness#643` (`386850d2`, stacked on `#641`): 50 English draft summaries across `omg-2024-spdx-3-0` (blocks 101–150 of 400 prose blocks, `prose-sec-099` through `prose-sec-107` and `prose-sec-109` through `prose-sec-149`); `drafted_by.model` is `not-disclosed` with session `conversation://30231242-3947-4558-8f08-6bd44c18c038`. Backlog in `cat-harness/library/` 583 → 533 of 1591 prose blocks (when combined with `#621`, `#624`, `#628`, `#629`, `#630`, `#631`, `#632`, `#633`, `#634`, `#635`, `#636`, `#641`, and `#642`; 1152 → 1002 against `main` with `#635` and `#641`; 1058 drafts await human confirmation).
