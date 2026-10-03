---
# folio-assistant-s4ta
title: 'OpenAPI harness: a subgraph for OpenAPI documentation sources with its own rendering sub-pipeline; smart-trust depends on smart-base + openapi'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-03T09:29:09Z
updated_at: 2026-10-03T09:44:08Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-03, verbatim:

> there is one thing wonky in openapi handing (in smart-trust there is an import openapi of the trust netework gateway. really there should be a KG harness specfiic to openapi docuemnataiton sources with its own rendering sub-pipeline. and then the smart-trust repo has a smart-base harness and a openapi harness. openapi ahrness could be in cat-harness repo for now as subgraph)

## What is wonky today
smart-trust's published `openapi/` holds the **trust network gateway's** API — a domain API that merely lives in the IG's output. `ingest-ig-artifacts.ts` already refuses to treat it as the IG's own API ("Keyed off the ENUMERATION SCHEMAS at the published root. Never off the presence of `openapi/`, which in smart-trust holds the DDCC Gateway API"), and the IG API hub links into it (`igApiHubLinks`: `openapi/index.html`). It has no home of its own: no graph kind, no renderer.

## The shape the owner asked for
- An **openapi harness**: a KG graph kind for OpenAPI documentation SOURCES, with its own rendering sub-pipeline.
- For now a **subgraph in cat-harness**, not its own repository.
- **smart-trust depends on two harnesses**: smart-base (for its WHO/DAK surface) and openapi (for the gateway API).

## Distinct from bean d313
d313 renames the per-artefact OpenAPI *sidecars* an IG's post-processing publishes (the IG API). This bean is about a standalone OpenAPI *document* (the gateway) — a different source with a different renderer.

## Owner's answers, 2026-10-03 (verbatim)

> kind is an OpenAPI node. need page + IRI for each operation. swagger style can be dynamically geenated. use dynamic loading as much as possible. check skills on gh pages authoring. smart-trust would have an cat-openapi.config.json in the repo root or so

- [x] graph kind: the node is an **OpenAPI document**
- [x] every **operation** gets its own page AND its own IRI
- [x] Swagger-style rendering is generated dynamically, in the browser; load dynamically wherever possible
- [x] follow the repo's GitHub Pages authoring skills
- [x] smart-trust declares it with a `cat-openapi.config.json` at its root

## Done when
smart-trust's gateway OpenAPI is declared as a node of an openapi subgraph in cat-harness, rendered by that subgraph's own pipeline, and smart-trust's declaration names both dependencies.
