---
# folio-assistant-a9tx
title: 'IG PUBLISHER FORK: requirements for an agent working a local experimental fork, and what the AST must carry'
status: todo
type: feature
priority: normal
created_at: 2026-09-22T19:07:23Z
updated_at: 2026-09-30T15:00:00Z
parent: folio-assistant-uhkv
---

Requirements for an agent working a **local experimental fork** of the IG
Publisher, and what the AST it emits must carry.

Scope this round: **requirements only, no Java.**

## Why a fork rather than an upstream ask alone

Measured, from `nsbb`, using the Publisher's current metadata exports as an AST
proxy across two real IGs:

| export | smart-trust | smart-immunizations |
|---|---|---|
| `valueset-ref-list.json` VS→CS edges | 17 over 14 | 431 over 252 |
| `codesystem-ref-list.json` `uses` populated | 0 of 15 | 0 of 14 |
| `usage-stats.json` extension→path | 6 | 35 (+5 profiles) |

Two findings, and the second is the case for the fork:

1. `uses` is **declared and never populated**, in both IGs.
2. **Nothing exports dependencies among Libraries, PlanDefinitions or
   Measures** — 458 artefacts, 61% of smart-immunizations, the CQL and
   decision-logic core, with no dependency edges at all.

So the proxy reaches TERMINOLOGY dependencies and **structurally cannot reach
the logic layer**. Re-derive these before quoting them.

## What the AST must carry, as acceptance criteria

- [ ] per-resource structured dump, keyed by canonical URL and version
- [ ] **dependency edges among Library / PlanDefinition / Measure** — the gap above
- [ ] page-fragment provenance: which source produced which output fragment
- [ ] the resolved dependency closure with pinned versions
- [ ] terminology expansion provenance — which server, which version
- [ ] a `toolchain` object: publisher version, core version, SUSHI version
- [ ] emitted behind a flag; default behaviour byte-identical without it

## Which repositories

`HL7/fhir-ig-publisher` is orchestration; `hapifhir/org.hl7.fhir.core` holds
the renderer and validator. **The logic-layer edges live in core**, so a
publisher-only fork cannot satisfy criterion 2. Both are git-reachable from
this environment.

## Constraints on the agent
- Upstreamable shape: a flag, not a rewrite. A fork that cannot be offered back
  becomes a maintenance burden with no exit.
- The AST is a CACHE, never an authority: indices, dependencies and versions
  are invalid until a full run. Anything reading it says so.

## Done when
- [ ] the requirements above are approved by the owner
- [ ] a brief exists an agent can start from without this bean's context



## Claim released 2026-09-29

Released `in-progress` → `todo` on the owner's instruction (review session https://claude.ai/code/session_014Qj8wncQhqV52QGN1yZDnj). No git change to this bean since before 2026-09-26, no holder recorded, and no open branch touches it; the sessions that held theme D (content folios, SMART/FHIR stack, ingest) work stopped on the 2026-09-25 weekly usage limit. Nothing in the body was changed: re-claim with `bun run beans:claim <id>`.


## Read of the fork, 2026-09-30 — and a correction to §"Which repositories"

Read-only clone of `litlfred/fhir-ig-publisher` at `e382dc3` (a plain mirror
of upstream, no local changes). Session
https://claude.ai/code/session_015v8WoYtr8gHuz9Tadg7KjV.

**Correction.** §"Which repositories" says *"the logic-layer edges live in
core, so a publisher-only fork cannot satisfy criterion 2"*. Read against the
code, that is wrong: `DependencyAnalyser` is in the **publisher**
(`org.hl7.fhir.publisher.core/.../igtools/publisher/DependencyAnalyser.java`).
Only criterion 3 (page-fragment provenance) needs `org.hl7.fhir.core`.

What already exists, all in the publisher:

- `fileList` → `FetchedResource` holds every loaded resource as both `Resource`
  and `Element` — the AST, in memory.
- `DependencyAnalyser` emits `(source, kind, target)` for terminology and
  conformance resources, consumed only by `DependencyRenderer` (HTML).
  `analysePD` and `analyseAD` are **empty stubs**; Library and Measure are not
  dispatched at all. That is the criterion-2 gap, exactly.
- `CqlSubSystem` computes CQL `depends-on` related artifacts, and
  `AdjunctFileLoader.java:311` attaches them to each Library — so
  Library→Library edges already exist on the resource; nothing exports them.
- Existing exports: `qa.json`, `usage-stats.json`, `expansions.json`,
  `canonicals.json` — none carries an edge.

| # | criterion | change | size |
|---|---|---|---|
| 7 | flag, byte-identical default | CLI flag (e.g. `-ast-export`), no-op when absent; diff a normal build before/after | S |
| 1 | per-resource dump by `canonical\|version` | `AstExporter` in `Publisher.execute()` after `validate()`, before `generate()`; walks `fileList`, writes `output/ast/` | S |
| 2 | Library / PlanDefinition / Measure edges | fill `analysePD` (`library`, `action.definitionCanonical`, `relatedArtifact`) and `analyseAD`; add Library and Measure; keep `\|version` on edges; export `dependencyList` | M |
| 6 | toolchain object | publisher + core version from the build; SUSHI version | S |
| 4 | pinned dependency closure | packages already resolved at load (`dependencyList`, ~`Publisher.java:11074`); export it | M |
| 5 | tx expansion provenance | tie `expansions.json` to server + version (`processTxLog`) | M |
| 3 | page-fragment provenance | across publisher and core renderers | L |

Work plan, each step small and upstreamable:

- [ ] **W1** criteria 7, 1, 6 — flag, `AstExporter`, per-resource dump, toolchain, byte-identical check
- [ ] **W2** criterion 2 — measure on smart-immunizations: 458 of 458, cross-checked against `fsh-cone`'s source count
- [ ] **W3** criteria 4, 5
- [ ] **W4** criterion 3 — scoped separately; the only step needing the core fork

Not started: this session has read access only, and Maven/JDK availability is
unchecked. The owner chose to record the plan first (2026-09-30).
