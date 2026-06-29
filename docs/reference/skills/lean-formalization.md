---
layout: default
title: Lean Formalization
parent: Skill schema reference
---

# Lean Formalization

> Skill id: `lean-formalization`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for the lean-formalization skill. Describes source material to be formalized in Lean 4.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sourceFile` | string | **yes** | Path to the source material (LaTeX, markdown, or existing Lean file) to formalize. |
| `targetModule` | string | **yes** | Lean module path for the output (e.g. 'Qou.CategoryTheory.Functors'). |
| `proofStrategy` | `"tactic"` \| `"term"` \| `"mixed"` | no | Preferred proof style. (default: `"tactic"`) |
| `dependencies` | array<string> | no | Lean package dependencies (lake packages). |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/lean-formalization/input.schema.json)

## Output

Output schema for the lean-formalization skill.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `leanFiles` | array<object> | **yes** |  |
| `buildStatus` | `"success"` \| `"warnings"` \| `"errors"` | **yes** |  |
| `diagnostics` | array<object> | no |  |

### `leanFiles[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | **yes** |  |
| `module` | string | **yes** |  |
| `sorryCount` | integer | no | min: 0 |

### `diagnostics[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | string | no |  |
| `line` | integer | no |  |
| `severity` | `"error"` \| `"warning"` \| `"info"` | no |  |
| `message` | string | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/lean-formalization/output.schema.json)
