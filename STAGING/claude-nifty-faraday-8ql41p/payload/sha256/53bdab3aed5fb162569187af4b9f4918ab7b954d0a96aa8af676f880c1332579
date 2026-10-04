---
# folio-assistant-oq1j
title: 'QA READERS F3: detangle, LSI and tool-run readers fetch by ref or recompute'
status: todo
type: task
priority: normal
created_at: 2026-10-01T08:47:13Z
updated_at: 2026-10-01T08:47:13Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-16ei
---

Arc `3fva`, from reader audit `gxvk` (`cat-harness/docs/proposals/qa-readers-audit-2026-10-01.md`, family F3). Refines `oqe3` 3.1b, the LSI and detangle half. Blocked on `16ei`. These readers fail loud today, so this bean is not on the critical path.

## Readers
- `cat-harness/skills/kg/graph-management/kg-detangle.ts:466-479,546-611`: `detangle/**.detangle.json`, for pinned fields and the orphan sweep (A). Absent today: loud, every group STALE.
- `cat-harness/scripts/lsi.ts:66,341-348` (`lsi:skills:check`): `lsi/<inst>/<graph>.lsi.json` (A). Absent today: loud, "has none".
- `cat-harness/scripts/gen-lsi-viz.ts:43-62` (`lsi:viz:check`): every index → `docs/lsi/index.md` (A/C). Loud, but already stale at baseline.
- `cat-harness/scripts/gen-uml-overview.ts:567-578`, plus its `qa` directory listing (A/C). Absent today: loud, overview SVGs stale.
- `kg-audit.ts:1348` → `cat-harness/scripts/downstream-runs.ts` → `lsi.ts:348` `readToolRun` (`tool-runs/**`) (B). Correct: not-run → fail.
- `downstream-runs.ts:101` `listToolRuns` (`cat-harness/schemas/tool-run.ts:116-136`) (B). Quiet determined-empty; low risk.

## Migration action
- The detangle check computes and judges, and its orphan sweep runs against the fetched tree.
- The LSI index and its run record are fetched by ref (`qa:fetch`) or recomputed. The viewer page reads them through `qa-store`.
- `gen-uml-overview` reads the detangle numbers through `qa-store`, and draws `qa` as stored on the branch.

## Done when
- [ ] `kg:detangle:check`, `lsi:skills:check`, `lsi:viz:check` and `uml:overview:check` pass on `main` with `test/results/` absent
- [ ] `listToolRuns` over an unfetched store reports `unknown`, not an empty list
