---
layout: default
generated: scripts/gen-schema-docs.ts — do not hand-edit; edit the schema
title: Proof Verification
parent: Skill schema reference
---

# Proof Verification

> Skill id: `proof-verification`

_Generated from JSON Schema — do not edit by hand. Run `bun run cat-harness/scripts/gen-schema-docs.ts`._

## Input

Input schema for the proof-verification skill. Verifies Lean proofs and tracks sorry obligations.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectRoot` | string | **yes** | Path to the Lean project root (containing lakefile.lean). |
| `targetFiles` | array<string> | no | Specific files to verify (empty = entire project). |
| `trackSorries` | boolean | no | Whether to track and report sorry placeholders. (default: `true`) |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/skills/proof-verification/input.schema.json) · [✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/schemas/skills/proof-verification/input.schema.json){: .fa-edit-source }

## Output

Output schema for the proof-verification skill.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `verified` | boolean | **yes** |  |
| `sorryCount` | integer | **yes** | min: 0 |
| `sorries` | array<object> | no |  |
| `errors` | array<object> | no |  |

### `sorries[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | string | **yes** |  |
| `line` | integer | **yes** |  |
| `obligation` | string | **yes** |  |
| `reference` | string | no |  |

### `errors[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | string | no |  |
| `line` | integer | no |  |
| `message` | string | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/skills/proof-verification/output.schema.json) · [✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/schemas/skills/proof-verification/output.schema.json){: .fa-edit-source }
