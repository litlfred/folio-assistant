---
# folio-assistant-ygzh
title: 'TEST PLAN schema: test-plan/v1 (FHIR R5 TestPlan shape), test-run gains plan + sut, test-report/v1 per-plan rollup'
status: todo
type: feature
priority: high
created_at: 2026-10-01T08:00:47Z
updated_at: 2026-10-01T08:00:47Z
parent: folio-assistant-3fva
---

Arc `3fva`, proposal §3.2 and §4 items 5.1 and 5.2. Can be dispatched now: these are new files, and only the graph-kind registry edit is shared.

- `test-plan/v1` has:
  - `scope` (the system-under-test kind and version range)
  - `requirements[]` as `req:` refs
  - `testCases[]`, each with an id, assertions whose ids are criterion ids, `testData` refs and an optional Gherkin `.feature`
  - `dependencies[]`
  - `exitCriteria` as a DMN reference
  - Source held: `fhir-harness/library/hl7-2023-fhir-r5-testplan` (`y4uj`).
- `folio-test-run/v1` gains `plan` and `sut` (actor id, version, reach). The run points at the plan, never the reverse.
- `test-report/v1`:
  - holds per-case verdicts in the `block-qa` entry shape `{result, reviewer{kind}}`;
  - rolls up per plan only, never across plans (`py74`);
  - is written to qa-reports under `tests/<plan>/<sut>/<run>/`.
- Test data comes from `vm6m`: a fixed set is reviewed and counts as evidence; a generated set is stored as template + params + seed.

## Done when
- [ ] the schemas and kinds are registered with `holds` and `renderable` decided
- [ ] the tests cover summary/detail agreement and the no-cross-plan-total rule
