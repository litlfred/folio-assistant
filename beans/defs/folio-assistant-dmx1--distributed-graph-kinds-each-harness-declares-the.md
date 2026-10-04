---
# folio-assistant-dmx1
title: 'DISTRIBUTED GRAPH KINDS: each harness declares the subgraph types it owns; no central registry (owner ruling 2026-10-04)'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-04T17:04:22Z
updated_at: 2026-10-04T17:49:34Z
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
- [x] the owner picks where a kind is declared (asked 2026-10-04)
- [x] the registry is computed from declarations across `needs`, and a kind claimed twice is refused
- [x] fhir-harness owns its kinds (fhir-artifact-index, ig-metadata-index, ig-pages, ig-ast), and cat-openapi owns `openapi`
- [x] the generated artefacts (kind table, avatars, UML, glossary) follow the declarations
- [ ] `graph-kind-registry.ts` holds only cat-harness's own kinds

## Not this bean
Mount tools are a sibling bean, and the special-branches table is rva2.

## 2026-10-04: the owner's choice, and steps 1 and 2 (#2082)

**Owner: a `kinds/` graph, one node per kind** (option 1 of 3). Rejected: a GraphKindContribution in contributions.ts, and a `graphKinds` map in `<instance>.json`.

**Step 1 (0134116).**
- `schemas/graph-kind-node.ts` (`folio-graph-kind/v1`): GraphKindDef's fields one for one (a compile-time check keeps them in step), plus `kind`, `avatar` and `rationale`.
- The base layer holds the meta-kind `kinds`, the one kind a reader needs in order to find the rest.
- The registry loads every declared node across the instances on FIRST USE. So a reader that imports only the registry still sees every kind, and importing it touches no filesystem.
- It throws on two files claiming one name, on a name the code also lists, and on a node that does not parse; each error names the files involved.
- Instance discovery moved verbatim into the leaf `schemas/instance-roots.ts`, so the registry needs no cycle.
- `avatars.ts` reads a declared kind's own avatar rather than staying a second table.

**Step 2 (b9d9bca).** The six kinds another harness owns moved out:
- fhir-harness: fhir-artifact-index, ig-metadata-index, ig-pages, ig-ast;
- cat-openapi: openapi;
- folio-assistant-core: uploads, catalogue, review-verdicts.

Their code comments are kept verbatim as `rationale`.

**Found by the move:** a node spelled with `name` equal to its filename stem is exactly how `findDeclarationFile` recognises an instance declaration, so `kinds/` read as four instances. The field is `kind`, and a test pins it.

**Still here, and why.**
- `models`: bootstrap-tools is another repository, so its kinds move there.
- `folio`: core registers it in code at load; next to convert.
- 48 kinds that are cat-harness's own: they stay.
- The kind TABLE in directory-conventions.md is still one hand-kept list that kind:register checks. Generating it from the nodes is the remaining Done-when.

## 2026-10-04: the kind table is generated (owner: prose onto the nodes)

**Owner, option 1 of 3:** each row's prose moves onto its kind, and the table is generated from it. Rejected: generating from `summary` alone (it would lose the prose), and a hand-kept table per harness.

**What changed.**
- New kind fields `description` (what a directory holds), `renderableNote` and `anyLayer` carry what the row said. A declared kind holds them on its node; a listed kind on its entry; `folio` and `glossary` in their own modules.
- `kind:table` writes the table between markers, grouped by owner: bootstrap, harness, core, then each declaring harness. `kind:table:check` is the sixth step of `kind:register`, so the existing gate covers it.

**Measured against the hand-kept table.** All 62 rows' contents and renderable cells are identical. 12 'declared by' cells changed, and each is the REGISTRY's answer replacing a stale hand-written one: skills, processes, scenarios and schemas are bootstrap's; todos, todo-items, library, voices, voice-vendors and todo-feedback are `layer: core`.

Also: of the six per-kind side tables, only KIND_TILE_ICONS keyed a moved kind (`uploads`); it is `tileIcon` on the node now (sod4 #5).
