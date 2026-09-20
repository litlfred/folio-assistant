---
# folio-assistant-cvab
title: 'BRANCH-ONLY WORK PLAN: 12 of 13 IRIS beans live only on PR #477, so the store on main is blind to a whole goal'
status: todo
type: task
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-20T18:05:19Z
parent: folio-assistant-ahvw
---

Found by the goal-review sweep of 2026-09-20 13:45–17:45 UTC (session_017PqeiS4JYySSWGAYLedmus, bean `mgta`, issue #578). An instruction gap: something the instructions said that the sweep could not do as written, said two ways, or did not say.

## Measured
Branch `claude/sleepy-rubin-mr6kdu` (PR #477, 65 commits ahead, 1,937 files) carries the `kupb` epic and 12 of its 13 children. None exist on main. A review of the store on main saw 0 of the IRIS work plan; the third goal's whole workstream was invisible until the branch was swept.

## The gap
bean-coordination §"A claim is branch-local" states the fact; nothing says what to do about a branch that stays open long enough to hold an epic. The store on main is the one every sibling reads.

## Options
1. Land beans ahead of code: a bean-only change merges as soon as the plan exists, and the code branch carries only status updates.
2. Every sweep reads the open branches' stores too (goal-review does; the todo-manager fallback does not).
3. Accept the blindness and say so in bean-coordination.

## Done when
- [ ] The owner has chosen; bean-coordination says it
- [ ] If 1: the beans on PR #477 land on main in their own change
