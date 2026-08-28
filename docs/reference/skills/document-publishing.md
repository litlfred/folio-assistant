---
layout: default
title: Document Publishing
parent: Skill schema reference
---

# Document Publishing

> Skill id: `document-publishing`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for the document-publishing skill: render a document folio without a TeX installation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `document` | string | **yes** | Document slug under content/. |
| `format` | `"md"` \| `"html"` \| `"pdf"` | **yes** | Output format. All three assemble Markdown first; html and pdf then run pandoc. |
| `pdfEngine` | `"auto"` \| `"weasyprint"` \| `"prince"` \| `"wkhtmltopdf"` | no | HTML-to-PDF engine. Never latexmk: a document folio is defined by not requiring TeX to publish. (default: `"auto"`) |
| `css` | string | no | Stylesheet path relative to the repo root. Belongs in the folio repo — a house style is content. |
| `toc` | boolean | no | default: `true` |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/document-publishing/input.schema.json)

## Output

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `outputPath` | string | **yes** |  |
| `engine` | string | no | The engine actually used, or absent for md/html. |
| `blockCount` | integer | **yes** |  |
| `chapterCount` | integer | no |  |
| `issues` | array<object> | no |  |

### `issues[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `level` | `"error"` \| `"warn"` | no |  |
| `message` | string | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/document-publishing/output.schema.json)
