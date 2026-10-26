---
# folio-assistant-h7ap
$schema: bean/1.0.0
title: 'IG API hub: generic, in fhir-harness, rendered by the just-the-docs pipeline from the index (DAK API is configuration)'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-23T18:30:00Z
updated_at: 2026-10-26T10:32:00Z
parent: folio-assistant-n3h9
---

Owner, 2026-10-23, verbatim: "dak-api we want to move to more like something like fhir-api in that it is not WHO DAK speicifc and should be in fhir-harness. I thought there was a bean for this already. Can you please investigate and pick up" and "This should be part of the just the docs, rendering pipeline changes".

Related: d313 and izx8 (completed) renamed fhir-harness's rendering side to "IG API". 4u5d (the index built at publish) needs the hub from the build, not from a stale Publisher fragment.

## What is still WHO-only

- smart-base `scripts/dak-api-hub-page.ts` and `templates/dak-api-hub.js`: the thin hub page and its node. Generic in substance: it lists every sidecar, binds it by fhir-harness's own rule (a copy of `attachSidecars`), and links artefact and view pages.
- The index's `igApiHub` holds a copy of the hub HTML the Publisher's post-processing wrote. That HTML is no longer published (the live `dak-api.html` is the thin page), so the copy is stale and cannot be rebuilt.
- The generators (`generate_*.py`, run by `dak-ast-sidecars.ts`) are WHO's post-processing. Phase 2.

## Phase 1: the hub (this bean)

- [x] fhir-harness: the hub node and page built from the index's bound sidecars (no second binding rule), drawn by the docs pipeline (`gen-ig-pages`), the IG site fill and the IG's own site (`ig-repo-site`): fhir-harness#140
- [x] the label comes from the layer above's `ig-api.json`, the page is the IG's page holding its `placeholder`; defaults "IG API" and `ig-api.html`
- [x] `build-ig-indexes`: `igApiHub` holds `{url, placeholder, label}`, no copy (fhir-harness#140)
- [x] smart-base: drop `dak-api-hub-page.ts` and its loader (smart-base#139)
- [ ] the Publisher-fragment path (`igApiHubFragment`, `igApiHubLinks`) retired once no committed index holds a fragment

## Phase 2: the generators

Owner chose "A. Port to fhir-harness", 2026-10-23.

- [x] `ig-api-gen.ts`: TypeScript port of the four generators, read from the AST (fhir-harness#141). Parity over smart-trust, smart-base and smart-immunizations: all 1,132 JSON files have the same content as the Python output.
- [x] smart-base `ig-site:sidecars` runs it; `dak-ast-sidecars.ts` retired (smart-base#139)
- [x] merge order: fhir-harness#127 (`8fed2e873b`) → #138 (`c9da7dc805`) → #140 (`bd698b2b7b`) → #141 (`7f75360f07`), re-pin, then smart-base#139 (`e31d4b2307`, merged 2026-10-23T23:57:08Z)
