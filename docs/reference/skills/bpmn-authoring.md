---
layout: default
title: BPMN Authoring
parent: Skill schema reference
---

# BPMN Authoring

> Skill id: `bpmn-authoring`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for BPMN 2.0 business process authoring.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `processName` | string | **yes** | Name of the business process to model. |
| `sourceWorkflow` | string | no | Textual description or reference to the workflow to model. |
| `existingBpmn` | string | no | Path to existing BPMN file to update. |
| `participants` | array<string> | no | Actor/participant IDs involved in the process. |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/bpmn-authoring/input.schema.json)

## Output

Output schema for BPMN 2.0 business process authoring.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `bpmnFile` | string | **yes** | Path to the generated/updated BPMN file. |
| `diagramFile` | string | no | Path to the rendered diagram (SVG/PNG). |
| `taskCount` | integer | no |  |
| `gatewayCount` | integer | no |  |
| `participantCount` | integer | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/bpmn-authoring/output.schema.json)
