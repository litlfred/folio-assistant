---
# folio-assistant-f4gj
title: 'MEASURED: fsh-cone is a second route to logic-layer edges, but delivers 0 of 458 as merged — skill''s P3 blocker holds as measurement, is too strong as inference'
status: in-progress
type: feature
priority: high
created_at: 2026-09-23T21:17:32Z
updated_at: 2026-09-23T21:19:50Z
parent: folio-assistant-uhkv
---

## Brief

**The question.** `fhir-harness/skills/fhir-ig-base/ig-publisher-reduction.md` §"P3 is
BLOCKED on more than a fork" infers, from 458 export artefacts carrying no dependency
edges, that **P3 depends on `ig-publisher-fork` delivering the logic-layer edges**.
`cat-harness/content/pipeline/fsh-cone.ts` — merged on `main`, from archived bean `267x` —
builds a dependency graph from IG **source** and already claims `cql include` and
`Library ↔ cql (by name)` edge kinds. Is it a second route that needs no fork?

**Answer: the edges exist in source and need no fork, but `fsh-cone` as merged extracts
none of them.** The skill's *measurement* holds; its *inference* is too strong; the second
route is real but is not a route today.

## What was measured

Read-only `--depth 1` clone of `WorldHealthOrganization/smart-immunizations`
(later deepened to 538 commits for the replay), deleted after. No WHO repository written to.

### 1. `267x`'s graph numbers — re-derived, and they hold exactly

```
nodes: 1059 in 1017 source files (739 .fsh, 279 .cql)   internal edges: 2478
FORWARD cone: zero-dependents 715  median 0  p75 1  p90 6  p99 241  max 278
BACKWARD cone: zero-deps 68  median 3  p75 7  p90 10  p99 55  max 71
```

Identical to `267x`'s quoted **1,059 nodes / 2,478 edges**, median 0, p90 6, p99 241,
max 278.

### 2. The history replay differs — reported as found, not as error

`--history 257`, window 2024-01-19 .. 2025-11-25, 182 of 257 commits touching
`input/fsh` or `input/cql`:

```
mean 99.3 nodes = 9.4 % of the IG per commit   (267x quoted 8.2 %)
median 28  p75 273  p90 280  max 630  of 1059
bimodal, confirmed:  <=10 nodes: 31   <=50: 74   >200: 52
```

**9.4 %, not 8.2 %.** The bimodality `267x` reported is confirmed. The mean is not
re-derived and the 8.2 % figure should not be re-quoted without saying which commit
window produced it.

**After (a) the same replay gives 16.0 %; after (b), 23.5 %.**

| graph | mean rebuild per commit |
|---|---|
| `267x`, quoted | 8.2 % |
| as merged, re-derived | 9.4 % |
| after (a) | 16.0 % |
| **after (b)** | **23.5 %** |

A correct graph made the incremental case *weaker at every step*, which is the honest
result: the optimistic figures were optimistic **because edges were missing**. The total
is nearly **three times** the figure `267x`'s case rested on. An incremental build sized
from any of the first three would **under-rebuild** — the one failure `fsh-cone`'s own
header calls dangerous. Do not quote a rebuild fraction without naming the graph that
produced it. Whether ~24 % per commit still pays for the machinery is an **open question
this measurement does not answer**, and a different question from whether the edges exist.

### 3. The export side — re-derived, and it holds

`smart-immunizations/fhir-artifact-index/index.json`: 748 artefacts, Library 279 +
PlanDefinition 138 + Measure 41 = **458 = 61.2 %**. Field set is
`canonical, category, dak, description, id, key, materialization, name, published,
resourceType, title, version` — **no edge field**, so `kn0t`'s sharpening stands: the
exit criterion is unsatisfiable against this export, not merely hard.

### 4. The measurement that answers the question

The 458 map onto FSH source **1:1, with zero unmatched ids** — 279 `InstanceOf: Library`,
138 `InstanceOf: …/cpg-recommendationdefinition`, 41 `InstanceOf: …/proportion-measure-cqfm`.

`fsh-cone` **as merged on `main`**, per resource type:

| type | n | ≥1 out-dep | ≥1 dependent | mean out-degree | **distinct targets reached** |
|---|---|---|---|---|---|
| Library | 279 | 278 (99.6 %) | 0 (0.0 %) | **1.00** | **1** |
| PlanDefinition | 138 | 138 (100 %) | 126 (91.3 %) | 2.50 | **4** |
| Measure | 41 | 41 (100 %) | 0 (0.0 %) | 1.02 | **3** |
| **total** | **458** | **457 (99.8 %)** | 126 (27.5 %) | | **8** |

**The 99.8 % is an artefact of counting boilerplate.** All 458 logic artefacts together
reach **8 distinct dependency targets, every one of them a shared `RuleSet`**
(`LogicLibrary`, `PlanDefMain`, `PlanDefCommunicationRequestAction`, `PlanDefMRAction`,
`PlanDefMRUpdate`, `MeasureProportion`, `MeasureProportionBasic`, `Stratifier`). There are
**zero logic→logic edges** and **zero Library→CQL edges** (0 of 279). Every Library's
single edge is to the same node, so the graph cannot distinguish any Library from any
other. Both staleness directions are wrong: a change to `IMMZD18SBCGLogic.cql` marks
**nothing** stale, and a change to `LogicLibrary.fsh` marks **all 279** stale.

Breaking down by resource type mattered: the aggregate hid that Library's out-degree is
exactly 1.00 and PlanDefinition's dependent count (91.3 %) is dependents *of the RuleSets*,
not of any logic artefact.

### 5. Ground truth: the edges ARE in the source

Expanding FSH `RuleSet` parameters — what SUSHI does — and re-extracting:

| type | n | ≥1 real logic→logic edge | distinct logic targets |
|---|---|---|---|
| Library | 279 | **279 (100 %)** | 279 |
| PlanDefinition | 138 | **138 (100 %)** | 138 |
| Measure | 41 | **41 (100 %)** | 41 |
| **total** | **458** | **458 (100 %)** | **458** |

So the logic-layer edges exist in the IG source, at full per-artefact resolution, with no
fork. `fsh-cone` misses all of them for **two named, separable reasons**:

**(a) A one-line defect — FIXED in this PR, on the owner's explicit instruction.**
`fsh-cone.ts:220` guarded
`if (node.kind === "Instance" && node.id && cqlByName.has(node.id))`. **All 279** Library
instances omit `Id:` and rely on SUSHI's name→id default; **all 279** names match a CQL
library name. So `node.id` was `undefined`, the guard short-circuited, and the documented
`Library ↔ cql (by name)` edge kind fired **0 times** — absent from the edge-kind table
entirely. The fix is `node.id ?? node.name`.

Its own test suite stayed green throughout, because the fixture declared `Id: LibX`
explicitly — it tested the shape that works and never the shape that exists in the wild.
A second fixture Library with no `Id:` is added as the regression guard.

**Re-measured on smart-immunizations after the fix:**

| | before | after |
|---|---|---|
| distinct targets, all 458 | 8 | **287** |
| logic→logic edges | 0 | **279** |
| internal edges | 2,478 | **2,757** |
| nodes with no dependent | 715 | **536** |
| backward-cone median | 3 | **8** |
| largest forward cone | 278 | **551** |
| `Library ↔ cql (by name)` | absent | **279** |

**(a) closed the Library third: 279 of 458. (b) closed the rest.** Combined, measured at
each step:

| | as merged | after (a) | after (b) |
|---|---|---|---|
| logic→logic edges, of 458 | **0** | 279 | **458** |
| distinct targets, all 458 | 8 | 287 | **469** |
| internal edges | 2,478 | 2,757 | **3,329** |
| nodes with no dependent | 715 | 536 | **354** |
| backward-cone median | 3 | 8 | **11** |
| largest forward cone | 278 | 551 | **856** |

Extraction now reaches **every** logic target an independent RuleSet-substituting read of
the source names, verified per resource type. One caution recorded for the next reader:
comparing the two key spaces raw reports a **false** gap for all 279 Libraries, because
ground truth names a target `IMMZAgeConcepts` while the graph keys it `cql:IMMZAgeConcepts`.
The test normalises, and says why.

**(b) Real work, not a bug — ALSO FIXED, on the owner's "Go".** PlanDefinition and Measure write their library edge *inside a
parameterised RuleSet*: `* library = Canonical({library}Logic)` in `PlanDefMain(library,
version)`, and `* library = "…/Library/{library}Logic"` in `MeasureProportionBasic`,
reached through a second level via `MeasureProportion`. `fsh-cone` reads RuleSet bodies
literally, so the token is `{library}Logic` and resolves to nothing; the edge is attributed
to the RuleSet. Recovering it requires performing SUSHI's RuleSet parameter substitution.

## Assessment against P3's staleness contract

> An AST is a CACHE, never an authority. Anything rendered from one declares, in the
> artefact a reader sees, that its indices, dependency edges and versions are unverified
> until a full run.

**As merged on `main`: not sufficient, and not partially sufficient.** On the measurement
that matters, `fsh-cone` scores 0 logic→logic edges out of 458. There is nothing to mark
stale.

**With (a) and (b): sufficient for *which artefact* is stale, and still not sufficient for
*what a reader is told*.** Four things a source-derived edge cannot carry, each measured
here rather than asserted:

1. **Version pinning.** The export index carries `"version"` per artefact. A source edge
   does not: `resolveRef` strips `|version` (`.split("|")[0]`), and `PlanDefMain` takes
   `version` as a *separate* parameter from `library`, so the two are never associated. A
   source graph cannot distinguish a dependency on `X|1.0.0` from `X|2.0.0` — and versions
   are named in the contract as a thing the reader must be told is unverified.
2. **Cross-package references.** `fsh-cone` drops them by design. The cost is measurable:
   `InstanceOf` contributed **3** edges across the whole IG, because 179 of the 458 logic
   artefacts are `InstanceOf:` a URL into `hl7.fhir.uv.cpg` / `hl7.fhir.us.cqfmeasures`.
   Those profile dependencies are invisible to the graph. This is the
   dependency-closure-with-version-pinning item the skill already lists as irreducible.
3. **Post-SUSHI expansion.** (b) is exactly this. It can be *approximated* — the
   ground-truth table above is such an approximation — but an approximation of SUSHI's
   semantics is a reimplementation, and nested inserts, soft-indexing and `{param}`
   interpolation inside strings each make a silently wrong edge possible. A silently wrong
   staleness edge is what the contract forbids most specifically: a page that serves stale
   dependencies looks exactly like one that does not.
4. **Rendering-time coupling.** `fsh-cone`'s own header says it does not see it and that a
   cone is a **lower bound**, never proof nothing else changed.

**Precisely which part is partial:** source edges can answer *"which artefacts must be
re-derived"* at full per-artefact resolution, for free, today-ish. They cannot answer
*"with which versions, against which package closure"* — and P3's visible stale mark has to
cover **indices, dependency edges AND versions**. So the second route can supply the
**edge** third of the mark and the rebuild set behind it; it cannot supply the **version**
third at all, and the **index** third only as a lower bound.

## What this means for the skill's claim — PROPOSED, not applied

- *"nothing in the Publisher's current exports carries dependencies among Libraries,
  PlanDefinitions or Measures — 458 artefacts, 61 %"* — **re-derived, holds exactly.**
- *"So P3 depends on `ig-publisher-fork` delivering the logic-layer edges"* — **too strong
  as stated.** The edges exist in IG source at full resolution and are extractable without
  a fork (458/458 measured). What the fork uniquely delivers is **resolved, version-pinned,
  cross-package** edges — not the *existence* of logic-layer edges.
- But `fsh-cone` **today** delivers none of them, so nothing here unblocks P3 now. It is a
  second route **after (a) and (b)**, and even then only for part of the mark.

A skill edit is **proposed in the PR, not merged.** The skill is authoritative and changing
it is the owner's call. **No phase is approved, re-worded or re-scoped here** — P0–P4
approval remains outstanding with the owner.

## Reproduction

`cat-harness/scripts/measure-logic-layer-edges.ts` in this branch; `--help` for usage.
It takes an IG root and the artefact index and prints every table above.

## Todo

- [x] Re-derive `267x`'s node/edge counts and cone distribution
- [x] Re-derive the export-side 458 / 61.2 % and the absent edge field
- [x] Measure logic-layer edge coverage from `fsh-cone`, broken down by resource type
- [x] Establish ground truth by expanding RuleSet parameters
- [x] Name what a source edge cannot carry that a resolved AST edge could
- [x] Land the measurement script + propose the skill edit in a PR
- [x] Owner decision: take the proposed skill edit; fix the `fsh-cone` defect in this PR
- [x] Fix (a) `node.id ?? node.name`, add the no-`Id:` regression fixture, re-measure
- [x] (b) RuleSet parameter substitution in `buildFshGraph`, tagged `insert (parameter expanded)`
- [x] Re-measure after (b): 458/458 logic edges; extraction reaches every target ground truth names
- [x] Record that (b)'s fix is itself a partial reimplementation of SUSHI, and what it does not do
- [ ] Open: does ~24 % rebuild per commit still pay for an incremental build? NOT answered here
- [ ] Owner review and merge — NOT mine to merge
