---
layout: default
title: Document Authoring
parent: Skill schema reference
---

# Document Authoring

> Skill id: `document-authoring`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for the document-authoring skill: create or revise one content block in a document folio.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `document` | string | **yes** | Document slug under content/. |
| `chapter` | string | **yes** | Chapter directory name within the document. |
| `section` | string | **yes** | Label or title of the section whose blocks[] will name this block. |
| `kind` | `"prose"` \| `"example"` \| `"remark"` \| `"algorithm"` \| `"simulator"` \| `"equation"` \| `"diagram"` \| `"table"` | **yes** | Block kind. Restricted to the document profile: the seven math kinds (definition, theorem, lemma, proposition, corollary, conjecture, proof) are the paper profile and are rejected by content_profile_check. |
| `label` | string | **yes** | Stable identifier, e.g. rec:cold-chain-audit. Becomes the block's HTML anchor; must survive renumbering. |
| `title` | string | no | Short display title. |
| `uses` | array<string> | no | Labels of the blocks a reader must already have read. Direct neighbours only, never the transitive closure. Editorial judgement — never derived. |
| `body` | string | no | GitHub-flavoured Markdown for the block's .md file. |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/document-authoring/input.schema.json)

## Output

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `label` | string | **yes** |  |
| `filesWritten` | array<string> | **yes** | Repo-relative paths written (.ts and .md). |
| `listedInSection` | boolean | **yes** | Whether the block root was added to a section's blocks[]. False means the block renders nowhere — the most common way authored work disappears. |
| `validation` | object | no |  |

### `validation`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `errors` | integer | no |  |
| `warnings` | integer | no |  |
| `profileViolations` | integer | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/document-authoring/output.schema.json)
