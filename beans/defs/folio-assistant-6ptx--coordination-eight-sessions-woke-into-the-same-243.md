---
# folio-assistant-6ptx
title: 'COORDINATION: eight sessions woke into the same 2435-commit gap and all eight re-surveyed it independently'
status: todo
type: bug
parent: folio-assistant-ahvw
created_at: 2026-09-25T15:44:18Z
updated_at: 2026-09-25T15:44:18Z
---


## Measured 2026-09-25, from the session API

`list_sessions` returned 30 sessions, of which **eight were RUNNING at the same
minute** (15:38–15:39Z). Their own `task_summary` fields, verbatim:

```
rebasing from main; 2369 commits (PR #477→#1306); facts before plan
reviewing PR #542 impact; fast-forward reset blocked; surveying origin/main
re-fetching main after date change; will propose next steps
reviewing main, re-establishing state from notifications; CI gates in flight
PR #573 merged; re-evaluating 2432 main commits (5d stale); planning next phase
re-measuring main post-merge (PR #574); checking theme-art system
PR #572 merged; surveying main (120 in-progress, checking health)
reviewed main from #1340+; 2435 commits since last look; re-scanning issues
```

**Seven of the eight are the same task**: re-orient against the commits that
landed while the session was idle. The eighth is this one. Every one of them is
paying the full cost of a cold sweep — fetch, diff the edges, read the work
plan, read CI — over the *same* window, and none can see that the other seven
are doing it.

## What it cost, measured

Authored (non-merge) commits on `main` per day:

```
2026-09-20  242
2026-09-21  370
2026-09-22  210
2026-09-23  369
2026-09-24  216
2026-09-25    1     <-- eight sessions running
```

Five days at 210–370 authored commits/day from **39 distinct sessions**
(counted by `Claude-Session:` trailer), and then a day with **one** authored
commit while eight sessions run. The throughput did not fall because the work
ran out — 243 open beans say otherwise. It fell because every session spent the
day reading.

## Why the existing mechanisms do not catch it

- **`beans` cannot.** A survey is not a bean — nobody claims "I am reading
  main" — so `bean-coordination`'s claim-before-you-work has nothing to bite on.
  Its §"A claim is branch-local" is about work *on* an item; this is the work
  *before* choosing one.
- **The branches cannot.** All eight sessions' branches are frozen at
  2026-09-20; nothing is pushed while surveying, so a sibling checking
  `for-each-ref` sees seven idle branches, not seven active readers.
- **`goal-review` itself does not.** Its axis 1 says to ask the session API
  first — and doing so is exactly what surfaced this. But the skill reads the
  answer to classify *past* activity; it does not say "if several siblings are
  mid-survey, say so and stop, or divide the axes".

## The shape of a fix, not yet a decision

Three options, cheapest first, and none should be built without the owner:

1. **Publish the survey, don't repeat it.** One session writes the sweep to a
   durable place (an issue, or a `context`-kind graph node) with the window's
   two edge commits; a session whose window is covered reads it instead of
   re-deriving it. Staleness is decidable because the edges are recorded.
2. **Claim the window.** Extend the claim rule from items to *windows*, so
   "surveying 2133f72..HEAD" is claimable and visible.
3. **Divide the axes.** Six axes, several sessions: one takes the work plan,
   one the proposals, one CI, and they exchange conclusions.

## Done when

- [ ] The owner picks a shape (or rules that duplicated surveys are acceptable).
- [ ] `goal-review` says what to do when the API shows siblings mid-survey.
- [ ] A session arriving into a large gap can find out, before sweeping,
      whether the sweep already exists.
