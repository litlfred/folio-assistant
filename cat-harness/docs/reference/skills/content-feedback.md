---
layout: default
generated: scripts/gen-schema-docs.ts — do not hand-edit; edit the schema
title: Content Feedback
parent: Skill schema reference
---

# Content Feedback

> Skill id: `content-feedback`

_Generated from JSON Schema — do not edit by hand. Run `bun run cat-harness/scripts/gen-schema-docs.ts`._

## Input

Input schema for feedback collection and triage.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `source` | `"github-issues"` \| `"survey"` \| `"implementation-report"` \| `"clinical-review"` | **yes** | Source of feedback. |
| `publishedVersion` | string | no | Version the feedback relates to. |
| `feedbackItems` | array<object> | no |  |

### `feedbackItems[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `description` | string | **yes** |  |
| `severity` | `"critical"` \| `"major"` \| `"minor"` \| `"enhancement"` | no |  |
| `component` | string | no |  |
| `reporter` | string | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/content-feedback/input.schema.json) · [✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/schemas/skills/content-feedback/input.schema.json){: .fa-edit-source }

## Output

Output schema for triaged feedback.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `triagedItems` | array<object> | **yes** |  |
| `summary` | object | no |  |

### `triagedItems[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | **yes** |  |
| `priority` | `"P0"` \| `"P1"` \| `"P2"` \| `"P3"` | **yes** |  |
| `disposition` | `"backlog"` \| `"next-sprint"` \| `"wont-fix"` \| `"duplicate"` \| `"needs-info"` | **yes** |  |
| `assignee` | string | no |  |
| `linkedIssue` | string | no |  |

### `summary`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `total` | integer | no |  |
| `critical` | integer | no |  |
| `major` | integer | no |  |
| `minor` | integer | no |  |
| `enhancement` | integer | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/content-feedback/output.schema.json) · [✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/schemas/skills/content-feedback/output.schema.json){: .fa-edit-source }
