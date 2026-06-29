---
layout: default
title: Content Review
parent: Skill schema reference
---

# Content Review

> Skill id: `content-review`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for formal content review and approval workflow.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reviewType` | `"l2-to-l3-gate"` \| `"l3-to-publish-gate"` \| `"change-assessment"` \| `"final-signoff"` | **yes** | Type of review phase gate. |
| `contentRef` | string | **yes** | Git ref or path to the content being reviewed. |
| `previousVersion` | string | no | Git ref of the previous approved version (for diff). |
| `validationReport` | string | no | Path to the validation report for this content. |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/content-review/input.schema.json)

## Output

Output schema for content review decisions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `decision` | `"approve"` \| `"request-changes"` \| `"reject"` | **yes** |  |
| `reviewer` | string | no |  |
| `reviewDate` | string (date-time) | no |  |
| `comments` | array<object> | no |  |
| `conditions` | array<string> | no | Conditions that must be met before the approval is final. |

### `comments[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `location` | string | no |  |
| `severity` | `"blocking"` \| `"suggestion"` \| `"praise"` | no |  |
| `comment` | string | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/content-review/output.schema.json)
