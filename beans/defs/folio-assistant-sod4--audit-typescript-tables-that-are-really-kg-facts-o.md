---
# folio-assistant-sod4
title: 'AUDIT: TypeScript tables that are really KG facts owned by one harness — ranked, with where each belongs (owner asked 2026-10-04)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-04T17:33:33Z
updated_at: 2026-10-04T17:41:44Z
parent: folio-assistant-dmx1
---

Owner, 2026-10-04: *"dispatch agent: other stuff in typescript that should be in KG?"* This is the read-only audit that answered it. The principle comes from the same day's ruling, *"there should not be a central registry for declaring mount tools and subgraph types"*: a fact OWNED by one harness is declared there as a KG node, not hardcoded in a cat-harness table.

**How it was measured.** `grep` and `awk` over cat-harness, fhir-harness, folio-assistant-core, folio-assistant-sci and cat-openapi. Entry counts come from counting keys or `id:` lines; importer counts come from `grep -rl` on the module path.

## Ranked findings
| # | where | holds | real owner | importers | recommendation |
|---|---|---|---|---|---|
| 1 | `schemas/block-kinds.ts:42` BLOCK_KINDS plus parallel per-kind tables (`constraints.ts:83` LABEL_PREFIXES, `jsonld.ts:193,331`, `translation.ts:398` KIND_HEADINGS in 6 locales, `block-kinds.ts:264,341`, `block-qa.ts:233`) | 16 paper block kinds across ~7 tables | the `paper` adapter (folio-assistant-core). `dak` was already contributed out (bean 1335) | 20/27/19/12/42 | one node per block kind in folio-assistant-core: one node replaces 7 tables kept in step by hand. Biggest win |
| 2 | `content/pipeline/qa-criteria-registry.ts:2525` | 103 criteria; folio-specific Q_USAGE 7, WALL 4, FRAMEWORK 1, DETANGLER_ARCHIMEDEAN_WALL; DAK 5 | the folio (math) and smart-base (DAK) | 26 | move the opt-in groups and DAK to their owners as criterion nodes; keep the generic groups and `folioOptionalAxes()` |
| 3 | `content/pipeline/_folio-chapter-profiles.qou.ts` | 39 entries | the qou folio (its own header says 'FOLIO CONTENT, quarantined pending migration') | via chapter-profile DI | move to qou as data |
| 4 | `schemas/avatars.ts:66` AVATARS | 58: 6 instances and ~52 kinds | each owner | 17 | finish dmx1: kind avatars on kinds/ nodes, instance avatars in each `<instance>.json` |
| 5 | per-kind side tables: `cat-harness.ts` UNPUBLISHED_GRAPH_KINDS (1), SKILL_BEARING_GRAPH_KINDS (2), KG_CONTENT_GRAPH_KINDS (4); `graph-tiles.ts` KIND_TILE_ICONS (7); `kg-subscribe.ts` HARNESS_GRAPH_KINDS (3); `kg-node.ts` REGISTRY_GROUPS (5) | ~22 rows | each kind's owner | many | fields on folio-graph-kind/v1 (`published`, `skillBearing`, `tileIcon`, `nodeClass`); otherwise kinds move out and these stay central |
| 6 | `partition/instance-rules.ts` REPOS, ALLOWED, RULES | 6 repos, 6-row dependency graph, ~497 path literals | ALLOWED duplicates the instances' `needs`; path claims are per instance | 4 | derive ALLOWED from the declarations; the path claims go to each instance |
| 7 | `check-reference-direction.ts:431` PENDING | 48 rows | mixed | 1 | a backlog, not a registry; a per-instance baseline later |
| 8 | `instance-exports.ts:61` PUBLISHED_ELSEWHERE | 3 instances | each | 1 | a `publisher` field on each declaration |
| 9 | `check-avatar-instances.ts:93` EXEMPT | smart-trust | smart-trust | 1 | a flag in smart-trust's declaration |
| 10 | `gates.ts` STEP_EXEMPTIONS (68), SCRIPT_EXEMPTIONS (37) | 3 rows are fhir-harness's | mostly cat-harness | script | move only the fhir rows |
| 11 | `folio-assistant-core/adapters/document/tools/audit.ts:49` AUDITS | 14 tool declarations in TS | core, but tools are nodes | local | check for duplicates of tools/ nodes and convert |
| 12 | special-branches.json | 9 readers | — | 9 | bean rva2 (TypeScript readers moved off it 2026-10-04) |

**Also:** `merge-train.ts:249-255` runs `smart-base:smart-kg-l1:check` and `smart-base/scripts/extract-smart-kg-l1.ts` directly, a WHO fact hardcoded in base-layer code. It should be a hook smart-base declares.

**The line (keep as code).** ~120 `as const` state, severity and status enums of the platform's own schemas; TOOL_TYPES; PROPERTY_SKILLS and NS_PREFIXES; TASK_IO (187 rows, nearly all cat-harness's own); KG_CRITERIA (77, applying to every instance); DEFAULT_DIRECTORIES (the documented fallback). Tables already inside the harness that owns them (26 measured) break no rule. **The rule of thumb:** keep a table that lists the platform's own states or types, or that every instance reads alike; move one whose keys are another harness's kinds, instances, chapters or adapters.

**Open for the owner:** contributions are still made in TypeScript (`*/contributions.ts`) rather than as JSON nodes. Is that consistent with the ruling?

## Done when
- [x] the owner picks which findings to take, and in what order

## 2026-10-04: the owner's order

**Owner: block kinds first** (option 1 of 4). After rva2 and dmx1 finish, the paper adapter's 16 block kinds become one node per kind in folio-assistant-core, replacing the ~7 parallel tables, as dak was already moved out. Rejected as next: the kind side tables (they stay part of dmx1's remaining work), the qou chapter profiles (a math repo: ask before any PR there), and leaving the audit as backlog.

## 2026-10-04: the owner's resolution: sod4 stays the UMBRELLA

The owner chose to keep sod4 open as the parent, with one row per finding, ticked as each moves (option 2 of 3; rejected: split it and close it, or close it with no beans). The order: block kinds first.

The open question is answered: **every contribution is a node, and validators are KG nodes too**. That work is bean folio-assistant-riit, and #1 (block kinds) lands inside it.

## Findings
- [ ] #1 paper block kinds as nodes: DISCOVERED from core (9 document kinds) and sci (7 math kinds), owner 2026-10-04 "2. Owners now"; the data tables are gone (riit step 2a). Left: non-English headings into the translation graph (2b)
- [ ] #2 folio-specific and DAK QA criteria to their owners as criterion nodes
- [ ] #3 qou's 39-entry chapter profiles to the qou folio as data (math repo: ask before any PR)
- [ ] #4 avatars on the owning nodes: kind avatars done for moved kinds (dmx1); instance avatars into each `<instance>.json`
- [x] #5 the per-kind side tables become fields on folio-graph-kind/v1 (dmx1). MEASURED 2026-10-04: of the six, only `KIND_TILE_ICONS` keyed a kind another harness owns (`uploads`, now folio-assistant-core's); it became `tileIcon` on the node. The other five (UNPUBLISHED, SKILL_BEARING, KG_CONTENT, HARNESS_GRAPH_KINDS, REGISTRY_GROUPS) key only cat-harness's own kinds and classes, so they are local facts and stay
- [ ] #6 partition ALLOWED derived from declared `needs`; path claims per instance
- [ ] #7 check-reference-direction PENDING becomes a per-instance baseline (backlog)
- [ ] #8 PUBLISHED_ELSEWHERE becomes a `publisher` field per declaration
- [ ] #9 check-avatar-instances EXEMPT becomes a flag in smart-trust's declaration
- [ ] #10 gates.ts: the three fhir-harness exemption rows move to fhir-harness
- [ ] #11 core's AUDITS tool table: check for duplicates of tools/ nodes, and convert
- [ ] #12 special-branches.json retired (rva2; the TypeScript readers are done)
- [ ] merge-train.ts's hard-coded smart-base L1 check becomes a hook smart-base declares
