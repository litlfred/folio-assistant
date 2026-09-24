---
layout: default
generated: scripts/gen-schema-docs.ts — do not hand-edit; edit the schema
title: FHIR Validation
parent: Skill schema reference
---

# FHIR Validation

> Skill id: `fhir-validation`

_Generated from JSON Schema — do not edit by hand. Run `bun run cat-harness/scripts/gen-schema-docs.ts`._

## Input

Input schema for FHIR validation — runs SUSHI, IG Publisher QA, and conformance checks.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `igRoot` | string | **yes** | Path to the IG repository root. |
| `validationLevel` | `"sushi-only"` \| `"publisher-qa"` \| `"full"` | no | Level of validation to perform. (default: `"full"`) |
| `targetProfiles` | array<string> | no | Specific CRMI profiles to validate against (Shareable, Publishable, Computable, Executable). |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/fhir-validation/input.schema.json) · [✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/schemas/skills/fhir-validation/input.schema.json){: .fa-edit-source }

## Output

Output schema for FHIR validation results.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `overallStatus` | `"pass"` \| `"warnings"` \| `"errors"` | **yes** |  |
| `sushiResult` | object | no |  |
| `publisherResult` | object | no |  |
| `conformanceResults` | array<object> | no |  |

### `sushiResult`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | no |  |
| `errors` | integer | no |  |
| `warnings` | integer | no |  |

### `publisherResult`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | string | no |  |
| `qaHtmlPath` | string | no |  |
| `errorCount` | integer | no |  |
| `warningCount` | integer | no |  |
| `infoCount` | integer | no |  |

### `conformanceResults[]`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `resource` | string | no |  |
| `profile` | string | no |  |
| `status` | `"conformant"` \| `"non-conformant"` | no |  |
| `issues` | array<string> | no |  |


[Raw schema](https://github.com/litlfred/folio-assistant/blob/main/schemas/skills/fhir-validation/output.schema.json) · [✎ Edit](https://github.com/litlfred/folio-assistant/edit/main/schemas/skills/fhir-validation/output.schema.json){: .fa-edit-source }
