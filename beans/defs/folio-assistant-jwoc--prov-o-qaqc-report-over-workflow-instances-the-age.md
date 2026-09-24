---
# folio-assistant-jwoc
title: 'PROV-O QA/QC report over workflow instances: the agentic engine''s after-check (#1180 step 5)'
status: completed
type: feature
created_at: 2026-09-24T05:31:23Z
updated_at: 2026-09-24T05:31:23Z
parent: folio-assistant-ahvw
---

Issue #1180, step 5 of `docs/proposals/odrl-prov-actor-model.md`: the agentic engine's after-check. The deterministic engine checks the ODRL policy before a task (t490, #1207); an agent swarm acts first, so the same policy is checked after, from a PROV-O log derived from workflow history. Advisory, as the owner chose.

## Done when
- [x] `scripts/prov-qaqc.ts`: one `prov:Activity` per activity/decision in each instance's history (agent, lane role via `laneBinding`, plan `<stem>#<node>`, `underPolicy`), validated by `ProvActivitySchema`
- [x] `authorizeTask` re-run with the actor `asserted`; findings for unknown, deny, not-eligible, undeclared actor, disagreeing recorded authz, and record gaps (no actor, no role, missing node, moved/missing diagram); nothing invented
- [x] PROV JSON-LD per instance in `docs/assets/prov/`, report page `docs/prov-qaqc/index.md`, `check:prov-qaqc` in CI (advisory: fails only on stale/invalid/internal error)
- [x] tests incl. a vacuity guard over the real instances; skills and proposal updated

## Summary of Changes

`cat-harness:underPolicy` takes an array, because `decide` evaluates every policy in force. `listInstances` no longer crashes on instances without `updatedAt`. First run: 4 instances, 55 steps, 55 activities; 55 `unknown`, 55 `undeclared-actor`, 4 `node-not-in-model`, 9 `source-moved`.
