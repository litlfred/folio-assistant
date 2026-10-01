---
# folio-assistant-r939
title: 'SMART-* SEPARATION stage B: FHIR-generic IG schemas and ingest scripts move into fhir-harness; wrong-direction skill edges'
status: in-progress
type: task
created_at: 2026-10-01T09:13:21Z
updated_at: 2026-10-01T09:13:21Z
parent: folio-assistant-n3ni
---

Stage B of cat-harness/docs/proposals/smart-separation-2026-10-01.md (#1767). Owner: "push generic stuff as much as possible into fhir-harness first".

## Done when
- [ ] B1 ig-menu, ig-chrome, ig-metadata-index schemas (+tests) -> fhir-harness/schemas/; graph-kind registry validators repointed (fhir-harness:...)
- [ ] B2 ingest-ig-menu, ingest-ig-chrome (+test) -> fhir-harness/scripts/; ingest-ig-chrome's hard-coded who.css candidate list becomes an option
- [ ] B3 wrong-direction edges: fhir-harness skill-definitions name package fhir-ig-authoring; l3-fhir-authoring no longer dependsOn the WHO l2-dak-authoring skill; ig-publication enum; prose links
- [ ] B4 gates: no new failure vs origin/main
Deferred to a later B': fsh-cone (cat-harness/scripts/measure-logic-layer-edges.ts imports it; moving it now makes an upward edge), pin-smart-base-terminology, the 4 generic Tool nodes from smart-base/tools.
Not here: fhir-artifact-index schema + ingest-ig-artifacts + check-artifact-index move in stage C with the neutral overlay (Q3).
