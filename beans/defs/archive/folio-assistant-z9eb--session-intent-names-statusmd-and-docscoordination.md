---
# folio-assistant-z9eb
title: session-intent names STATUS.md and docs/coordination/<goal>.md; neither exists in this instance
status: completed
type: bug
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-20T21:15:00Z
parent: folio-assistant-ahvw
---

Found by the goal-review sweep of 2026-09-20 13:45–17:45 UTC (session_017PqeiS4JYySSWGAYLedmus, bean `mgta`, issue #578). An instruction gap: something the instructions said that the sweep could not do as written, said two ways, or did not say.

## Measured
`session-intent.md` (user-invocable, bound to `session-coordinator`) step 1 is "Open `STATUS.md`" and step 2 "Open `docs/coordination/<goal>.md`". Neither path exists in this repository (`ls` fails for both). An agent following the skill as written stops at step 1.

## The gap
The ledger model came from another folio and was never re-homed when this instance moved its work plan to `beans/`. The skill's queue half is right; its ledger half points at nothing.

## Done when
- [x] session-intent names the artefacts this instance actually has (the work plan, and wherever goals end up living — see the goals bean), or marks the ledger optional with the three-state wording
- [x] `check:declared-paths` (or a sibling) covers paths named inside skills

---

_2026-09-20T19:30Z_ — **Both Done-whens landed** (PR #589, issue #588).

`session-intent` no longer names `STATUS.md` or `docs/coordination/<goal>.md`.
Rather than repointing them, the ledger's four jobs were re-homed into the
objects that already own them here, because that is what the skill was
describing before this instance moved its work plan into `beans/`:

| the ledger's job | where it is now |
|---|---|
| goals, and what serves each | a `milestone` bean per goal, epics parented to it (`wqht`) |
| canonical status of an item | the bean. There is no second copy, so the "trust the ledger" arbitration has nothing left to arbitrate |
| flip-flop history | a `scrapped` bean keeps the rejected approach with its reasons; a `trap` memory node keeps the failure signature |
| session log | the bean's body notes plus the PR |

The dashboard is now **explicitly optional**, with the three-state wording this
bean's Done-when asked for: a dashboard exists → read it; no dashboard and the
work plan reads → nothing is missing, this is a *determined* absence; the work
plan could not be read → **that is not an empty plan**, say so and fix it.

Steps 1, 2, 4a and the session-end step 2 are rewritten to match, so an agent
following the skill as written no longer stops at step one.

Done-when 2 is covered by `check:command-paths`, which includes every skill in
its corpus. A bare root-level markdown name in a skill — exactly `STATUS.md` —
is judged, and there is a unit test asserting it.

_2026-09-20T21:15Z_ — **Closed.** Both Done-when boxes above are ticked against
the work recorded in this bean, and the status now says so.

**It should have said so an hour ago.** This bean was finished, its evidence
written into its own body, and left `in-progress` — while the session that left
it there was closing `bbbl`, whose entire subject is *a bean finished in its
body and left open*. Worse, the ticks were appended as a SECOND copy of the
checklist at the foot of the file, so the canonical `## Done when` still read
0 of 2 and any reader or tool consulting it saw an untouched bean.

