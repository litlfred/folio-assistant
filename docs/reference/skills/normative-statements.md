---
layout: default
title: Normative Statement
parent: Skill schema reference
---

# Normative Statement

> Skill id: `normative-statements`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for the normative-statements skill: carry one recommendation, requirement or rule as a labelled block.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | **yes** | Stable identifier. The folio picks its own prefix convention (e.g. rec:) — the platform reserves none. |
| `title` | string | no | Short form for indexes and cross-references. |
| `statement` | string | **yes** | The normative statement itself. One statement per block: a block holding three cannot be cited, reviewed or superseded individually. |
| `force` | `"must"` \| `"should"` \| `"may"` \| `"good-practice"` \| `"research-priority"` | **yes** | Normative strength. Stated in the prose as well — nothing in the block structure encodes it. |
| `grading` | string | no | The issuing body's own strength/certainty grade, verbatim (e.g. a GRADE rating). Free text: the taxonomy is domain-specific. |
| `publishedNumber` | string | no | The number this statement carries in the published edition. Kept out of the label, which must survive renumbering. |
| `uses` | array<string> | no | Blocks a reader must have read to act on this one — term definitions, the scope statement, the evidence summary. |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/normative-statements/input.schema.json)

## Output

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | **yes** |  |
| `kind` | `"prose"` (const) | **yes** | Always prose today. There is no first-class recommendation kind: adding one means a builder, schema, label prefix, viewer registration, constraint rows and QA criteria, and it is tracked separately rather than half-done. A prose block converts by changing one builder call. |
| `anchor` | string | no | The HTML anchor emitted for this block, equal to its label. |
| `citedBy` | array<string> | no | Labels whose uses[] names this statement. |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/normative-statements/output.schema.json)
