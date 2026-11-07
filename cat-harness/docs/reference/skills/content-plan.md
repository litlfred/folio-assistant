---
layout: default
generated: scripts/gen-schema-docs.ts — do not hand-edit; edit the schema
title: Content Plan
parent: Skill schema reference
---

# Content Plan

> Skill id: `content-plan`

_Generated from JSON Schema — do not edit by hand. Run `bun run cat-harness-tools/scripts/gen-schema-docs.ts`._

## Input

Input schema for content planning — scope, team, timeline, governance.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectName` | string | **yes** |  |
| `scope` | string | no | Description of the content scope. |
| `targetDate` | string (date) | no |  |
| `teamSize` | integer | no | min: 1 |
| `sprintDuration` | `"1w"` \| `"2w"` \| `"3w"` \| `"4w"` | no | default: `"2w"` |


[Raw schema](https://github.com/litlfred/cat-harness/blob/main/schemas/skills/content-plan/input.schema.json){: data-fa-link="source" data-src="schemas/skills/content-plan/input.schema.json" data-repo="litlfred/cat-harness" } · [✎ Edit](https://github.com/litlfred/cat-harness/edit/main/schemas/skills/content-plan/input.schema.json){: .fa-edit-source data-fa-link="edit" data-src="schemas/skills/content-plan/input.schema.json" data-repo="litlfred/cat-harness" }

## Output

Output schema for content planning.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `plan` | object | **yes** |  |
| `stagingLinks` | any | no | The staging preview of the work this output asks a person to look at: one deep link per changed page, with the same page on main. Required whenever a preview exists; when it does not, say so in `missing`. Rule: cat-harness sdlc/skills/sdlc-core/staging-review.md §"The deep-link rule". |

### `plan`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectName` | string | **yes** |  |
| `sprints` | array<object> | **yes** |  |
| `team` | array<object> | **yes** |  |

#### `plan.sprints[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `number` | integer | no |  |
| `startDate` | string (date) | no |  |
| `endDate` | string (date) | no |  |
| `goals` | array<string> | no |  |

#### `plan.team[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `actorId` | string | no |  |
| `name` | string | no |  |
| `responsibilities` | array<string> | no |  |


[Raw schema](https://github.com/litlfred/cat-harness/blob/main/schemas/skills/content-plan/output.schema.json){: data-fa-link="source" data-src="schemas/skills/content-plan/output.schema.json" data-repo="litlfred/cat-harness" } · [✎ Edit](https://github.com/litlfred/cat-harness/edit/main/schemas/skills/content-plan/output.schema.json){: .fa-edit-source data-fa-link="edit" data-src="schemas/skills/content-plan/output.schema.json" data-repo="litlfred/cat-harness" }
