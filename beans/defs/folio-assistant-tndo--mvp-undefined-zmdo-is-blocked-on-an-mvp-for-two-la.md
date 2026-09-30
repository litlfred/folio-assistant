---
# folio-assistant-tndo
title: 'MVP UNDEFINED: zmdo is blocked on an MVP for two layers that nothing defines, so GOAL 1''s own falsifier cannot be evaluated'
status: todo
type: task
priority: normal
created_at: 2026-09-30T11:33:55Z
updated_at: 2026-09-30T19:49:33Z
parent: folio-assistant-vke6
---

## The finding, and how it was measured

`beans/defs/folio-assistant-zmdo--split-*.md` is the bean that forks
`agentic-harness` and `folio-assist-core` and proves an empty-repo bootstrap. It
is parented to `vke6` (SPLIT #223), under GOAL 1 `vuip`. Three lines of its own
body:

- line 15, the owner's verbatim ask: *"when we get to an MVP for agent-harness
  and folio-assist-core, create"*
- line 46: *"**Blocked on MVP** of both layers. Do not start the forks before
  then"*
- line 75: *"Nothing here is measured. MVP is not defined for either layer, no
  fork has …"*

So the bean is blocked on a term, the bean itself records that the term is
undefined, and no other bean defines it. Provenance: read out of that one file
on `claude/cool-fermi-htir5p` at parity with `origin/main`, 2026-09-30.

## Why this blocks GOAL 1 rather than just one item

GOAL 1 is repo separation. `zmdo` is the step where the separation becomes real
— two repositories that actually exist — and therefore it is GOAL 1's own
falsifier: until it runs, "the layers can depend on each other" has been
demonstrated only inside one checkout. An undefined blocker cannot be cleared
and cannot expire, which is the shape `bean-blocking` rejects: *"a block with no
expiry cannot be told from abandoned work"*. `zmdo` has no expiry because
nothing can compute one from an undefined term.

**This bean does not propose the definition.** MVP for a layer is a scope call,
and scope is the owner's. What it asserts is only that the term is load-bearing
and absent.

## Done when

1. MVP is written down for `agentic-harness` and for `folio-assist-core`, as
   checkable conditions rather than a judgement — the owner's words, recorded.
2. `zmdo` carries either an expiry or a condition a check can evaluate, so
   `bean-blocking`'s rule is satisfiable.
3. GOAL 1's queue states, with a denominator, how many of its open items are
   blocked on this one term.


## RULED 2026-09-30 — MVP is BOOTSTRAP-PROVABLE

The owner chose, from four options compared in full:

> **MVP = `folio_init` creates a working folio against that layer ALONE, in an
> empty repository.**

Chosen over three alternatives, each recorded so the reasoning survives:
*self-contained gates pass* (nearest term, but passing gates in-tree is not
evidence the SPLIT works); *a real downstream builds on it* (strongest evidence,
but couples the timeline to a folio's); *expiry only, define nothing* (unblocks
the bookkeeping rule without answering GOAL 1's falsifier).

### Why this one is satisfiable where the others were not

`bean-blocking` rejects a block with no expiry because *"a block with no expiry
cannot be told from abandoned work"*. `zmdo` had no expiry because nothing could
compute one from an undefined term. This definition is **runnable**, so the
block now has a condition a check can evaluate rather than a judgement to wait
on.

It is also what `zmdo` already set out to prove — its own body says the fork
"proves an empty-repo bootstrap". The definition and the falsifier are now the
same act rather than two.

### Checkable conditions, per layer

For each of `agentic-harness` and `folio-assist-core`, independently:

- [ ] `bun run init-folio` against **that layer alone** — no sibling instance on
      disk, no other layer linked — exits 0 in an empty repository.
- [ ] The scaffolded folio's declared graphs RESOLVE: every directory named in
      its `<instance>.json` exists, and no declared-but-absent entry (the `dh4f`
      defect, where a consumer scans nothing and reports a clean run).
- [ ] That folio's own gate set passes in the fresh repository, not only in this
      checkout.
- [ ] The layer's `needs:` closure is satisfied by what is actually present —
      i.e. the bootstrap did not silently depend on a layer above it.

**Each is a command, not an opinion.** That is the whole point of the choice:
the owner's other three options all required somebody to judge readiness.

### What this does NOT settle

- **When** the conditions will hold. This defines the bar; it does not schedule
  it. `zmdo` stays blocked, but now on something computable.
- Whether `folio_init` currently CAN target a single layer. If it cannot, that
  is a finding against `folio_init` rather than a reason to weaken the
  definition — and it is the first thing to measure.

## Done when — status

1. [x] MVP written down for both layers as checkable conditions, in the owner's
       terms, recorded here.
2. [ ] `zmdo` carries the condition, so `bean-blocking`'s rule is satisfiable.
3. [ ] GOAL 1's queue states, with a denominator, how many open items are
       blocked on this term.
