---
# folio-assistant-65zi
title: MIGRATE req:* statements to carry successCriteria, then make the field required (#2405 decision 3)
status: todo
type: task
priority: normal
created_at: 2026-10-07T11:04:33Z
updated_at: 2026-10-07T11:04:33Z
parent: folio-assistant-ahvw
---

Issue: https://github.com/litlfred/folio-assistant/issues/2405 — owner decision 3 (https://github.com/litlfred/folio-assistant/issues/2405#issuecomment-6035163987): successCriteria was added OPTIONAL on RequirementStatementFields (bootstrap-tools/schemas/requirement.ts, PR litlfred/folio-assistant#2407); check:requirements WARNS on a statement without it. Measured on the branch: 31 statements across the 7 files in cat-harness/skills/requirements/ carry none. This bean migrates them — criteria added, never waived — and then makes the field required (.min(1), no .optional()), regenerating bootstrap/schemas/requirement.schema.json.

## Done when
- [ ] SC-003: every existing req:* file passes with criteria added rather than waived (check:requirements prints no successCriteria warning)
- [ ] successCriteria is required in RequirementStatementFields and in the published JSON Schema; requirements.test.ts proves the published schema refuses a statement without it
- [ ] SC-002: check:requirements fails on a planted statement with no successCriteria, and CI shows it
