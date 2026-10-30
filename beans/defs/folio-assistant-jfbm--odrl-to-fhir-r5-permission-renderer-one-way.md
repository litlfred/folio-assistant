---
# folio-assistant-jfbm
$schema: bean/1.0.0
title: 'One-way renderer: ODRL Agreement to FHIR R5 Permission (output only)'
status: in-progress
type: task
priority: low
created_at: 2026-10-30T19:24:00Z
updated_at: 2026-10-30T20:16:15Z
parent: folio-assistant-negd
---

Owner card 2026-10-30 19:23Z "A: Yes, later bean": FHIR R5 Permission (Trial Use) approved **for output only**. ODRL stays the source of truth; nothing reads Permission back. Home: smart-trust-server (repo to be created by the owner). Issue: litlfred/folio-assistant#2702.

Mapping (from the 14:15Z analysis in this thread): permission/prohibition to `rule.type` permit/deny; conflict strategy to `combining`; assigner to `asserter`; dateTime constraints to `validity`; the public agreement (DCAT distribution + `spdx:checksum`) to `justification.basis`/`evidence`; target to `rule.data`; assignee/action/purpose (HL7 PurposeOfUse) to `rule.activity`. Lossy: duties only roughly to `rule.limit`; per-action `elapsedTime` and refinements have no exact home, so the renderer must report what it dropped rather than drop it silently.

## Done when
- A worked DSA example renders to a Permission that validates (SUSHI/IG validation, 0 errors).
- Every ODRL term that has no Permission home is listed in the render output as dropped.
- No field outside FHIR R5 Permission is invented.
