---
# folio-assistant-h7ap
$schema: bean/1.0.0
title: 'IG API hub: generic, in fhir-harness, rendered by the just-the-docs pipeline from the index (DAK API is configuration)'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-23T18:30:00Z
updated_at: 2026-10-23T18:30:00Z
parent: folio-assistant-n3h9
---

Owner, 2026-10-23, verbatim: "dak-api we want to move to more like something like fhir-api in that it is not WHO DAK speicifc and should be in fhir-harness. I thought there was a bean for this already. Can you please investigate and pick up" and "This should be part of the just the docs, rendering pipeline changes".

Related: d313 and izx8 (completed) renamed fhir-harness's rendering side to "IG API". 4u5d (the index built at publish) needs the hub from the build, not from a stale Publisher fragment.

## What is still WHO-only

- smart-base `scripts/dak-api-hub-page.ts` and `templates/dak-api-hub.js`: the thin hub page and its node. Generic in substance: it lists every sidecar, binds it by fhir-harness's own rule (a copy of `attachSidecars`), and links artefact and view pages.
- The index's `igApiHub` holds a copy of the hub HTML the Publisher's post-processing wrote. That HTML is no longer published (the live `dak-api.html` is the thin page), so the copy is stale and cannot be rebuilt.
- The generators (`generate_*.py`, run by `dak-ast-sidecars.ts`) are WHO's post-processing. Phase 2.

## Phase 1: the hub (this bean)

- [ ] fhir-harness: the hub node and page built from the index's bound sidecars (no second binding rule), drawn by the docs pipeline (`gen-ig-pages`) and by the IG's own site (`ig-repo-site`)
- [ ] the page name and label come from the layer above's `ig-api.json` (`label`, `hubPage`); defaults "IG API" and `ig-api.html`
- [ ] `build-ig-indexes`: `igApiHub` is a link with no copy (fhir-harness#138)
- [ ] smart-base: drop `dak-api-hub-page.ts` and its loader; `ig-site:sidecars` names `dak-api.html` and "DAK API" in the descriptor
- [ ] the Publisher-fragment path (`igApiHubFragment`, `igApiHubLinks`) retired once no committed index holds a fragment

## Phase 2: the generators (to decide)

JSON Schema, JSON-LD and OpenAPI from ValueSets and logical models are generic FHIR. Porting them from WHO's Python into fhir-harness would make the whole IG API generic.
