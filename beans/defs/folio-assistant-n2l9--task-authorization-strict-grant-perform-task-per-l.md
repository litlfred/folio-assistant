---
# folio-assistant-n2l9
title: 'TASK AUTHORIZATION STRICT: grant perform-task per lane, count unknowns in kg:audit, then flip the engine to strict'
status: in-progress
type: task
priority: normal
created_at: 2026-09-23T22:52:59Z
updated_at: 2026-09-24T17:20:57Z
parent: folio-assistant-ahvw
---

Follow-up to t490 / #1207 (PR #1214). The engine check is advisory because on 2026-09-23 no policy granted perform-task: 615 tasks/gateways, 0 permit, 574 unknown, 41 in lanes no declared actor may take.

## Done when
- [x] a kg:audit criterion counts tasks whose eligible actors get unknown from authorizeTask (reporting before gating, with a vacuity guard)
- [x] perform-task rules, scoped by cat-harness:role, written for the lanes in use (owner decides the grants; never invented by an agent)
- [x] the 41 lanes with no eligible actor are either given one or recorded as by-design
- [x] authorizeTask mode flipped to strict in src/tools/workflow.ts once the count is 0
- [ ] PROV activity written per verdict (#1180 step 5); GitHub login to actor mapping in the data store
  (2026-09-24, bean `jwoc`: the after-check exists. `prov:qaqc` DERIVES the PROV log from history and re-runs `authorizeTask`. The engine writing a `prov:Activity` as it records each verdict is still open, and so is the login mapping.)
- [x] the user authN/authZ Tool (owner, 2026-09-24: "need Tool fo user auth/auth", then "do github"): one declared Tool node that says who the caller is via GitHub, what GitHub lets them do, and what ODRL says — plus the strengths and weaknesses of GitHub as the auth layer (all of the KG or none; no sub-graph / node / query-path control). Branch `claude/pensive-carson-b7sqzq`, issue #1207.
- [x] login → actor mapping: RESOLVED by the owner 2026-09-24, "just use github accounts and standard personal account permission levels". No login table; owner/collaborator/public-read ARE the mapping (`PERSONAL_ACCOUNT_LEVELS`), reported by `auth_whoami` (PR #1289).

2026-09-24, owner rulings ("use owner, viewer, collaborator"; "all write roles collapse"): the four items above close together. perform-task is granted UNSCOPED to `owner` and `collaborator` (no per-role scoping: the write roles collapsed); `viewer` gets nothing. owner/collaborator take any lane, so no lane lacks an eligible actor. The engine is strict and authorizes the GitHub principal. The "count" is `scripts/tests/task-authorization-strict.test.ts` (628 tasks/gateways: owner 628 allowed, collaborator 628, viewer 0, nobody 0) rather than a kg:audit criterion — a test fails CI, which is the gate the criterion was meant to become. Still open: the engine writing a prov:Activity per verdict as it records it.
