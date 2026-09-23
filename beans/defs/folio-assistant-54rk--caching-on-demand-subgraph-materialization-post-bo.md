---
# folio-assistant-54rk
title: 'CACHING + on-demand subgraph materialization, post-bootstrap'
status: todo
type: task
parent: folio-assistant-5a3l
priority: high
created_at: 2026-09-20T00:00:00Z
updated_at: 2026-09-23T02:45:00Z
---

Owner, 2026-09-20:

> *"some of this is post-inintation of a harness. user can ask (as they come in
> need to use) if they want to material parts of subgraphs. need tools skills
> around cahcing. bean up todo. but stub in process in cat-harness bootstrap
> insitation steps."*

## The shape

Bootstrap brings an agent to a working harness. It does **not** bring the
corpus — and it should not: `who-iris` alone is 1,057,223 files and 361.55 GB
(IRIS's own storage report, read 2026-09-20). What arrives is the REFERENCE.

Then, **as the need appears**, a person asks for a part of a subgraph to be
materialized locally. That is a post-initiation act, driven by use rather than
by setup, and it is the same subprocess `materialize-remote.bpmn` already
draws — the missing half is the CACHE: what is already here, how old, how big,
and what may be dropped.

## What exists already, and what does not

| | |
|---|---|
| `materialization.ts` | the three states, five gates, two purposes, `freshness()` — **exists** |
| `materialize-remote.bpmn` / `refresh-materialized.bpmn` | the subprocess and its refresh — **exist** |
| `external-schema.ts` | referenced specs, by edition — **exists** (2026-09-20) |
| a CACHE the tooling can ask about | **missing** |
| a bootstrap step that says any of this is possible | **missing** |

`freshness()` answers *is this copy stale* for ONE record. Nothing answers
*what do I hold, how much does it cost, and what is safe to drop* across the
whole set — which is the question a person actually asks before materializing
anything else.

## Done when

- [ ] A cache index: what is materialized, from where, when, how big, last
      read. Derived from the `materialization` records rather than a second
      store, so the two cannot disagree.
- [ ] A skill for the on-demand ask — including the size gate, because "the
      user can ask" must not mean 361 GB arrives without a number first.
- [ ] Eviction REPORTS and never acts. `deletion-requires-confirmation`, and
      the health sweep's own worked example (`plj1`) is a workflow whose shape
      deleted every open PR's preview without anybody deciding it.
- [ ] Stubbed into the cat-harness bootstrap initiation steps, so a freshly
      bootstrapped agent learns the option exists rather than discovering it
      in a schema.

## The related half, split out deliberately

Whether bootstrap explains the **dependency and instance rules** at all, and
whether the documentation reads for an agent that has just bootstrapped and
does not know what a knowledge graph is, is its own question and its own bean.
Folding them here would make this item about documentation and it is about a
cache.

---

## Re-parented off `kupb` 2026-09-23 — owner's ruling

Owner, 2026-09-22, on *"`kupb` has 12 open children and can't close, blocking
GOAL 3. Several aren't IRIS-catalogue work"*: **re-parent the non-catalogue
ones.** `kupb`'s Done-when is *"every child is closed"*, so a child that is not
about the IRIS catalogue holds GOAL 3 open for a reason unrelated to GOAL 3.

**Moved to `5a3l`.** Caching and on-demand materialisation are operating-mode concerns; the catalogue is one consumer of them, not their subject.

**Nothing about this bean's own work changed** — not its status, not its
Done-when, not a line of its body above this note. Only the question *"whose
goal does finishing this serve?"* is answered differently.
