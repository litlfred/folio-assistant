---
layout: default
generated: scripts/gen-schema-docs.ts — do not hand-edit; edit the schema
title: Content Publish
parent: Skill schema reference
---

# Content Publish

> Skill id: `content-publish`

_Generated from JSON Schema — do not edit by hand. Run `bun run cat-harness-tools/scripts/gen-schema-docs.ts`._

## Input

Input schema for content publication.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `versionIncrement` | `"major"` \| `"minor"` \| `"patch"` | **yes** |  |
| `releaseNotes` | string | no |  |
| `target` | `"github-release"` \| `"npm"` \| `"fhir-registry"` \| `"arxiv"` | no | Publication target. |
| `stagingLinks` | any | no | The staging preview of the work under review, as the request for feedback carried it, so the reviewer opens the changed pages rather than rebuilding links. Rule: cat-harness sdlc/skills/sdlc-core/staging-review.md §"The deep-link rule". |


[Raw schema](https://github.com/litlfred/cat-harness/blob/main/schemas/skills/content-publish/input.schema.json){: data-fa-link="source" data-src="schemas/skills/content-publish/input.schema.json" data-repo="litlfred/cat-harness" } · [✎ Edit](https://github.com/litlfred/cat-harness/edit/main/schemas/skills/content-publish/input.schema.json){: .fa-edit-source data-fa-link="edit" data-src="schemas/skills/content-publish/input.schema.json" data-repo="litlfred/cat-harness" }

## Output

Output schema for content publication.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | **yes** |  |
| `status` | `"published"` \| `"failed"` | **yes** |  |
| `publishedUrl` | string | no |  |
| `releaseTag` | string | no |  |
| `stagingLinks` | any | no | The staging preview of the work this output asks a person to look at: one deep link per changed page, with the same page on main. Required whenever a preview exists; when it does not, say so in `missing`. Rule: cat-harness sdlc/skills/sdlc-core/staging-review.md §"The deep-link rule". |


[Raw schema](https://github.com/litlfred/cat-harness/blob/main/schemas/skills/content-publish/output.schema.json){: data-fa-link="source" data-src="schemas/skills/content-publish/output.schema.json" data-repo="litlfred/cat-harness" } · [✎ Edit](https://github.com/litlfred/cat-harness/edit/main/schemas/skills/content-publish/output.schema.json){: .fa-edit-source data-fa-link="edit" data-src="schemas/skills/content-publish/output.schema.json" data-repo="litlfred/cat-harness" }
