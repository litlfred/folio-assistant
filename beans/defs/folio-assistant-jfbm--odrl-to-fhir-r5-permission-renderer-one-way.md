---
# folio-assistant-jfbm
$schema: bean/1.0.0
title: 'One-way renderer: ODRL Agreement to FHIR R5 Permission (output only)'
status: in-progress
type: task
priority: low
created_at: 2026-10-30T19:24:00Z
updated_at: 2026-10-30T20:30:00Z
parent: folio-assistant-negd
---

Owner card 2026-10-30 19:23Z "A: Yes, later bean": FHIR R5 Permission (Trial Use) approved **for output only**. ODRL stays the source of truth; nothing reads Permission back. Home: smart-trust-server (repo to be created by the owner). Issue: litlfred/folio-assistant#2702.

Mapping (from the 14:15Z analysis in this thread): permission/prohibition to `rule.type` permit/deny; conflict strategy to `combining`; assigner to `asserter`; dateTime constraints to `validity`; the public agreement (DCAT distribution + `spdx:checksum`) to `justification.basis`/`evidence`; target to `rule.data`; assignee/action/purpose (HL7 PurposeOfUse) to `rule.activity`. Lossy: duties only roughly to `rule.limit`; per-action `elapsedTime` and refinements have no exact home, so the renderer must report what it dropped rather than drop it silently.

## Done when
- A worked DSA example renders to a Permission that validates (SUSHI/IG validation, 0 errors).
- Every ODRL term that has no Permission home is listed in the render output as dropped.
- No field outside FHIR R5 Permission is invented.

## Implementation & Verification (2026-10-30)

- **Code PR:** `litlfred/fhir-harness#229` (`schemas/odrl-to-fhir-r5-permission.ts`, `schemas/odrl-to-fhir-r5-permission.test.ts`, `skills/content/fhir-ig-authoring/pcf-consent.md`, `test/support/pcf/hl7.fhir.r5.core#5.0.0/`).
- **Worked FSH Example PR:** `litlfred/smart-trust-phw#10` (`input/fsh/examples/DSAPermissionExample.fsh`).
- **Verification (`42 pass, 0 fail` across 4 test files):**
  1. Both worked DSA examples (`DSA-042` v1 from `folio-assistant-core#249` and `DSAPermissionExample` / Agreement 42 v3 from `smart-trust-phw#10`) render to a FHIR R5 `Permission` that validates against `hl7.fhir.r5.core#5.0.0/StructureDefinition-Permission.json` with **0 errors**, and `fhirR5PermissionToFsh` compiles with SUSHI (`fhirVersion: 5.0.0`) with **0 Errors and 0 Warnings**.
  2. Every ODRL 2.2, DCAT 3, or SPDX term with no exact `Permission` home (`@type`, `profile`, `inheritFrom`, `conflict: "odrl:invalid"`, `spdx:checksum`, `isA`, exclusive `lt`/`gt` bounds, `elapsedTime`, BPMN scope, negative purposes, conflicting rule periods, `refinement`, `remedy`, `consequence`, and duties/duty constraints) is explicitly listed in `dropped: DroppedOdrlTerm[]`.
  3. `FhirR5PermissionSchema` and its required code lists are built directly from `hl7.fhir.r5.core#5.0.0` `StructureDefinition-Permission.json` and `CodeSystem-*.json`, refusing any invented element at any nesting level.
