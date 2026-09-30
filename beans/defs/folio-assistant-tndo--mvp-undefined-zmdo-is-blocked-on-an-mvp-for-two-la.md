---
# folio-assistant-tndo
title: 'MVP UNDEFINED: zmdo is blocked on an MVP for two layers that nothing defines, so GOAL 1''s own falsifier cannot be evaluated'
status: todo
type: task
created_at: 2026-09-30T11:33:55Z
parent: folio-assistant-vke6
updated_at: 2026-09-30T11:33:55Z
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
