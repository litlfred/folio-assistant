---
# folio-assistant-6ptx
title: 'COORDINATION: eight sessions woke into the same 2435-commit gap and all eight re-surveyed it independently'
status: todo
type: bug
priority: normal
created_at: 2026-09-25T15:44:18Z
updated_at: 2026-09-26T07:38:23Z
parent: folio-assistant-ahvw
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

## The cost, measured the same day — it turned `main` red and nobody saw

Four gates are failing on `main` as of 2026-09-25T16:00Z, reproduced on a
pristine `origin/main` worktree rather than inferred:

```
every open bean belongs to an epic > the real corpus passes
skill coverage > every skill in a `skills/` package has a published reference page
a module that resolves a declared directory can resolve one > IMPORTING one writes nothing
skill package manifests cover the package > every skill file is listed in its package manifest
```

The first one's cause is a single bean with no `parent:` — `7e59`,
*"INGEST: decision-making methodologies"*. Its commit:

```
2026-09-25T17:38:10+02:00  ad772240549  beans: create 7e59 — decision-making methodology selector skill
```

**15:38:10 UTC — inside the 15:38–15:39Z minute in which the session listing
above showed all eight sessions RUNNING and surveying.** One of the surveying
sessions created a bean without a parent, turning `main` red, and the other
seven did not notice, because all seven were reading the same 2435 commits.

## And the breakage is invisible twice over

**Once at the gate.** `check:ci-health` reports `Code-quality gates` on `main`
as `⏳ green (newest run has not reported — verdict may predate HEAD)`. Every
recent run of that workflow on `main` is still `in_progress`: commits land
faster than the gate completes, so the newest COMPLETED verdict is always for
an older tree. The check is honest; a reader who drops the parenthesis reads a
stale pass as a current one. That is `1xhc`'s subject with a variant it does
not yet cover — not a gate that did not fire, but **a gate that has not
finished**.

**Once at every open PR.** The eight PRs a sweep called "green and clean" have
TypeScript gates that completed at:

| PR | gate completed (UTC) |
|---|---|
| #1317 | 2026-09-25 04:59 |
| #1338 | 2026-09-25 04:59 |
| #1251 | 2026-09-24 06:11 |
| #1034 | 2026-09-23 09:26 |

All of them **hours to days before 15:38**, when `main` broke. Their green is
real about the tree it was measured on and says nothing about today's. A PR's
checks run on the merge ref, so none of these has ever been evaluated against
the current `main` — and "merge the 8 green ones" would merge work whose gate
has not seen the base it is landing on.

So the duplicated survey is not only wasted effort. It is wasted effort
happening in exactly the window where the thing being surveyed broke, measured
by instruments whose answers were already stale when read.

## Done when

- [ ] The owner picks a shape (or rules that duplicated surveys are acceptable).
- [ ] `goal-review` says what to do when the API shows siblings mid-survey.
- [ ] A session arriving into a large gap can find out, before sweeping,
      whether the sweep already exists.


## Sharper instance, 2026-09-26: redundant FIXING, not just redundant surveying

The entry above measured eight sessions re-surveying the same gap. Today the
same shape produced two pull requests that are **byte-identical**.

| | |
|---|---|
| **#1376** | *"Unbreak main: #1365's seven skills landed without their derived artefacts"* — 27 files |
| **#1383** | *"main's gate set: 7 of 153 failing → 2. One skill landed without its siblings, again"* — 27 files |

Measured with `git diff` between the two heads, not inferred from the titles:
**26 files in common, 25 of them identical**, one differing. #1376 carries one
extra bean; #1383 carries one extra health report. Two sessions, two branches,
two PRs, one fix.

And they were not alone. **Five open PRs were converging on the same red
`main`** at 07:00Z — #1376, #1383, #1381 (the 25 uncatalogued translations),
#1363 (the gates tree guard) and #1372 (which had ported three of main's
failures into itself). A sixth, #1364, is the one that actually landed and
turned main green at 07:19Z.

## Why the existing claim mechanism does not catch this

`bean-coordination` says **claim before you work**, and that is sound for work
that HAS a bean. None of this work did at the moment it started: each session
saw a red gate on `main` and reacted. Reactive repair has no id to claim, so
the protocol has nothing to bind to — the claim is not weak here, it is
*absent*.

That is a different gap from the one above and wants a different answer. A
survey is wasteful; a duplicated fix is wasteful **and** produces a merge
conflict for whichever session loses, which is a second cost the first entry
does not measure.

## Not proposing the remedy here

Several are plausible — a claim keyed on the failing GATE rather than on a
bean, a "who is already on main's red?" question in the session-start sweep,
or nothing at all on the grounds that duplicated repair is cheaper than
coordination. Choosing between them is the owner's, and this bean is where the
evidence belongs, not the decision.
