---
# folio-assistant-r939
title: 'SMART-* SEPARATION stage B: FHIR-generic IG schemas and ingest scripts move into fhir-harness; wrong-direction skill edges'
status: completed
type: task
priority: normal
created_at: 2026-10-01T09:13:21Z
updated_at: 2026-10-04T07:07:44Z
parent: folio-assistant-n3ni
---

Stage B of cat-harness/docs/proposals/smart-separation-2026-10-01.md (#1767). Owner: "push generic stuff as much as possible into fhir-harness first".

## Done when
- [x] B1 ig-menu, ig-chrome, ig-metadata-index schemas (+tests) -> fhir-harness/schemas/; graph-kind registry validators repointed (fhir-harness:...)
- [x] B2 ingest-ig-menu, ingest-ig-chrome (+test) -> fhir-harness/scripts/
- [x] B3 wrong-direction edges: fhir-harness skill-definitions name package fhir-ig-authoring; ig-publication target canonical-host
- [x] B4 CI on 55e25d5a: no failure that main does not also have
- [x] B'1 pin-smart-base-terminology -> fhir-harness/scripts/pin-ig-terminology.ts (--pin/--out/--source); Tool node pin-ig-terminology in fhir-harness. The WHO pin record and snapshot STAY in cat-harness/external-schemas/: check:term-mapping (core) reads them, so moving them would make a cat-harness -> smart-base edge.
- [x] B'2 logical-model-schemas, valueset-schemas, jsonld-vocabularies Tool nodes -> fhir-harness, satisfying ig-build-pipeline (the strippers' precedent). smart-liquid-variables STAYS in smart-base: its smart__ prefix and include path are WHO's.
- [x] B'3 regen, CI no new failure

Owner, 2026-10-01: option 1 on the l3-fhir-authoring -> l2-dak-authoring dependsOn: KEEP it for now; in stage D make l3's input a generic source model and let smart-base supply the L2->L3 specialisation.

Deferred: fsh-cone (cat-harness/scripts/measure-logic-layer-edges.ts imports it). Found, for stage C: fhir-harness/AGENTS.md says "nothing here may know about WHO", and gen-ig-pages (stage A) still writes "mirrors a published WHO Implementation Guide" and renders DAK sections: needs a publish-note flag and the neutral overlay.

## Summary of Changes

Closed 2026-10-04 on evidence, by the wm63 session. Stage B landed as #1782 (merge 548b9b091c9). Every gating check on its head was green: Repository gates, TypeScript, E2E, Skill-registration, Python imports, .jsonld sync. The one red run, `cleanup`, is the post-merge preview teardown, not a gate. Downstream: the fhir-harness exclusion gate (#1968) runs over the schemas and ingest scripts this stage moved, and it is green.
