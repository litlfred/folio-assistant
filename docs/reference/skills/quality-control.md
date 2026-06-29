---
layout: default
title: Quality Control
parent: Skill schema reference
---

# Quality Control

> Skill id: `quality-control`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for quality control checks across content lifecycle.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `checkType` | `"qa-report"` \| `"publication-checklist"` \| `"conformance-validation"` \| `"functionality-test"` \| `"cross-component-consistency"` | **yes** | Type of QC check to perform. |
| `targetPath` | string | **yes** | Path to content being checked. |
| `checklistSections` | array<`"L1"` \| `"L2"` \| `"L3"` \| `"L4"` \| `"global"`> | no | Publication checklist sections to review. |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/quality-control/input.schema.json)

## Output

Output schema for quality control results.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `overallResult` | `"pass"` \| `"pass-with-warnings"` \| `"fail"` | **yes** |  |
| `findings` | array<object> | no |  |
| `checklistResults` | object | no |  |

### `findings[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `severity` | `"error"` \| `"warning"` \| `"info"` | **yes** |  |
| `category` | string | **yes** |  |
| `message` | string | **yes** |  |
| `location` | string | no |  |
| `remediation` | string | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/quality-control/output.schema.json)
