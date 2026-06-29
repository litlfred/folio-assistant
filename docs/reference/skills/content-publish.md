---
layout: default
title: Content Publish
parent: Skill schema reference
---

# Content Publish

> Skill id: `content-publish`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for content publication.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `versionIncrement` | `"major"` \| `"minor"` \| `"patch"` | **yes** |  |
| `releaseNotes` | string | no |  |
| `target` | `"github-release"` \| `"npm"` \| `"fhir-registry"` \| `"arxiv"` | no | Publication target. |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/content-publish/input.schema.json)

## Output

Output schema for content publication.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | **yes** |  |
| `status` | `"published"` \| `"failed"` | **yes** |  |
| `publishedUrl` | string | no |  |
| `releaseTag` | string | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/content-publish/output.schema.json)
