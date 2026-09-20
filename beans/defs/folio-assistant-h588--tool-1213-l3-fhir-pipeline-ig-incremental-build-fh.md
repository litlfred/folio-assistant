---
# folio-assistant-h588
title: 'TOOL 12/13: l3-fhir-pipeline / ig-incremental-build — FHIR, IG, DAK (3 files, 0 entry points)'
status: todo
type: task
priority: low
created_at: 2026-09-20T04:35:26Z
updated_at: 2026-09-20T04:35:26Z
parent: folio-assistant-d308
---

Group 12 of 13 in `d308`. **3 files, 0 entry points** — `fsh-cone`, `dak-pdf`,
`qa-checkers-dak`.

**BPMN:** `l3-fhir-pipeline · Task_Sushi · Task_Validate · Task_IgPublisher`, and
`ig-incremental-build · Task_Cone` — which names `fsh-cone --changed` directly in
its task label, so the binding is not inferred.

**Target repo (#223):** `smart-base`.

**Why it is `low` and not `normal`:** three files, and the platform carries no
folio, so `qa-sweep` and `witness-refresh` FAIL BY DESIGN here — the first
preflights on `content/package.json`, the second needs
`folio-assistant/computations/`. A Tool node for this group cannot be exercised in
this repository. That is not a reason to skip it, but it is a reason to build it
after the twelve that can be verified where they live, and to say on the node that
its verification happens downstream.

## Done when
- [ ] a Tool node for the cone / SUSHI / publisher path
- [ ] `satisfies` names `l3-fhir-authoring`, `fhir-validation`, `ig-publication`
- [ ] the node states that it cannot be exercised in the platform repo, and why
- [ ] not "verified" on the strength of a dispatch that fails by design
