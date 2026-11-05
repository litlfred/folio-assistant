---
# folio-assistant-y4pw
$schema: bean/1.0.0
title: 'Freeze-set content calls: four site-re-pin reds that need an author, not a regen'
status: todo
type: task
priority: normal
created_at: 2026-11-05T17:40:03Z
updated_at: 2026-11-05T17:40:03Z
parent: folio-assistant-rwmf
tags:
    - repin-freeze-2026-11-05
---

Filed from folio-assistant-rpc6. Owner card (2026-11-05, Q4 "1. Work items, known"): each of these is a content decision, so it is recorded here and treated as a KNOWN red on the site re-pins until it is done. Found by the freeze-set survey (cat-harness a2da2ed, cat-harness-tools 78a982e, folio-assistant-core 4f18e66, who-iris 90bb3f5, smart-base 1e111a6, fhir-harness 299de78, bootstrap-tools 9f478d4).

- [ ] **who-iris command paths** (`check:command-paths`): docs/oxigraph-pipeline-requirements.md:71,72, skills/iris-cdn-signing.md:125, skills/iris-oxigraph.md:27,30,33,35 name scripts that no longer exist (scripts/build-iris-oxigraph.ts, scripts/iris-oxigraph-search.ts, scripts/iris-cdn/run.ts, scripts/tests/iris-oxigraph.test.ts). Restore the scripts or rewrite the skills.
- [ ] **cat-harness CRDM links** (`check:subgraphs`): methodologies/crdm.md (6 links) and sdlc/skills/crdm/crdm-requirements-template.md point at library/process/path-2012-common-requirements-mhis-crdm/…, an entry that is not in the library. Ingest the entry or drop the links.
- [ ] **Undeclared serialisations / visualisers** (`check:subgraph-coverage`): cat-harness sdlc, sdlc-processes, sdlc-skills, work-plan, work-plan-skills, work-plan-tools; smart-base smart-base-templates; smart-ra references; who-iris attestations. Declare json/jsonld/schema.json and a visualiser, or an exemption with a reason, in each instance's <name>.json.
- [ ] **Core example path** (`check:command-paths`): folio-assistant-core skills/content/folio-document-adapter/review-sheet-script.md:221 names review/public-comment/sheet-sync.json. Mark it as an example path or qualify it.

## Done when
Each item is fixed in its owning repo and merged, or the owner rules it stays.
