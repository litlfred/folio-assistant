---
layout: default
title: Content Author
parent: Skill schema reference
---

# Content Author

> Skill id: `content-author`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for general content authoring.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contentType` | `"document"` \| `"fhir-ig"` \| `"lean-proof"` \| `"bpmn"` \| `"data-dictionary"` | **yes** | Type of content to author. |
| `sourceRef` | string | no | Reference to source material. |
| `outputDir` | string | no | Output directory for authored content. |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/content-author/input.schema.json)

## Output

Output schema for general content authoring.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `artifacts` | array<object> | **yes** |  |

### `artifacts[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | **yes** |  |
| `type` | string | **yes** |  |
| `status` | `"draft"` \| `"ready-for-validation"` | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/content-author/output.schema.json)
