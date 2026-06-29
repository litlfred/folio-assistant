---
layout: default
title: Terminology Management
parent: Skill schema reference
---

# Terminology Management

> Skill id: `terminology-management`

_Generated from JSON Schema — do not edit by hand. Run `bun run scripts/gen-schema-docs.ts`._

## Input

Input schema for terminology management — CodeSystems, ValueSets, ConceptMaps.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `operation` | `"create-codesystem"` \| `"create-valueset"` \| `"create-conceptmap"` \| `"validate-bindings"` \| `"map-to-standard"` | **yes** | Terminology operation to perform. |
| `targetStandard` | `"ICD-11"` \| `"SNOMED-CT"` \| `"LOINC"` \| `"IPS"` \| `"WHO-FIC"` \| `"WHO-ATC"` | no | Target standard terminology for mapping. |
| `inputFile` | string | no | Path to input terminology resource (FSH, JSON, CSV). |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/terminology-management/input.schema.json)

## Output

Output schema for terminology management operations.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resources` | array<object> | **yes** |  |
| `unmappedConcepts` | array<string> | no | Concepts that could not be mapped to the target standard. |

### `resources[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `path` | string | **yes** |  |
| `resourceType` | `"CodeSystem"` \| `"ValueSet"` \| `"ConceptMap"` | **yes** |  |
| `url` | string | no |  |
| `conceptCount` | integer | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/terminology-management/output.schema.json)
