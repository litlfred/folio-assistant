---
# folio-assistant-id4s
title: 'QA READERS F2a: qa-results.ts core (writeQaResult, qaResultState) and the export comparisons read through qa-store'
status: todo
type: task
priority: normal
created_at: 2026-10-01T08:47:13Z
updated_at: 2026-10-01T08:47:13Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-16ei
---

Arc `3fva`, from reader audit `gxvk` (`cat-harness/docs/proposals/qa-readers-audit-2026-10-01.md`, family F2a). Refines `oqe3` item "also: check-version-bump / check-published-instance-exports". Blocked on `16ei`.

## Readers
- `cat-harness/scripts/qa-results.ts:171-184` `writeQaResult`: the prior `<stem>.qa-results.json`, to skip an unchanged write. It has 22 callers. Absent today: correct (it writes).
- `qa-results.ts:209,255` `readQaResult` / `qaResultState`: the four-state compare. Absent today: correct (`absent` / `unreadable`).
- `cat-harness/scripts/check-version-bump.ts:233-234`: `kg-export.qa-results.json` (A). Absent today: it prints `? ABSENT` and exits 0. STALE also exits 0, so this half of the gate is advisory.
- `cat-harness/scripts/check-published-instance-exports.ts:263-267`: `kg-export.<stub>.qa-results.json` (A). Absent today: **FALSE-CLEAN (C2)**. The comparison never runs, because both invocations use `export-graph`, which writes no sidecar. The defect itself is fixed in the live-defects bean. This bean migrates whatever survives that fix.

## Migration action
- `qaResultState` / `readQaResult` become thin wrappers over `readQa(ref, path)` (hit / miss / corrupt / unknown).
- `writeQaResult` becomes `publishQa`. Its prior-key skip reads the branch, not the tree.
- `check-version-bump` gains `--against`. Decide whether an ABSENT baseline is advisory, and say so in the gate.

## Done when
- [ ] no caller composes `<root>/test/results/` by hand (grep `QA_RESULTS_DIR` outside `qa-store`)
- [ ] `check:version-bump` reports `unknown` (not `current`) when the branch has no baseline, and its exit on that state is documented
- [ ] its tests run with `test/results/` absent
