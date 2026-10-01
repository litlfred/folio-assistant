---
# folio-assistant-apcg
title: 'Placement PR6: library/ingestion split — basic flow stays in the harness, l1-document-ingestion goes to core'
status: todo
type: task
created_at: 2026-10-01T06:58:01Z
updated_at: 2026-10-01T06:58:01Z
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
