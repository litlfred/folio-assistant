---
# folio-assistant-e8m3
title: ARCHIVING IS A THIRD TERMINAL PATH, and it bypasses the scrapped-with-reasons rule
status: todo
type: bug
parent: folio-assistant-ahvw
created_at: 2026-09-25T15:44:18Z
updated_at: 2026-09-25T15:44:18Z
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

- [ ] The owner says whether archiving is a view or a terminal state.
- [ ] `AGENTS.md`'s scrapped-not-deleted rule names archiving, whichever it is.
- [ ] The 35 beans archived from `todo`/`in-progress` are triaged — reopened,
      or given a terminal status with a reason.
- [ ] Whatever counts the repository quotes ("243 open beans") say which
      directories they read.
