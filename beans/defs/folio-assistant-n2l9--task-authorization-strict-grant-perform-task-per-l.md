---
# folio-assistant-n2l9
title: 'TASK AUTHORIZATION STRICT: grant perform-task per lane, count unknowns in kg:audit, then flip the engine to strict'
status: todo
type: task
created_at: 2026-09-23T22:52:59Z
updated_at: 2026-09-23T22:52:59Z
parent: folio-assistant-ahvw
---

Follow-up to t490 / #1207 (PR #1214). The engine check is advisory because on 2026-09-23 no policy granted perform-task: 615 tasks/gateways, 0 permit, 574 unknown, 41 in lanes no declared actor may take.

## Done when
- [ ] a kg:audit criterion counts tasks whose eligible actors get unknown from authorizeTask (reporting before gating, with a vacuity guard)
- [ ] perform-task rules, scoped by cat-harness:role, written for the lanes in use (owner decides the grants; never invented by an agent)
- [ ] the 41 lanes with no eligible actor are either given one or recorded as by-design
- [ ] authorizeTask mode flipped to strict in src/tools/workflow.ts once the count is 0
- [ ] PROV activity written per verdict (#1180 step 5); GitHub login to actor mapping in the data store
  (2026-09-24, bean `jwoc`: the after-check exists. `prov:qaqc` DERIVES the PROV log from history and re-runs `authorizeTask`. The engine writing a `prov:Activity` as it records each verdict is still open, and so is the login mapping.)
