---
# folio-assistant-sx4z
title: DMN decision tables for the four mechanical BPMN gateways
status: todo
type: task
created_at: 2026-08-26T15:29:15Z
updated_at: 2026-08-26T15:29:15Z
---

Follow-up to fq0b. Of the 10 decision points across the six diagrams, four have purely mechanical inputs and should be computed rather than judged: 'Build green, no sorries?' (lean_status), 'Draft QA green?' (publication QA), 'QC clean?' (IG Publisher QC), 'FHIR valid?' (validator). The repo already ships a dmn-authoring skill and schema. The other six ('Judgement call?', 'Accept, revise or discard?', 'Approved?', 'Clinically accurate?') stay human on purpose. Highest determinism per unit of work, and independent of the gating decision. See docs/proposals/workflow-orchestration.md §6.
