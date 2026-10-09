---
# folio-assistant-r5wu
title: 'SUBGRAPH NODE PATTERN, follow-up: convert the other publishers of a declared subgraph''s contents to the declared Subgraph node + inSubgraph'
status: completed
type: task
priority: normal
created_at: 2026-10-03T08:58:19Z
updated_at: 2026-10-09T15:47:00Z
parent: folio-assistant-fs43
---

Follow-up to bean l4ay (PR #1960), which built the pattern (scripts/subgraph-node.ts: subgraphContainer, memberOf, subgraphPublicationFindings; declaredSubgraphNode in kg-export.ts) and applied it to todos.jsonld only. Owner ruling 2026-10-03: "todos = subgraph node + todo content nodes", "and make pattern for declared repo branches (and declared dir subgraphs)".

Audit (2026-10-03) of generators that mint their OWN container for a declared directory's contents, or publish members with no edge to the declared Subgraph node:

## Todo
- [x] fsh-guts-export.ts — container `@type FshGutsGraph` at its own doc IRI (fsh-guts.jsonld) beside the declared `fsh-guts` Subgraph; nodes carry no inSubgraph. Convert: container = declared Subgraph, members inSubgraph.
- [x] schemas/role-graph.ts toJsonLd — `RoleGraph` container for the roles registry (scenarios/). Decide: is roles.json a declared subgraph's contents (then convert) or a single node. (Decided & documented on toJsonLd: roles.json is an internal authoring registry for BPMN swimlanes projected directly into the instance KG export, not published as an independent JSON-LD document).
- [x] glossary-export.ts — `skos:ConceptScheme` for swimlane-glossary. A ConceptScheme is a real SKOS concept, not a parallel collection: keep it, but link it to the declared Subgraph (dcterms:isPartOf / dcterms:source) rather than standing in for it. Decide which. (Decided & implemented: skos:ConceptScheme carries dcterms:isPartOf pointing to the declared swimlane-glossary Subgraph).
- [x] content/pipeline/gen-library-jsonld.ts — one SourceDocument manifest per library entry; no container, and members carry no inSubgraph to the declared `library` Subgraph. (Added inSubgraph pointing to the declared library Subgraph on manifest.jsonld for all ingest rungs: paged, tabular, referenced).
- [x] content/pipeline/gen-site-jsonld.ts — site pages/nodes (docs subgraph): page `contains` is document structure (keep), but pages carry no inSubgraph to their declared subgraph. (Added inSubgraph pointing to declared docs Subgraph on site page documents).
- [x] beans (assets/beans/index.json) and qa (assets/qa/index.json) — plain JSON indexes, not JSON-LD; when either is published as JSON-LD it must follow the pattern from the start. (Documented in PUBLISHED taxonomy).
- [x] Each converted publisher adds its row to PUBLISHED in cat-harness/scripts/tests/subgraph-node.test.ts.

## Done when
Every publisher above either follows the pattern (its row in subgraph-node.test.ts passes) or carries a recorded reason it is not a subgraph's contents.

## Closure Note
- Implemented in worktree branch `claude/r5wu-subgraph-node-publishers` at commit `5dbddae82a8ae2259eedafc622c2196f247227b7`.
- Verified with comprehensive test runs:
  - `bun test scripts/tests/subgraph-node.test.ts` (16 tests pass)
  - `bun test scripts/tests/fsh-guts-export.test.ts` (21 tests pass)
  - `bun test scripts/tests/glossary-export.test.ts` (27 tests pass)
  - `bun test scripts/tests/gen-library-jsonld.test.ts` (48 tests pass)
  - `bun test scripts/tests/todo-graph.test.ts` (21 tests pass)
  - Total: 133 pass, 0 fail.
  - `bun run typecheck` (tsc --noEmit): passes clean with 0 errors.
  - Staleness gates: `glossary-export.ts --check`, `gen-jsonld-context.ts --check`, and `gen-site-jsonld.ts --check` all pass clean.
