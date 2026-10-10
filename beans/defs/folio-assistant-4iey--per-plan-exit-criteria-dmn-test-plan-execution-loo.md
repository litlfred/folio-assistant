---
# folio-assistant-4iey
$schema: bean/1.0.0
title: 'PER-PLAN exit-criteria DMN: test-plan-execution looks up the plan''s own decision table'
status: completed
type: task
created_at: 2026-10-02T05:51:37Z
updated_at: 2026-10-09T18:57:00Z
parent: folio-assistant-3fva
---

Follow-up from 3o5b (owner, 2026-10-02: bean, build later). test-plan/v1 lets a plan name its exitCriteria DMN, but GW_ExitCriteria in test-plan-execution.bpmn always evaluates the platform default (processes/decisions/test-certification.dmn).

## Do first (interim guard, small)
- [x] kg:audit criterion: a plan whose exitCriteria names a table other than the default is flagged (major), so no plan silently runs on the wrong rules until dispatch exists

## Then, when the first plan needs non-default rules
- [x] GW_ExitCriteria resolves the plan's named DMN; unresolvable → undetermined (could-not-determine), never the default
- [x] test: a fixture plan with its own table routes by that table

## Done when
- [x] both of the above are verified by tests

## Closed 2026-10-09

Committed in `cat-harness` as `5831db169816a11297899ab248bf6f30f6213f1b` on branch `claude/4iey-per-plan-exit-criteria-dmn` (`feat(test-plan): per-plan exitCriteria DMN resolution and validation (folio-assistant-4iey)`):
- Registered `test-plan-exit-criteria-resolves` audit criterion in `schemas/kg-qa.ts` (scope: `instance`, severity: `major`, applies: `["graph"]`). Flags any plan whose `exitCriteria` does not resolve to an existing `.dmn` file/decision. Vacuity-guarded: returns `unknown` if 0 plans are checked.
- Added `auditTestPlanExitCriteria` to `scripts/test-plan-audit.ts` and integrated it into `testPlanCriteria` in `scripts/kg-audit.ts`.
- Created `scripts/test-plan-execution.ts` providing `resolvePlanExitCriteriaDmn`, `evaluatePlanExitCriteria`, and `completeExitCriteriaGateway`:
  - Resolves `plan.exitCriteria.decision` dynamically against search bases.
  - When unresolvable, returns state `unknown` / could-not-determine and routes `GW_ExitCriteria` to `undetermined`, never silently falling back to the default table.
  - When resolvable, loads and evaluates using that table, routing the instance accordingly.
- Updated `src/workflow/instance.ts` (`complete`) to accept dynamic `decisionTable` / `decisionTableError` overrides and route unresolvable tables to the `undetermined` branch without falling back to default.
- Updated `processes/sdlc/test-plan-execution.bpmn` documentation on `GW_ExitCriteria` to describe dynamic per-plan DMN resolution and unresolvable fallback.
- Added test suite `scripts/tests/test-plan-exit-criteria-dmn.test.ts` verifying custom DMN routing, unresolvable DMN handling, and the `test-plan-exit-criteria-resolves` audit criterion.

Verification evidence:
- `bun test scripts/tests/test-plan-exit-criteria-dmn.test.ts`: 10 pass, 0 fail (74 expect() calls).
- `bun test scripts/tests/test-plan-execution.test.ts`: 31 pass, 0 fail (118 expect() calls).
- `bun run typecheck`: clean (0 errors, `tsc --noEmit -p tsconfig.json`).
