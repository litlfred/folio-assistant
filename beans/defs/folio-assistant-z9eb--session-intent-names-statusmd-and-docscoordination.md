---
# folio-assistant-z9eb
title: session-intent names STATUS.md and docs/coordination/<goal>.md; neither exists in this instance
status: todo
type: bug
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-20T18:05:19Z
parent: folio-assistant-ahvw
---

Found by the goal-review sweep of 2026-09-20 13:45–17:45 UTC (session_017PqeiS4JYySSWGAYLedmus, bean `mgta`, issue #578). An instruction gap: something the instructions said that the sweep could not do as written, said two ways, or did not say.

## Measured
`session-intent.md` (user-invocable, bound to `session-coordinator`) step 1 is "Open `STATUS.md`" and step 2 "Open `docs/coordination/<goal>.md`". Neither path exists in this repository (`ls` fails for both). An agent following the skill as written stops at step 1.

## The gap
The ledger model came from another folio and was never re-homed when this instance moved its work plan to `beans/`. The skill's queue half is right; its ledger half points at nothing.

## Done when
- [ ] session-intent names the artefacts this instance actually has (the work plan, and wherever goals end up living — see the goals bean), or marks the ledger optional with the three-state wording
- [ ] `check:declared-paths` (or a sibling) covers paths named inside skills
