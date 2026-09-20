---
# folio-assistant-wqht
title: 'GOALS ARE NOT IN THE STORE: three owner goals exist as chat text; milestone type unused; every review reclassifies by hand'
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
