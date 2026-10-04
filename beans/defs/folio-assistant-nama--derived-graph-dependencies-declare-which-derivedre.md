---
# folio-assistant-nama
title: 'DERIVED-GRAPH DEPENDENCIES: declare which derived/rendered subgraph is computed from which (fhir-ast -> ig-docs -> gh-pages; lean-cache), and walk them'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-04T13:49:44Z
updated_at: 2026-10-04T13:54:32Z
parent: folio-assistant-fs43
---

Owner, 2026-10-04: *"bean up missing dependency logic on derived graphs (e.g. ig-docs, gh-pages, lean-cache, fhir-ast). may need to walk dependencies between derived content (e.g. fhir-ast is dependency of ig-docs). not sure graph schema has that yet... these are rendered sub-graphs. so we can use order that subgraphs declared as rendering order for now maybe"*

## What exists (measured 2026-10-04)
- A directory declaration (`ContentDirectorySchema`) says WHAT a directory holds (`graphKinds`, layer `derived`) and WHERE it is stored (`storage: {branch, keyedBy}`). It never says what it is DERIVED FROM. There is no `derivedFrom`, `dependsOn` or `rendersTo` edge between directories.
- The only declared derivation edge is per document-kind SECTION (`computedFrom`, bean qvxh), checked by check:document-kind-sources.
- fhir-ast (the IG AST cache; ig-ast.ts, stage-ast-sites.ts) is not declared as a directory in fhir-harness.json at all. lean-cache and gh-pages exist only as workflows (lake-cache-refresh.yml, docs-site.yml) and special branches (special-branches.json), not as declared graphs.
- So regen, the main publish workflow and the staging cone cannot know that a change to fhir-ast invalidates ig-docs, or that ig-docs feeds gh-pages.

## Interim (owner)
Use the ORDER in which subgraphs are declared as the rendering order. That is cheap and visible, but it is an assumption and not a checked edge: a dependency declared after its consumer renders stale silently.

## Done when
- [x] the schema carries an edge between directories: a derived/rendered subgraph names the graphs it is computed FROM, by directory id, resolvable across `needs` the way computedFrom is checked
- [ ] fhir-ast, ig-docs, gh-pages and lean-cache are declared as graphs with those edges (fhir-ast -> ig-docs -> gh-pages)
- [x] a gate refuses an edge naming an undeclared id, and a cycle
- [x] the rendering order is DERIVED from the edges (topological). Until then, declaration order is used, and a check flags a consumer declared before its source
- [ ] consumers walk it: regen, the main publish workflow (lbz8) and the staging cone (sibling bean)

## 2026-10-04: design note, for the owner's review
`cat-harness/docs/proposals/derived-graph-dependencies-2026-10-04.md` proposes:
- one edge, `derivedFrom`, on the DERIVED directory, resolved across `needs` like `computedFrom`;
- declaring the missing nodes;
- a topological order, with declaration order as the interim rule and a check for a consumer declared before its source;
- a gate, `check:derived-from`.

It asks three decisions: the edge's direction, re-layering the IG pages and artefact index as derived, and strict versus ratchet for the chrome-across-a-missing-needs case. The node schemas are child bean lehh.

## Owner rulings, 2026-10-04 (all three, option 1 each)
1. The edge is `derivedFrom`, on the derived graph.
2. The IG pages and the artefact index are re-layered as `derived`.
3. An edge across a missing `needs` path (the chrome case) is a ratchet: a baselined layering gap, where new gaps fail and cleared ones shrink the baseline.

Next: the schema change (`derivedFrom` on ContentDirectorySchema, using computedFrom's resolver), then check:derived-from with its baseline, then the declarations and re-layering. The node schemas are bean lehh.
