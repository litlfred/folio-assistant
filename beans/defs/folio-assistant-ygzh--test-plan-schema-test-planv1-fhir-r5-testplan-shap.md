---
# folio-assistant-ygzh
title: 'TEST PLAN schema: test-plan/v1 (FHIR R5 TestPlan shape), test-run gains plan + sut, test-report/v1 per-plan rollup'
status: completed
type: feature
priority: high
created_at: 2026-10-01T08:00:47Z
updated_at: 2026-10-01T08:48:16Z
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
- [x] the schemas and kinds are registered with `holds` and `renderable` decided
- [x] the tests cover summary/detail agreement and the no-cross-plan-total rule

## Outcome (2026-10-01)

- `cat-harness/schemas/test-plan.ts` (`test-plan/v1`): scope (SUT kind + version range), `req:` requirements (min 1), test cases (unique ids; assertions whose ids are criterion ids; `testData` as a strict discriminated union, `fixed` = path + optional review, evidence only once reviewed, `generated` = template + params + REQUIRED seed with no field for a materialised copy; optional `.feature`; `dependsOn` resolved, acyclic), plan `dependencies[]` (FHIR shape), `exitCriteria` as a `file.dmn#Decision_Id` ref. The FHIR R5 mapping is a table in the module docstring.
- `cat-harness/schemas/test-run.ts`: optional `plan` {id, version} and `sut` {actor, version, reach ∈ NETWORK_REACHES ∪ unknown}; `plan` without `sut` is refused. The committed `crdm-detect-eval.test-run.json` still parses (tested).
- `cat-harness/schemas/test-report.ts` (`test-report/v1`): one plan per report, strict top level and rollup (no `total`, no second plan); per-case entries in the block-qa shape plus `skipped` (reason required); rollup must equal the current verdicts; `completed_at` exactly when terminal; `testReportVerdict` is `unknown` for running, aborted-without-fail and nothing-passed; the SUT may not be a verdict's reviewer; `rollupPanels` groups per plan and never totals; `checkAgainstPlan`; `testReportPath` → `tests/<plan>/<sut>/<run>/test-report.json`.
- Kinds: `test-plan` = content, not renderable; `test-report` = state, `recordsWork: false`, not renderable. Reasons beside each in `graph-kind-registry.ts`; rows in `directory-conventions.md`; avatars. Declared, no directory.
