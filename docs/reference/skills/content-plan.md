---
layout: default
title: Content Plan
parent: Skill schema reference
---

# Content Plan

> Skill id: `content-plan`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for content planning — scope, team, timeline, governance.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `projectName` | string | **yes** |  |
| `scope` | string | no | Description of the content scope. |
| `targetDate` | string (date) | no |  |
| `teamSize` | integer | no | min: 1 |
| `sprintDuration` | `"1w"` \| `"2w"` \| `"3w"` \| `"4w"` | no | default: `"2w"` |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/content-plan/input.schema.json)

## Output

Output schema for content planning.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `plan` | object | **yes** |  |

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


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/content-plan/output.schema.json)
