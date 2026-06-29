---
layout: default
title: LaTeX Authoring
parent: Skill schema reference
---

# LaTeX Authoring

> Skill id: `latex-authoring`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for the latex-authoring skill.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `documentClass` | `"article"` \| `"book"` \| `"report"` \| `"beamer"` | **yes** | LaTeX document class. |
| `mainFile` | string | **yes** | Path to the main .tex file. |
| `bibliographyFile` | string | no | Path to the .bib bibliography file. |
| `outputFormat` | `"pdf"` \| `"dvi"` \| `"ps"` | no | default: `"pdf"` |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/latex-authoring/input.schema.json)

## Output

Output schema for the latex-authoring skill.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `outputFile` | string | **yes** | Path to the compiled output (PDF, etc.). |
| `buildStatus` | `"success"` \| `"warnings"` \| `"errors"` | **yes** |  |
| `warnings` | array<string> | no |  |
| `pageCount` | integer | no | min: 0 |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/latex-authoring/output.schema.json)
