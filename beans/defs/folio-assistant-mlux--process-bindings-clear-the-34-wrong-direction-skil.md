---
# folio-assistant-mlux
title: 'PROCESS BINDINGS: clear the 33 wrong-direction skill bindings check:process-bindings baselined'
status: todo
type: task
priority: normal
created_at: 2026-10-03T10:38:18Z
updated_at: 2026-10-03T10:38:18Z
---

Owner, 2026-10-03: a process may bind only skills (and through them Tools) from its own instance or one it needs — "general rule, not just fhir-harness". `check:process-bindings` (cat-harness/scripts/, PR #1968) found 33 unique wrong-direction bindings (35 refs) in 9 diagrams on 2026-10-03, all baselined in cat-harness/scripts/process-bindings.baseline.ts. Each fix is EITHER move the process up to the instance holding the skill, OR move the skill down if it is generic — an owner call per group.

Root cause the gate fixes: kg-audit's skill-ref-resolves resolves against knownSkills(root), which is CHECKOUT-scoped in this pre-split repo, so 'resolves' meant 'exists anywhere'.

## Done when

- [ ] cat-harness ingestion processes (6 diagrams, 28 refs) → folio-assistant-core's document-intake. library-ingestion says 'Ingestion is a HARNESS capability, not core's', which argues for moving document-intake DOWN to cat-harness. Owner to confirm.
- [ ] cat-harness/processes/content/ig-ast-delta-review.bpmn (3) → fhir-harness's ig-ast-delta: move the process up to fhir-harness (a generic IG process), or the skill down.
- [ ] folio-assistant-core content-change-review.bpmn Task_DetectScope → folio-assistant-sci's semantic-review-scoping
- [ ] folio-assistant-core draft-to-publication.bpmn Task_PublishRelease → fhir-harness's ig-publication
- [ ] fhir-harness l3-fhir-pipeline.bpmn Task_MapL2 → smart-base's l2-dak-authoring: cleared by veiu (#1964, the BPMN moves up to smart-base)
- [ ] kg-audit skill-ref-resolves gets an instance-scoped resolvable set, or explicitly defers to this gate (follow-up, ask the owner)
- [ ] BASELINE is [] and the gate passes
- [ ] (minor) document-ingestion.bpmn Task_Citeable carries the same skill ref three times
