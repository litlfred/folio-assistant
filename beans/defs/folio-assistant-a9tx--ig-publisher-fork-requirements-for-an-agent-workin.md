---
# folio-assistant-a9tx
title: 'IG PUBLISHER FORK: requirements for an agent working a local experimental fork, and what the AST must carry'
status: todo
type: feature
priority: normal
created_at: 2026-09-22T19:07:23Z
updated_at: 2026-09-22T19:24:34Z
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
