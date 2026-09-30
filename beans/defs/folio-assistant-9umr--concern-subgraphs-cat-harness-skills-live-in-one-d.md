---
# folio-assistant-9umr
title: 'Concern subgraphs: cat-harness skills live in one declared subgraph per semantic concern (first: KG + library out of folio-core)'
status: in-progress
type: epic
created_at: 2026-09-30T08:12:08Z
updated_at: 2026-09-30T12:47:36Z
parent: folio-assistant-vuip
---

Owner 2026-09-29: 'declared sub-graphs of cat-harness based on semantic concern (see sibling work on bootstrap definitions as named subset). dont need a separate facet. built into location.' Ruled 2026-09-30: **eight groups, KG + library move first**.

A Subgraph is bootstrap's term (cat-harness/schemas/graph.ts): 'a named subset of Node Instances: a Declaration's directory entry, with its id, its directory and its Graph Kinds'. So each concern is a directory entry in cat-harness.json, not a field.

Measured 2026-09-29 (scratchpad skill-taxonomy analysis, 289 skills): SDLC practice 58, process model & execution 16, tools & MCP 6, KG structure/management 30, library/information management 27, content authoring 99, rendering/UI 33, agent conduct 20. folio-core holds 154 of them across all eight; workflow, graph-management, theming, security and crdm are already near single-concern. 87 skills fit two groups — each needs a primary home. `skills/folio-core/` is referenced 2,899 times in 659 files.

Risks already checked: only workflow/gate.ts:75 takes kgRoots()[0]; four skill subgraphs are already declared in cat-harness.json (folio-assistant-core-skills, large-datasets-skills, who-iris-skills, fhir-ig-skills). Skill ids follow location, so every reference to a moved skill is rewritten; moved skills leave kg-qa sidecars as SUBJECT GONE, and deleting those needs the owner's approval (deletion-requires-confirmation).

## Done when
- [ ] The eight subgraphs named and declared (only those that hold files — declare only what exists)
- [ ] KG + library (39 skills) moved out of folio-core; ~668 references in 184 files rewritten; gates green
- [ ] gate.ts no longer assumes kgRoots()[0]
- [ ] Remaining groups moved one cluster per PR

_2026-09-30T12:47:36Z_ — Claimed by claude/charming-curie-n04agq — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
