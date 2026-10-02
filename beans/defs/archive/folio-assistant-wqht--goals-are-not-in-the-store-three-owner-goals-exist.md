---
# folio-assistant-wqht
title: 'GOALS ARE NOT IN THE STORE: three owner goals exist as chat text; milestone type unused; every review reclassifies by hand'
status: completed
type: task
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-20T18:50:40Z
parent: folio-assistant-ahvw
---

Found by the goal-review sweep of 2026-09-20 13:45–17:45 UTC (session_017PqeiS4JYySSWGAYLedmus, bean `mgta`, issue #578). An instruction gap: something the instructions said that the sweep could not do as written, said two ways, or did not say.

## Measured
The owner stated three goals in chat (repository separation and instantiation; the LHS navbar with folios and moving stickies; WHO IRIS through a themed harness). The store has 13 in-progress epics and 0 milestones; the `milestone` type is configured and unused. No epic carries a goal's words, so classifying 140 open items against the goals was a judgement redone from scratch, and will be again next time.

## The gap
todo-manager and session-intent describe a "goal-scoped" queue, but nothing says where a goal LIVES. Without an object, "prioritise against the goals" cannot be a query.

## Options for the owner
1. One `milestone` bean per goal, in the owner's words, with the relevant epics parented to it (recommended — the type exists, `check:bean-parents` already allows epics under milestones).
2. A `goals` section in `interaction/` (context graph) that the review reads.
3. Leave goals in chat and keep classifying by hand.

## Done when
- [ ] The owner has chosen where goals live
- [ ] The three current goals exist there, verbatim
- [ ] todo-manager says a goal is a milestone (or whatever was chosen) and how an epic joins one


## OWNER: **"wqht - milesotne"**, 2026-09-20 — done

Three milestone beans created, each carrying the owner's words verbatim:

| milestone | goal |
|---|---|
| `vuip` | separation of repos into dir/repos, instantiation skilled/tooled/tested |
| `p5wm` | LHS navbar with instantiated harness, folios, stickies that move |
| `yg29` | showing who-iris with its materialised assets, themed |

Epics parented where the mapping is unambiguous: `vke6` → `vuip`; `yj32` and
`o3xy` → `p5wm`; `kupb` → `yg29`. Epics that serve more than one goal
(`zzmr`, `1xhc`, `slw1`) are listed in the milestone bodies rather than
parented, because assigning them would claim a breadth they do not have.

**`check:bean-parents` failed on the day they landed**, and the checker was
wrong rather than the milestones. It excluded only `epic` from the
"must carry a parent" rule and accepted only `epic` as a parent, while this
store's own stated hierarchy is `milestone -> epic -> feature -> task/bug`.
So the first three milestones ever created were asked for a parent that by the
hierarchy cannot exist — the same shape the checker's own header warns about
one level down. Fixed with `ROOT_TYPES` and `PARENT_TYPES`, three tests, and
both mutations confirmed caught (4 and 2 failures).
