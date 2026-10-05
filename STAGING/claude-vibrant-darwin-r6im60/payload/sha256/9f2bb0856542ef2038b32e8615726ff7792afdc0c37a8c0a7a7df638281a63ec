---
# folio-assistant-jwoc
title: 'PROV-O QA/QC report over workflow instances: the agentic engine''s after-check (#1180 step 5)'
status: completed
type: feature
created_at: 2026-09-24T05:31:23Z
updated_at: 2026-09-24T14:00:00Z
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

## Owner decisions, 2026-09-24

**`prov:hadRole` → "Keep required".** PROV-O makes `hadRole` optional; `ProvAssociationSchema` requires it, and stays that way. A step in a lane that binds no role remains a `no-role` finding with no `prov:Activity`, never an activity with the role left out. No code change; the report page now says so.

**Undeclared actors → "Declare both".** Every history step names `claude` or `litlfred`, neither declared. Done for `claude` only:

- `.claude/skills/actors/claude.json`: kind `agent`, roles `authoring-agent` and `code-reviewer`, the lanes its history entries occupy whose role admits an agent. It also recorded one `BA_Submit` in the `business-analyst` lane, and that role admits only `person`. Listing it would have failed kg-audit's `actor-kind-fits-role`, so that step is now the one `not-eligible` finding.
- **`litlfred` is NOT declared.** It is a GitHub login, and the earlier owner ruling puts the login → actor mapping in the data store only: "an actor file never carries a login" (`docs/proposals/odrl-prov-actor-model.md`, `role-model.md`). An actor file with `id: "litlfred"`, `kind: person`, described as the owner, would record exactly that mapping. Its 11 steps stay `undeclared-actor` until the owner decides either to lift the ruling for this case, or that history should name a declared actor (e.g. `owner`) and let the data store resolve the login.

Findings, before and after (5 instances, 61 steps): `undeclared-actor` 61 → 11, `not-eligible` 0 → 1, `unknown` 61 → 61, `node-not-in-model` 4, `source-moved` 9; total 135 → 86.

## Owner rulings, 2026-09-24 — actors settled

- *"person acting w/ no login = reader/browser"*, confirmed *"Yes, exactly"*: the repository owner is the existing `owner` actor (no login in the file); workflow history names `owner`, and the login → `owner` mapping is the data store's alone. The 11 history steps recorded as the login are now recorded as `owner`. A person without a login is `cat-harness:anyone` (visualize, render). Written into `role-model.md`.
- *"Allow agents as BA"*: `business-analyst` admits `agent`, and `claude` holds it. The one `not-eligible` finding (`BA_Submit`) is gone.
- *"No aliases"* for the six moved glossary IRIs: nothing to do.

PROV-O QA/QC after: `undeclared-actor` 0, `not-eligible` 0.
