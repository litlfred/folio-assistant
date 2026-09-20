---
# folio-assistant-ucb9
title: bun run gates says which GATE failed, never which TEST — so a gate red for a known reason masks a new one
status: todo
type: bug
priority: normal
created_at: 2026-09-20T13:23:53Z
updated_at: 2026-09-20T13:24:12Z
parent: folio-assistant-o3xy
---

Found 2026-09-20 by being caught out by it, on bean `7yvd`.

## What happened

`bun test` was red locally for a known, unrelated reason — the stale
gitignored `scripts/__pycache__` of bean `koth`. Six new BPMN diagrams then
introduced a SECOND failure in the same gate
(`every activity names a skill or declares why it has none`, 17 activities).

`bun run gates` reported:

```
✗ 2 of 55 failed:
  · bun test   (typescript / bun test)
  · bun run check:undeclared-files:check
```

Identical output before and after the new failure existed. I read it as the
known one and pushed. CI caught it.

## Why this is the tool's gap and not only mine

A gate that is ALREADY red is the normal state while work is in progress, and
the summary gives a reader no way to tell "still the one I know about" from
"that one plus a new one". The information exists — `bun test` prints
`(fail) <name>` per failure — and is discarded at the summary.

The cost is asymmetric in the direction that matters: a gate going from red
to red-for-a-new-reason is **invisible**, while a gate going green→red is
loud. The invisible transition is the one that reaches CI.

## What would have caught it

Printing the failing test names under a failed `bun test` gate — the two or
three lines the runner already emits. `bun run gates` would then have read:

```
· bun test   (typescript / bun test)
    (fail) the root is clean, and stays that way
    (fail) no activity is silently skill-less        ← new
```

## Worth considering, not assumed

Whether this generalises past `bun test`. Several gates are `*:check`
scripts whose own output already names what drifted, so the summary may only
need to stop swallowing stdout on a failed gate rather than special-case one
runner. Measure before building.

## Done when

- [ ] a gate that is red for a NEW reason is distinguishable, in the summary,
      from one still red for the reason you already knew about
- [ ] whatever the mechanism, it does not require the reader to re-run the
      gate by hand to find out
