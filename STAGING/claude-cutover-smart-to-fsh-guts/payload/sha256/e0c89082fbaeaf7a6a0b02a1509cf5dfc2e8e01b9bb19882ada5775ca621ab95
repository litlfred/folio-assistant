---
# folio-assistant-apcg
title: 'Placement PR6: library/ingestion split — basic flow stays in the harness, l1-document-ingestion goes to core'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T06:58:01Z
updated_at: 2026-10-02T17:53:42Z
parent: folio-assistant-iirv
blocked_by:
    - folio-assistant-63wl
    - folio-assistant-tlat
---

Placement proposal §2 (owner rulings 2026-09-30 §6; process: review → resolve issues → staged PRs). Parent of PR0/PR1 is `9umr`; PR2–PR9 sit under the separation epic because D4 (owner, 2026-10-01, option 3) interleaves them with the split stages into one ordered sequence. Every PR: references move with the subject; generated trees regenerated, never hand-edited; `beans/**` not rewritten; kg-qa sidecars RELOCATED (identity-checked), never deleted without the owner (`deletion-requires-confirmation`).

PR6, the library/ingestion split (proposal §3; ruling 3, 2026-09-30): `library-core` → core `library/cataloguing/` (8 bodies + `bib-qa/qa-tags.md` + `ontologist.ts`) and `library/ingestion/` (`tabular-metadata`); `library-ingestion.md` (553 lines) splits into a basic harness skill (≤ ~120 lines) and a new core `l1-document-ingestion`; `document-ingestion.bpmn` rewritten as the basic flow; new core `processes/library/l1-document-ingestion.bpmn` calls it and the 4 `ingest-*` subprocesses.

Blocked by PR3 (the `ingest-*` diagrams move there) and PR5 (the basic flow refers to the materialization contract).

## Done when
- [ ] `methodology-from-source.bpmn`'s `calledElement="Process_Ingestion"` resolves to the HARNESS file
- [ ] `bun run ingest uploads/<fixture>.pdf --dry-run` picks the same rung before and after
- [ ] `residual.py`: 0 edges from `document-ingestion` to a higher instance

_2026-10-02T17:26Z_ — Claimed by claude/placement-pr6-apcg (session https://claude.ai/code/session_01CVVoavPoCHMLA7AASxG8cH), assigned by the merge steward. Blockers 63wl (#1875) and tlat (#1867, train 3) merged — blocked_by satisfied.

_2026-10-02_ — **Coordination review before the first edit** (owner rule, `coordinate`, PR #1886). 32 open PRs, 1,761 changed files listed per PR, filtered for this bean's subjects (library-core skill bodies, library-ingestion.md, ontologist.ts, ingest BPMN, document-ingestion, tabular-metadata, methodology-from-source):
- #1822 (library titles) edits `library-core/library-ingestion.md` and its kg-qa sidecar — will conflict with the split; whichever lands second carries the other's text into the right half.
- #1812 (Q-A PR 4) touches `cat-harness/test/results/witnesses/document-ingestion/*` — witness files named for the docs page; this PR does not move them.
- #1892 touches `cat-harness/scripts/ingest-document.ts` — rung code stays in the harness here; no move, no overlap in content.
- #1735 touches `library-core/asset-extraction.md` — stays in the harness; no overlap.
- #1881 (session_013Wb, library entries as path IRIs) adds a paragraph to `library-ingestion.md` plus edits to `asset-extraction.md` and `package-manifest.json`. Agreed via the merge steward: #1881 lands first; this branch merges main afterwards and carries the paragraph into the correct half (referenced.json's schema is `cat-harness/schemas/referenced-source.ts`, so the generic `published` variant belongs in the harness half). #1885 touches none of these files.
- In-progress beans naming these files: `2i5f`, `5yhm`, `7wou` (terminology; touch `glossary-terms`/`term-disagreement`, which STAY in the harness), `a8wy`, `scfh`, `rkqp`, `x80s`, `ojai`, `yg29` (mention library-ingestion/document-ingestion by name; no open PR found on their branches), `yj6r`, `d308`, `wggr`, `x3bd` — no file-level conflict found.

Re-derived from the current tree: library-ingestion.md is **870** lines (the 553 above predates later additions); the ingest-* diagrams are in `cat-harness/processes/library/` (PR3 regroup); core already has `skills/library/{ingestion,catalogue}/` (PR1, bean 7eak).
