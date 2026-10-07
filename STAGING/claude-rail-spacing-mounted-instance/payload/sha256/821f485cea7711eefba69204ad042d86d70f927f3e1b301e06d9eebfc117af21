---
# folio-assistant-r5wu
title: 'SUBGRAPH NODE PATTERN, follow-up: convert the other publishers of a declared subgraph''s contents to the declared Subgraph node + inSubgraph'
status: todo
type: task
priority: normal
created_at: 2026-10-03T08:58:19Z
updated_at: 2026-10-03T10:06:52Z
parent: folio-assistant-fs43
---

Follow-up to bean l4ay (PR #1960), which built the pattern (scripts/subgraph-node.ts: subgraphContainer, memberOf, subgraphPublicationFindings; declaredSubgraphNode in kg-export.ts) and applied it to todos.jsonld only. Owner ruling 2026-10-03: "todos = subgraph node + todo content nodes", "and make pattern for declared repo branches (and declared dir subgraphs)".

Audit (2026-10-03) of generators that mint their OWN container for a declared directory's contents, or publish members with no edge to the declared Subgraph node:

## Todo
- [ ] fsh-guts-export.ts — container `@type FshGutsGraph` at its own doc IRI (fsh-guts.jsonld) beside the declared `fsh-guts` Subgraph; nodes carry no inSubgraph. Convert: container = declared Subgraph, members inSubgraph.
- [ ] schemas/role-graph.ts toJsonLd — `RoleGraph` container for the roles registry (scenarios/). Decide: is roles.json a declared subgraph's contents (then convert) or a single node.
- [ ] glossary-export.ts — `skos:ConceptScheme` for swimlane-glossary. A ConceptScheme is a real SKOS concept, not a parallel collection: keep it, but link it to the declared Subgraph (dcterms:isPartOf / dcterms:source) rather than standing in for it. Decide which.
- [ ] content/pipeline/gen-library-jsonld.ts — one SourceDocument manifest per library entry; no container, and members carry no inSubgraph to the declared `library` Subgraph.
- [ ] content/pipeline/gen-site-jsonld.ts — site pages/nodes (docs subgraph): page `contains` is document structure (keep), but pages carry no inSubgraph to their declared subgraph.
- [ ] beans (assets/beans/index.json) and qa (assets/qa/index.json) — plain JSON indexes, not JSON-LD; when either is published as JSON-LD it must follow the pattern from the start.
- [ ] Each converted publisher adds its row to PUBLISHED in cat-harness/scripts/tests/subgraph-node.test.ts.

## Done when
Every publisher above either follows the pattern (its row in subgraph-node.test.ts passes) or carries a recorded reason it is not a subgraph's contents.
