---
layout: default
title: Document Structure
parent: Skill schema reference
---

# Document Structure

> Skill id: `document-structure`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for the document-structure skill: add, remove or reorder chapters and sections.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `document` | string | **yes** | Document slug under content/. |
| `operation` | `"add-chapter"` \| `"add-section"` \| `"reorder-chapters"` \| `"reorder-sections"` | **yes** | Structural change to make. Reordering edits the manifest only — directories are never renamed, because labels, uses[], feedback and QA sidecars all key on names. |
| `chapter` | string | no | Chapter directory name. Required for every operation except reorder-chapters. |
| `title` | string | no | Human-readable title, for the add-* operations. |
| `position` | integer | no | Zero-based index to insert at. Appends when omitted. |
| `order` | array<string> | no | The complete new order, for the reorder-* operations. Must be a permutation of the existing entries. |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/document-structure/input.schema.json)

## Output

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `manifestsChanged` | array<string> | **yes** |  |
| `chapters` | array<string> | no | Chapter directory names in their new reading order. |
| `forwardReferences` | array<string> | no | Labels whose uses[] now points forward in reading order. A real finding after a reorder, not a mechanical detail. |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/document-structure/output.schema.json)
