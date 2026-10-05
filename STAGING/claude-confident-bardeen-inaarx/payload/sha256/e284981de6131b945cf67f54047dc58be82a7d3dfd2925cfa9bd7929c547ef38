---
# folio-assistant-4iey
title: 'PER-PLAN exit-criteria DMN: test-plan-execution looks up the plan''s own decision table'
status: todo
type: task
created_at: 2026-10-02T05:51:37Z
updated_at: 2026-10-02T05:51:37Z
parent: folio-assistant-3fva
---

Follow-up from 3o5b (owner, 2026-10-02: bean, build later). test-plan/v1 lets a plan name its exitCriteria DMN, but GW_ExitCriteria in test-plan-execution.bpmn always evaluates the platform default (processes/decisions/test-certification.dmn).

## Do first (interim guard, small)
- [ ] kg:audit criterion: a plan whose exitCriteria names a table other than the default is flagged (major), so no plan silently runs on the wrong rules until dispatch exists

## Then, when the first plan needs non-default rules
- [ ] GW_ExitCriteria resolves the plan's named DMN; unresolvable → undetermined (could-not-determine), never the default
- [ ] test: a fixture plan with its own table routes by that table

## Done when
- [ ] both of the above are verified by tests
