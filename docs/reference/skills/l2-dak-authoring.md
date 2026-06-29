---
layout: default
title: L2 DAK Authoring
parent: Skill schema reference
---

# L2 DAK Authoring

> Skill id: `l2-dak-authoring`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for L2 Digital Adaptation Kit authoring. Translates WHO clinical guidelines into structured digital artifacts.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dakComponent` | `"personas"` \| `"user-scenarios"` \| `"business-processes"` \| `"data-dictionary"` \| `"decision-logic"` \| `"scheduling-logic"` \| `"indicators"` \| `"functional-requirements"` \| `"non-functional-requirements"` | **yes** | Which DAK component to author. |
| `sourceGuideline` | string | **yes** | Reference to the WHO L1 guideline being adapted. |
| `existingContent` | string | no | Path to existing content being iterated on (if any). |
| `sprintNumber` | integer | no | Current sprint/iteration number. (min: 1) |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/l2-dak-authoring/input.schema.json)

## Output

Output schema for L2 DAK authoring.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `artifacts` | array<object> | **yes** |  |
| `status` | `"draft"` \| `"ready-for-review"` \| `"approved"` | **yes** |  |
| `validationIssues` | array<object> | no |  |

### `artifacts[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | **yes** |  |
| `type` | `"bpmn"` \| `"dmn"` \| `"spreadsheet"` \| `"markdown"` \| `"fsh"` | **yes** |  |
| `description` | string | no |  |

### `validationIssues[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `severity` | `"error"` \| `"warning"` \| `"info"` | no |  |
| `message` | string | no |  |
| `location` | string | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/l2-dak-authoring/output.schema.json)
