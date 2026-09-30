---
layout: default
generated: scripts/gen-schema-docs.ts — do not hand-edit; edit the schema
title: Content Review
parent: Skill schema reference
---

# Content Review

> Skill id: `content-review`

_Generated from JSON Schema — do not edit by hand. Run `bun run cat-harness/scripts/gen-schema-docs.ts`._

## Input

Input schema for formal content review and approval workflow.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reviewType` | `"l2-to-l3-gate"` \| `"l3-to-publish-gate"` \| `"change-assessment"` \| `"final-signoff"` | **yes** | Type of review phase gate. |
| `contentRef` | string | **yes** | Git ref or path to the content being reviewed. |
| `previousVersion` | string | no | Git ref of the previous approved version (for diff). |
| `validationReport` | string | no | Path to the validation report for this content. |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/skills/content-review/input.schema.json) · [✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/schemas/skills/content-review/input.schema.json){: .fa-edit-source }

## Output

What a review produces: findings, a decision about them, and the audit notes that justify it. A finding is an observation; a decision is an act about a set of findings; neither determines the other. Mirrors schemas/qa-review.ts — see skills/folio-core/decision-audit.md.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `findings` | array<object> | **yes** | One entry per observation. Immutable once raised: to disagree with one, overrule it in the decision. |
| `decision` | object | **yes** |  |
| `notes` | array<object> | **yes** | Why the decision was made, and why each overruled finding was left. |

### `findings[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | **yes** |  |
| `subject` | string | **yes** | Block label, skill name or repo-relative path. |
| `criterion` | string | no |  |
| `reviewer` | object | **yes** |  |
| `severity` | `"critical"` \| `"major"` \| `"minor"` | no | Machine axis — what kind of breakage. Required of a script reviewer. |
| `weight` | `"blocking"` \| `"suggestion"` \| `"praise"` | no | Human axis — what the reviewer asks of the gate. Required of a human reviewer. `praise` has no image under the machine axis. |
| `detail` | string | **yes** |  |
| `evidence` | array<any> | no |  |
| `raised_at` | string (date-time) | no |  |

#### `findings[].reviewer`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `kind` | `"script"` \| `"agent"` \| `"human"` | **yes** |  |
| `id` | string | **yes** |  |
| `version` | string | no |  |

### `decision`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `outcome` | `"approve"` \| `"request-changes"` \| `"reject"` | **yes** |  |
| `role` | string | **yes** | Role id from schemas/role-graph.ts — the lane this was decided in. |
| `by` | object | **yes** |  |
| `considered` | array<string> | **yes** | Finding ids weighed, overruled or not. |
| `overrules` | array<object> | no | Findings the decision went against. The finding stays on the record; the note says why. |
| `notes` | array<string> | **yes** | Audit-note ids. At least one. |
| `decided_at` | string (date-time) | no |  |

#### `decision.by`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `kind` | `"script"` \| `"agent"` \| `"human"` | **yes** |  |
| `id` | string | **yes** |  |

#### `decision.overrules[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `finding` | string | **yes** |  |
| `note` | string | **yes** |  |

### `notes[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | **yes** |  |
| `author` | object | **yes** |  |
| `rationale` | string | **yes** |  |
| `cites` | array<any> | **yes** | A rationale with no citation is an assertion. |
| `proposed_by` | string | no | The agent that assembled the citations. Never the author — searching the corpus is clerical work. |
| `written_at` | string (date-time) | no |  |

#### `notes[].author`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `kind` | `"script"` \| `"agent"` \| `"human"` | **yes** |  |
| `id` | string | **yes** |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/skills/content-review/output.schema.json) · [✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/schemas/skills/content-review/output.schema.json){: .fa-edit-source }
