---
layout: default
title: Content Validate
parent: Skill schema reference
---

# Content Validate

> Skill id: `content-validate`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for content validation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targetPath` | string | **yes** | Path to content to validate. |
| `validationRules` | array<string> | no | Specific validation rule IDs to run (empty = all applicable). |
| `schemaRefs` | array<string> | no | Schema files to validate against. |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/content-validate/input.schema.json)

## Output

Output schema for content validation results.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `overallStatus` | `"pass"` \| `"warnings"` \| `"errors"` | **yes** |  |
| `results` | array<object> | **yes** |  |

### `results[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `rule` | string | **yes** |  |
| `status` | `"pass"` \| `"fail"` \| `"warning"` \| `"skipped"` | **yes** |  |
| `message` | string | no |  |
| `location` | string | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/content-validate/output.schema.json)
