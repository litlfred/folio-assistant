---
title: Cross-graph lsi:near — design draft (ec2a step 3)
parent: Proposals
---

# Cross-graph `lsi:near`: design draft

This is step 3 of work item `ec2a`, under epic `zzmr`. Steps 1 and 2 are merged:
folio-assistant-core#66 (`scripts/lsi-blocks.ts`) and folio-assistant-sci#18
(`scripts/lsi-lean-decls.ts`).

**Owner decision, 2026-10-24: option A, one list per graph.** The joint index
(B) is not planned. It comes back only if the owner asks for it after A is in
use. Questions 2 to 4 below take their recommended answers. Nothing is built
yet.

## What step 3 is for

The owner's ruling of 2026-10-10 was *blocks first*: the block indexer in
core, then a `lean-decl` kind in sci, then a cross-graph `lsi:near`. The need
behind it is qou's 141 duplicate work item groups. Most of them are one Lean
declaration filed twice. Before `beans create`, `lsi:near "<title>"` should be
able to say *this is about block Y* or *this is about declaration Z*. Today it
can say only *this is near work item B*.

## What exists

| piece | where | what it gives step 3 |
|---|---|---|
| engine | cat-harness-tools `pipeline/lsi.ts` | `buildLsi`, `foldIn`, `rank`, `crossGroupLinks`, `LINK_FLOOR = 0.5` |
| `lsi:near` today | cat-harness-tools `scripts/lsi-epics.ts --near` | work items only; `NEAR_READ = 0.7` |
| block units | core `scripts/lsi-blocks.ts` | 4,549 blocks from 6 libraries, keyed by `@id`, built in about 8 s |
| declaration units | sci `scripts/lsi-lean-decls.ts` | 45,092 qou declarations, keyed `<name>@<module>`, built in 189 s |
| method refusals | cat-harness `methodologies/lsi.md` | 1: never merge latent with lexical; 3: never write a relation |
| declared, not imported | sci `contentAdapters` | precedent for a lower layer finding a higher layer's code by reading declarations |

## The constraint that decides the design

**Two separately built LSI spaces cannot be compared.** Each index has its own
SVD basis, vocabulary and global weights. A cosine of 0.6 in the block space
and 0.6 in the declaration space are not the same quantity. So the answer
cannot be one list ranked across graphs unless every graph is in one space.

That leaves three options.

| | A. one list per graph *(recommended first)* | B. one joint index | C. align separate spaces |
|---|---|---|---|
| how | fold the query into each graph's own index (`foldIn`) and rank within it | build one index over work items, blocks and declarations together, with group = graph kind (`crossGroupLinks`) | map one space onto another (Procrustes) through anchor pairs |
| ranked across graphs? | no; one list per graph, side by side | yes; one space, so cosines compare | yes, in principle |
| reuses | the per-graph indexes as they are | the engine; the unit providers | nothing that exists |
| risk | none new | 45k declarations against 4.5k blocks and a few thousand work items: declaration vocabulary dominates the global weights | needs anchor pairs nobody has labelled; refused for now |
| cost | per-graph build (the 189 s case is open question 3) | one larger SVD, about 52k units at k = 100; to be measured | — |

**Recommendation: A first, then B as a measured experiment.** A answers the
question the work item asks ("is this about block Y or declaration Z?") and keeps
each graph's score in its own space, which is refusal 1's spirit. B is only
worth having if it finds pairs that A misses, and that can be measured (next
section) before anyone relies on it.

## How it is checked: explicit references are the ground truth

`lsi-epics.ts` already puts two kinds of evidence side by side and never
merges them: **explicit** wins and **latent** is the fallback. Step 3 does the
same.

1. **Explicit.** A work item whose text names a block `@id` or a Lean name that
   resolves to a declaration id is linked deterministically. This is reported
   first and is never scored.
2. **Latent.** Each graph's top hits, labelled `lexical+latent` or
   `latent only`, as `lsi_query` already does.

The explicit links are also the labelled set for measuring A against B. For
each work item with an explicit link, hide the reference text, run the latent
search, and record whether the referenced unit is in the top 5 (recall@5).
This is measured, not assumed. A house floor for the new graphs comes from
that measurement, as `LINK_FLOOR` came from 15 labelled pairs.

## Where it lives

The join must not make the tools layer import core or sci, because that would
point upward (ruling C1, `check:import-direction`).

**Proposed:** each layer **declares** its LSI unit provider in its
`<instance>.json`, the way sci declares `contentAdapters`:

```json
"lsiUnitProviders": [
  { "graphKind": "lean-decl", "module": "scripts/lsi-lean-decls.ts", "export": "declUnits" }
]
```

- **cat-harness-tools** gains a generic `nearAcross(text, providers)`. It
  reads the declarations of the layers in the checkout, builds or loads
  each graph's index, and returns one list per graph. It names no block kind
  and no Lean.
- **core** declares `blocks`. `lsi-blocks.ts` already exports `blockUnits`.
- **sci** declares `lean-decl`. `lsi-lean-decls.ts` already exports `declUnits`.
- `lsi:near` gains `--graphs beans,blocks,lean-decl`. With no flag, it runs on
  every declared provider. A folio with no Lean gets work items and blocks only,
  with no change to its code.

## Requirements (draft)

- [ ] **REQ-001** (SHALL): A cross-graph hit names its graph, and its score
  is a cosine in that graph's own space only.
  - _Acceptance:_ test: two graphs' hits are never sorted into one list under
    option A.
- [ ] **REQ-002** (SHALL): Explicit references are reported before latent
  hits, and are never scored.
  - _Acceptance:_ test: a work item naming `QOU.Mass.foo` lists that declaration
    under `explicit` whatever its cosine is.
- [ ] **REQ-003** (SHALL NOT): The tools layer imports neither core nor sci.
  - _Acceptance:_ `check:import-direction` stays green; providers are found
    by declaration only.
- [ ] **REQ-004** (SHALL): `lsi:near` still writes nothing (refusal 3).
  - _Acceptance:_ test: the work item store is byte-identical after a run.
- [ ] **REQ-005** (SHALL): A graph that could not be indexed is reported as
  not searched, never as "no hits" ("no data is not zero").
  - _Acceptance:_ test: a missing Lean root yields `lean-decl: not searched`.
- [ ] **REQ-006** (SHOULD): Recall@5 for A, and for B if it is built, is
  measured on the explicit-reference set and written to a report before any
  floor is set for the new graphs.

## Open questions for the owner

1. **A, B, or A then B?** Recommended: A then B, with B kept only if it beats
   A on recall@5.
2. **Declared providers, or a fixed list in sci?** sci is the highest layer
   that knows both blocks and declarations, so the join *could* live there.
   But then a folio without Lean has no cross-graph search. Recommended:
   declared providers.
3. **The 189 s declaration build.** `lsi:near` runs before every
   `beans create`, so it needs to be fast. The options are: (a) rebuild on
   each call; (b) keep the index in memory in the MCP server; (c) cache
   `U_k`, the vocabulary and the global weights on a cache branch in the
   `cat/folio-assistant-sci/` family, keyed by the input fingerprint the
   index already computes. Recommended: measure first, since it is not yet
   known how much of the 189 s is reading files and how much is the SVD.
   Choose (c) if a warm call still takes more than about 10 s.
4. **Which repos are the ground truth?** qou is the case the work item names.
   It is a math repo, so it is read and never written; the measurement only
   reads its work items and Lean sources.

## What happens after sign-off

There would be one PR each in cat-harness-tools (`nearAcross`, the
declaration reader, the `lsi:near` flag), core (declare the provider) and sci
(the same), then the recall@5 report. Each PR follows that
layer's own rules.
