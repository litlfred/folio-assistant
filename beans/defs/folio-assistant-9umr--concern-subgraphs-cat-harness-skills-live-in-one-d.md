---
# folio-assistant-9umr
title: 'Concern subgraphs: cat-harness skills live in one declared subgraph per semantic concern (first: KG + library out of folio-core)'
status: in-progress
type: epic
priority: normal
created_at: 2026-09-30T08:12:08Z
updated_at: 2026-10-01T09:00:24Z
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

## Owner ruling 2026-09-30: option A

A topic directory HOLDS packages: skills/<topic>/<package>/ (e.g. skills/kg/graph-management/). skills/skills.json labels the topic level; package names, which skill_fetch takes, do not change; discovery descends only into topics skills.json declares.

Step 1 landed in #1594: discovery is in scripts/skill-packages.ts, gate.ts no longer assumes kgRoots()[0], and skill_fetch serves a moved skill from its one holder.

Next, the mechanism: one helper, packageDirsIn(kgDir), replacing the six one-level walks — skill-packages.ts:156, known-skills.ts:395, kg-export.ts:1236, gen-skill-docs.ts:583, validate-skills.ts:112, skill-register.ts:271 — plus skill-coverage.test.ts's p[1].


*2026-10-01* — Step 8 merged in #1729: skills/sdlc/ holds crdm, spec-kit and a new sdlc-core package with the 46 SDLC skills from folio-core. folio-core now holds six: the tool surface (mcp-assembly, mcp-contract, mcp-projection, skills-and-tools, covered-is-not-reachable), waiting on w2gr, and upload-routes, which the classification could not place. Three more flat walks found and fixed on the way: registry.test, skill-manifest-coverage.test (#1689) and front-matter.test (#1729); skill_fetch's package_name list is now built from discovery.


*2026-10-01* — Placement PR2–PR9 are tracked as children of the separation epic `folio-assistant-iirv` (PR2 `pzwb`, PR3 `63wl`, PR4 `4fv8`, PR5 `tlat`, PR6 `apcg`, PR7 `8fq9`, PR8 `f8wp`, PR9 `p9bu`), because owner ruling D4 (2026-10-01, option 3) interleaves them with the cat-harness / cat-harness-tools split stages into one ordered sequence. PR0 (`ejye`) and PR1 (`ybwt`) stay under this epic on their branches; stage 0 (`pyds`) and PR2/PR3 wait on them.


## Owner ruling 2026-10-01 (separation arc 7x5n): MCP is its own subgraph inside the tools concern
Target: `cat-harness/skills/tools/mcp/`, declared as its own subgraph. MCP skills (mcp-assembly, mcp-contract, mcp-projection) move there. General tool skills (skills-and-tools, covered-is-not-reachable) move to `cat-harness/skills/tools/`. Tool definitions stay in cat-harness/tools/ (JSON, D2). Implementations go to cat-harness-tools; server parts needing core go to core (C1). The MCP spec library entry follows agent-skills into the cat-harness library.
- [ ] skills/tools/ and skills/tools/mcp/ declared and populated (finale)


## Refined 2026-10-01: two MCP subgraphs, split by layer
cat-harness/skills/tools/mcp/ (generic skill<->tool mapping, contract, projection, assembly) and folio-assistant-core/skills/tools/mcp/ (folio-specific MCP surfaces). The 5 MCP/tool skills read as generic -> cat-harness; folio-specific implementations and the folio half of the tool registry -> core.
- [ ] folio-assistant-core/skills/tools/mcp/ declared and populated
