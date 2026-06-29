---
layout: default
title: L3 FHIR Authoring
parent: Skill schema reference
---

# L3 FHIR Authoring

> Skill id: `l3-fhir-authoring`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for L3 FHIR IG authoring. Creates machine-readable FHIR artifacts from L2 DAK specifications.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `artifactType` | `"logical-model"` \| `"profile"` \| `"questionnaire"` \| `"cql-library"` \| `"structure-map"` \| `"plan-definition"` \| `"measure"` \| `"test-case"` \| `"actor-definition"` \| `"requirements"` | **yes** | Type of FHIR artifact to author. |
| `l2Source` | string | **yes** | Path or reference to the L2 DAK source material. |
| `fshOutputDir` | string | no | Directory for FSH output files. (default: `"input/fsh"`) |
| `igRoot` | string | no | IG repository root directory. |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/l3-fhir-authoring/input.schema.json)

## Output

Output schema for L3 FHIR IG authoring.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `fshFiles` | array<object> | **yes** |  |
| `sushiResult` | object | **yes** |  |
| `generatedResources` | array<object> | no |  |

### `fshFiles[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | **yes** |  |
| `resourceType` | string | **yes** |  |
| `resourceId` | string | no |  |

### `sushiResult`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | `"success"` \| `"warnings"` \| `"errors"` | no |  |
| `resourceCount` | integer | no |  |
| `errorCount` | integer | no |  |
| `warningCount` | integer | no |  |

### `generatedResources[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | no |  |
| `resourceType` | string | no |  |
| `url` | string | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/l3-fhir-authoring/output.schema.json)
