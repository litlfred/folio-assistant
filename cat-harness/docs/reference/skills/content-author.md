---
layout: default
generated: scripts/gen-schema-docs.ts — do not hand-edit; edit the schema
title: Content Author
parent: Skill schema reference
---

# Content Author

> Skill id: `content-author`

_Generated from JSON Schema — do not edit by hand. Run `bun run cat-harness-tools/scripts/gen-schema-docs.ts`._

## Input

Input schema for general content authoring.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `contentType` | `"document"` \| `"fhir-ig"` \| `"lean-proof"` \| `"bpmn"` \| `"data-dictionary"` | **yes** | Type of content to author. |
| `sourceRef` | string | no | Reference to source material. |
| `outputDir` | string | no | Output directory for authored content. |


[Raw schema](https://github.com/litlfred/cat-harness/blob/main/schemas/skills/content-author/input.schema.json){: data-fa-link="source" data-src="schemas/skills/content-author/input.schema.json" data-repo="litlfred/cat-harness" } · [✎ Edit](https://github.com/litlfred/cat-harness/edit/main/schemas/skills/content-author/input.schema.json){: .fa-edit-source data-fa-link="edit" data-src="schemas/skills/content-author/input.schema.json" data-repo="litlfred/cat-harness" }

## Output

Output schema for general content authoring.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `artifacts` | array<object> | **yes** |  |
| `stagingLinks` | any | no | The staging preview of the work this output asks a person to look at: one deep link per changed page, with the same page on main. Required whenever a preview exists; when it does not, say so in `missing`. Rule: cat-harness sdlc/skills/sdlc-core/staging-review.md §"The deep-link rule". |

### `artifacts[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | **yes** |  |
| `type` | string | **yes** |  |
| `status` | `"draft"` \| `"ready-for-validation"` | no |  |


[Raw schema](https://github.com/litlfred/cat-harness/blob/main/schemas/skills/content-author/output.schema.json){: data-fa-link="source" data-src="schemas/skills/content-author/output.schema.json" data-repo="litlfred/cat-harness" } · [✎ Edit](https://github.com/litlfred/cat-harness/edit/main/schemas/skills/content-author/output.schema.json){: .fa-edit-source data-fa-link="edit" data-src="schemas/skills/content-author/output.schema.json" data-repo="litlfred/cat-harness" }
