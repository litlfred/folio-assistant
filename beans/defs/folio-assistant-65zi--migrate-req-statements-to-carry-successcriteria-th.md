---
# folio-assistant-65zi
$schema: bean/1.0.0
title: MIGRATE req:* statements to carry successCriteria, then make the field required (#2405 decision 3)
status: completed
type: task
priority: normal
created_at: 2026-10-07T11:04:33Z
updated_at: 2026-10-09T13:07:00Z
parent: folio-assistant-ahvw
---

Issue: https://github.com/litlfred/folio-assistant/issues/2405 — owner decision 3 (https://github.com/litlfred/folio-assistant/issues/2405#issuecomment-6035163987): successCriteria was added OPTIONAL on RequirementStatementFields (bootstrap-tools/schemas/requirement.ts, PR litlfred/folio-assistant#2407); check:requirements WARNS on a statement without it. Measured on the branch: 31 statements across the 7 files in cat-harness/skills/requirements/ carry none. This bean migrates them — criteria added, never waived — and then makes the field required (.min(1), no .optional()), regenerating bootstrap/schemas/requirement.schema.json.

## Done when
- [x] SC-003: every existing req:* file passes with criteria added rather than waived (check:requirements prints no successCriteria warning)
- [x] successCriteria is required in RequirementStatementFields and in the published JSON Schema; requirements.test.ts proves the published schema refuses a statement without it
- [x] SC-002: check:requirements fails on a planted statement with no successCriteria, and CI shows it

## Closed 2026-10-09

Committed in `cat-harness` as `6f0551b3` on branch `claude/65zi-success-criteria-required` (`feat(requirements): migrate 31 statements to carry successCriteria and make required (folio-assistant-65zi)`):
- Added concrete, unambiguous yes/no `successCriteria` with valid verification methods (`test`, `inspection`, `review`, `analysis`) to all 31 statements across the 7 requirement files in `skills/requirements/`:
  - `agent-workflow.json` (5 statements: `work-is-visible`, `acts-as-a-role`, `process-is-declared`, `judgement-stays-human`, `context-before-question`)
  - `commit-hygiene.json` (3 statements: `no-build-artifacts`, `no-secrets`, `pin-dependencies`)
  - `content-lifecycle.json` (6 statements: `plan-before-author`, `validate-before-review`, `review-before-test`, `test-before-publish`, `publish-authorized`, `feedback-collected`)
  - `fhir-validation.json` (4 statements: `sushi-compile`, `ig-publisher-qa`, `crmi-conformance`, `terminology-bindings`)
  - `lean-verification.json` (3 statements: `lean-compiles`, `sorry-tracking`, `citation-match`)
  - `serving-a-rendering.json` (7 statements: `declared-media-type`, `compound-extension-wins`, `bare-stub-opens`, `alias-is-byte-identical`, `undeclared-is-not-forced`, `contained`, `loopback-by-default`)
  - `session-start.json` (3 statements: `detect-role`, `check-capabilities`, `check-todos`)
- Updated `bootstrap-tools/schemas/requirement.ts`: made `successCriteria: z.array(SuccessCriterionSchema).min(1)` required on `RequirementStatementFields` (removed `.optional()`).
- Regenerated bootstrap schemas with `bun run bootstrap-tools/scripts/gen-bootstrap-schemas.ts`: published `bootstrap/schemas/requirement.schema.json` now includes `successCriteria` in required fields of requirement statements.
- Updated `cat-harness-tools/scripts/check-requirements.ts`: missing `successCriteria` is treated as a problem / error instead of a warning, failing validation on unmigrated or planted statements.
- Updated `cat-harness-tools/scripts/tests/requirements.test.ts`: asserted that `RequirementSchema` and the published JSON Schema require `successCriteria`, and verified `checkRequirementPage` rejects statements without it.

Verification evidence:
- `bun test cat-harness-tools/scripts/tests/requirements.test.ts`: 29 pass, 0 fail (60 expect() calls).
- `bun run cat-harness-tools/scripts/check-requirements.ts`: passes with 0 warnings on successCriteria.
- `bun run typecheck` in worktree `cat-harness-65zi`: 0 errors (tsc --noEmit -p tsconfig.json).
