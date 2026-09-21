---
# folio-assistant-dyd3
title: 'ONE GRAPH, TWO @ids: bootstrap is published at two paths with 84 subjects under two identities'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T18:27:04Z
updated_at: 2026-09-21T21:46:31Z
parent: folio-assistant-vke6
---

Split out of `3jhq` on the owner's ruling ("fix staging only; bean the
duplication"), with the evidence already gathered.

## Measured 2026-09-21, not assumed

`docs-site.yml` published the bootstrap graph **twice**:

| path | written by | top-level fields |
|---|---|---|
| `<base>/bootstrap.jsonld` | `kg-export --instance ./bootstrap` | `generatedAt`, `sourceCommit*` |
| `<base>/bootstrap/bootstrap.jsonld` | `gen-bootstrap-graph.ts` | `omitted`, `problems`, no timestamp |

**Re-measured at implementation time, and the earlier figure was stale.** The
table above said 85 nodes each; it is **88**, of which **85 are doc-relative**
— so 85 subjects existed under two identities that no consumer will ever
merge, and only the 3 absolute `cat-harness/ns#graphKind/*` IRIs were shared.
A cold reader following `bootstrap/README.md` landed on one document, anything
walking cat-harness's `skillHome` links landed on the other.

**Collapsing the paths alone would NOT have settled it** — measured after
pointing both at one URL: the two documents still disagree on **74 of the 88
nodes** (`inSubgraph` among them) and on six top-level fields. Two publishers
at one URL is a last-writer-wins race, which is worse than two URLs, because
it is invisible.

## Why this was NOT settled in 3jhq

Both documents have a real argument behind them, and neither is obviously the
one to drop:

- `gen-bootstrap-graph.ts` exists for a reader "pointed at a repository
  with nothing installed", and its `@id` contract is the `bootstrap/`
  path. Its purity (no `generatedAt`, no sha) is deliberate and documented.
- `kg-export --instance` is what cat-harness's own links resolve to, and it
  carries the provenance a published graph is supposed to carry.

## The three options, as tabled

- [B] **A** — collapse to the site root; make `bootstrap/bootstrap.jsonld`
  an alias. Cleanest graph; reopens the cold-start argument.
- **B** — collapse under `bootstrap/`; repoint `skillHome`. Preserves the
  documented cold-start contract; changes what every cross-instance link mints.
- [B] **C** — two documents is correct (frozen snapshot vs live export); write
  the distinction into both workflows and the skill so it is not re-filed.

**The owner chose B**, and then chose **retire `gen-`, keep `kg-export`** for
which publisher survives. `gen-bootstrap-graph.ts` and its tests stay; only its
two publish steps are gone.

## Done when

- [x] the owner picks A, B or C — **B**, then "retire `gen-`, keep `kg-export`"
- [x] whichever it is, ONE of these is true and stated: the two paths resolve
      to one identity, or the documents are distinguishable by something other
      than their path — **one identity**: `kg-export --instance ./bootstrap`
      now writes `<stub>/<stub>.jsonld`, the URL `gen-`'s `@id` already named,
      and `gen-` no longer publishes at all
- [x] `kg:audit` or an equivalent has an opinion, so a future third path is a
      finding rather than a discovery — `bootstrap-graph.test.ts` gained two
      guards, each falsified by planting the defect: the site writes the path
      the `@id` names (derived from the `@id`, not written out), and **exactly
      one** step publishes a bootstrap graph per workflow

## Do not — the premise, and what it measured to

> Do not "fix" this by deleting either publish step. Both are currently reached
> by a documented route, and removing one is how `blv9` happened.

**Measured false for `gen-`.** No prose file under `bootstrap/` mentions
`bootstrap.jsonld` at all — the README sends a cold reader to
`workflows/initialize-harness.bpmn` and `skills/bootstrap-kg-navigation.md`.
The "documented route" was the thing that did not exist, which
`bootstrap-graph.test.ts` had already recorded on 2026-09-20 when it retired
the two tests resting on it. It holds for `kg-export`, whose output IS the
target of every `skillHome` link cat-harness mints, and that is the publisher
kept.

The guard the "Do not" wanted is real and is now a test rather than a
sentence: the surviving publisher writes the path the `@id` names, and a
second publisher re-appearing fails.
