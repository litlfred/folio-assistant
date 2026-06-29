---
layout: default
title: Content Test
parent: Skill schema reference
---

# Content Test

> Skill id: `content-test`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for end-to-end content testing.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `targetPath` | string | **yes** |  |
| `testPlan` | string | no | Path to test plan file. |
| `testData` | string | no | Path to test data directory. |
| `regressionBaseline` | string | no | Git ref for regression baseline. |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/content-test/input.schema.json)

## Output

Output schema for content testing results.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `overallStatus` | `"pass"` \| `"fail"` | **yes** |  |
| `testResults` | array<object> | **yes** |  |
| `coverage` | object | no |  |

### `testResults[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `testId` | string | **yes** |  |
| `status` | `"pass"` \| `"fail"` \| `"skipped"` | **yes** |  |
| `message` | string | no |  |
| `duration` | number | no |  |

### `coverage`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `total` | integer | no |  |
| `passed` | integer | no |  |
| `failed` | integer | no |  |
| `skipped` | integer | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/content-test/output.schema.json)
