---
layout: default
title: DMN Authoring
parent: Skill schema reference
---

# DMN Authoring

> Skill id: `dmn-authoring`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for DMN (Decision Model and Notation) decision table authoring.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `decisionName` | string | **yes** | Name of the decision to model. |
| `inputVariables` | array<object> | **yes** |  |
| `sourceLogic` | string | no | Reference to the clinical decision logic being modeled. |

### `inputVariables[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | **yes** |  |
| `type` | `"string"` \| `"integer"` \| `"boolean"` \| `"date"` \| `"codeable-concept"` | **yes** |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/dmn-authoring/input.schema.json)

## Output

Output schema for DMN decision table authoring.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `dmnFile` | string | **yes** |  |
| `decisionTableCount` | integer | no |  |
| `ruleCount` | integer | no |  |
| `hitPolicy` | `"UNIQUE"` \| `"FIRST"` \| `"PRIORITY"` \| `"ANY"` \| `"COLLECT"` \| `"RULE ORDER"` | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/dmn-authoring/output.schema.json)
