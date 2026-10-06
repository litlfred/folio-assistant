---
# folio-assistant-e8m3
title: ARCHIVING IS A THIRD TERMINAL PATH, and it bypasses the scrapped-with-reasons rule
status: completed
type: bug
priority: normal
created_at: 2026-09-25T15:44:18Z
updated_at: 2026-09-26T17:06:07Z
parent: folio-assistant-ahvw
---


## Measured 2026-09-25, window `2133f720eb` → `origin/main` `0a2150d3f6`

`beans/defs/` has an **`archive/` subdirectory**, and it is now the larger half
of the store:

```
active  (beans/defs/*.md)          327   todo 123 · in-progress 120 · completed 82 · scrapped 2
archive (beans/defs/archive/*.md)  631   (219 at the window's open edge, +412)
```

In this five-day window **131 beans left the top level**. Every one was
checked by basename against the head tree — **none was deleted**, all 131 are
in `archive/`. Their statuses as they left:

| status when archived | n |
|---|---:|
| completed | 92 |
| todo | **21** |
| in-progress | **14** |
| scrapped | 4 |

## The gap

`AGENTS.md` §"Work-plan & todos" states the rule with one alternative:

> *"Unwanted work is `scrapped`, with its reasons, because a scrapped bean
> stops the next agent re-entering a dead end while a deleted one leaves a
> sibling unable to tell abandonment from accident."*

Archiving is a **third path**, and it is not named anywhere in that rule. The
92 completed ones are unremarkable — finished work moving out of the way. The
**35 that were `todo` or `in-progress`** are the problem: they left the active
store without a terminal status and, because archiving is a file move rather
than a status change, **without a recorded reason**.

That is precisely the state the rule exists to prevent, reached by a route the
rule does not mention. A sibling looking for one of those 35 finds a bean that
is neither open nor closed nor scrapped, in a directory nothing told it to
read, with no sentence saying why it stopped.

## It is also invisible to every count this repository quotes

`bun run health` reports *"243 open beans (todo + in-progress), past the 150
calibration point"* — 123 + 120, top-level only. `check:bean-parents` globs
`beans/defs/*.md`. Both are correct about the active store and neither can see
that 35 open items were moved out of it. A number that cannot fall when work is
abandoned, only when it is finished, is not measuring what its name says.

## Not yet decided — this is a gap, not a fix

The question is which of two things archiving IS, and only the owner can say:

1. **A view, not a transition** — archived beans keep their status and remain
   part of the store; the counts and the parent check read `archive/` too, and
   the 35 stay open until somebody closes them properly.
2. **A terminal state** — archiving is a real transition alongside
   `completed` and `scrapped`, in which case it needs what those have: a
   status the CLI can produce, a recorded reason, and a gate that refuses an
   archive without one.

Option 2 is the larger change and the more honest one; option 1 is a one-line
glob fix in several places. Neither should be built unasked.

## Done when

- [x] The owner ruled 2026-09-26: **a VIEW**. An archived bean keeps its status
      and is still part of the store.
- [x] The rule names archiving — in `bean-coordination.md` §"Archiving is a VIEW,
      not a third way out", NOT in `AGENTS.md`, whose own banner says editing it
      to change agent behaviour is the wrong move and whose entry is a pointer.
- [x] The 35 are triaged — and NOT by me. Measured 2026-09-26: all 631 archived
      beans are terminal (610 `completed`, 21 `scrapped`, zero open) and all 21
      scrapped carry reason language. Somebody did this after 2026-09-25.
- [x] `check:bean-archive` reports the archive's size and status spread every
      run, and `readBeans` / `readArchivedBeans` are separate readers so no count
      can absorb the other's population by accident.


## Settled 2026-09-26 — a VIEW, and the premise had already decayed

The owner ruled **view**. Two things were then true that this bean did not say.

### The 35 no longer existed, and the swarm was not spent

The owner authorised dispatching agents to review each of the 35 beans archived
from `todo`/`in-progress`. **Measured before dispatching: there are none.** All
631 archived beans are terminal — 610 `completed`, 21 `scrapped`, zero open —
and every one of the 21 scrapped carries reason language. They were triaged some
time after 2026-09-25.

So no agents ran. A swarm over a population that no longer exists costs real
money to rediscover that, and this bean's own premise is what would have sent
them. **A bean is a measurement with a date on it**, and this one decayed inside
a day with nothing noticing — the same shape as `fx5r`'s stale API view, one
level up: a finding true when taken, quoted as if taken now.

I also told the owner the open count would *rise by 35* under the view ruling.
Measured, it rises by **0**.

### The real defect was one this bean never mentioned

`beans/beans.json` declared `defs` and `workflows` and **nothing else**, while
`beans/defs/archive/` held **631 `bean-defs`** — the larger half of the store in
a directory the graph named nowhere.

That is the `dh4f` family **inverted**: not a declared directory that is absent,
but a present one nothing declares. `check:declared-dirs` and
`check:harness-dirs` are both blind to it *by construction*, because each
compares declarations against disk and not the reverse. No amount of widening
either would have found it.

### What now holds it

`bun run check:bean-archive`, beside `check:bean-parents` in the gate set:

1. the `archive` node must be **declared**;
2. every bean in it must be `completed` or `scrapped` — the invariant the view
   ruling implies, and the 35-bean defect made impossible to have silently;
3. declared-and-absent is **exit 2, could not determine**, never empty.

It ships **green**, which is the point: a guard written only once it can fail is
a guard that exists because somebody was already in trouble.

Falsified in both failure directions — removing the declaration exits 1,
leaving one archived bean `in-progress` exits 1, restoring exits 0 — with six
tests in `cat-harness/scripts/tests/bean-archive.test.ts` including the
anti-vacuity half and the trap that `defs` and `archive` now share the kind
`bean-defs`, so resolving by kind returns the ACTIVE store under the archive's
name.

### Not done, deliberately

Archived beans are **not** held to `check:bean-parents`, `bean-rollup` or
`bean-blocks`. Those are about work in front of somebody; 631 historical beans
were never held to today's conventions, and turning them into findings would be
a red nobody can act on, which is how a gate gets switched off. Terminality is
the one property the ruling actually requires.
