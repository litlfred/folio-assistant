---
# folio-assistant-dmx1
title: 'DISTRIBUTED GRAPH KINDS: each harness declares the subgraph types it owns; no central registry (owner ruling 2026-10-04)'
status: todo
type: feature
created_at: 2026-10-04T17:04:22Z
updated_at: 2026-10-04T17:04:22Z
parent: folio-assistant-fs43
---

Owner, 2026-10-04, verbatim: *"there should not be a central registry for declaring mount tools and subgraph types"*.

## What exists, measured 2026-10-04
- `cat-harness/schemas/graph-kind-registry.ts` declares **57** graph kinds centrally. They include harness-specific ones: the FHIR kinds (`fhir-artifact-index`, `ig-metadata-index`, and, added today on #2082, `ig-pages` and `ig-ast`) and cat-openapi's `openapi`. All of them live in cat-harness, the base layer. Two kinds are already split into their own files (`folio-graph-kind.ts`, `glossary-graph-kind.ts`) but are still imported centrally.
- Every reader (`graphLayer`, `isRenderable`, `isDerivedGraph`, …) already takes a `registry` parameter and defaults it to `defaultGraphKinds`. So the readers are ready for a computed registry; the DECLARATIONS are not.
- `contributions.ts` lets a dependency contribute block kinds, adapters, tools, QA checkers, renderers and pipeline plugins, but not graph kinds. Its collision rule is the one this needs: a kind claimed twice throws, and the same contributor twice is a no-op (the diamond).

## The rule
A harness or instance declares the graph kinds it owns. The registry a reader sees is COMPUTED over the instance's `needs` overlay, the way skills already are (`resolveSkillDirs`). The base layer declares only its own kinds.

## Done when
- [ ] the owner picks where a kind is declared (asked 2026-10-04)
- [ ] the registry is computed from declarations across `needs`, and a kind claimed twice is refused
- [ ] fhir-harness owns its kinds (fhir-artifact-index, ig-metadata-index, ig-pages, ig-ast), and cat-openapi owns `openapi`
- [ ] the generated artefacts (kind table, avatars, UML, glossary) follow the declarations
- [ ] `graph-kind-registry.ts` holds only cat-harness's own kinds

## Not this bean
Mount tools are a sibling bean, and the special-branches table is rva2.
