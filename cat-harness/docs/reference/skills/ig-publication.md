---
layout: default
generated: scripts/gen-schema-docs.ts — do not hand-edit; edit the schema
title: IG Publication
parent: Skill schema reference
---

# IG Publication

> Skill id: `ig-publication`

_Generated from JSON Schema — do not edit by hand. Run `bun run cat-harness/scripts/gen-schema-docs.ts`._

## Input

Input schema for FHIR Implementation Guide publication.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `igRoot` | string | **yes** | Path to the IG repository root. |
| `versionIncrement` | `"major"` \| `"minor"` \| `"patch"` | **yes** | Semantic version increment type. |
| `releaseNotes` | string | no | Release notes for this publication. |
| `publicationTarget` | `"github-pages"` \| `"smart-who-int"` \| `"both"` | no | default: `"github-pages"` |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/skills/ig-publication/input.schema.json) · [✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/schemas/skills/ig-publication/input.schema.json){: .fa-edit-source }

## Output

Output schema for FHIR IG publication.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | **yes** |  |
| `publishedUrl` | string | **yes** |  |
| `releaseTag` | string | no |  |
| `releaseBranch` | string | no |  |
| `publicationRequestPath` | string | no |  |
| `buildStatus` | `"success"` \| `"failed"` | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/skills/ig-publication/output.schema.json) · [✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/schemas/skills/ig-publication/output.schema.json){: .fa-edit-source }
