---
# folio-assistant-tjj6
title: goal-review with no goals given ignores the goal milestones already in the store
status: completed
type: task
priority: normal
created_at: 2026-09-24T12:20:12Z
updated_at: 2026-09-30T00:27:10Z
parent: folio-assistant-ahvw
---

Found 2026-09-24. The owner ran `/goal-review 1d` with no goals. The command says: *"With no goals, produce the synopsis and the instruction gaps, and say that no queue was built because no goal was given."* The skill's inputs table agrees ("none — ask, or review without a queue and say so").

**But the store carries the goals as objects:** milestones `vuip` (GOAL 1: separation of repos…), `p5wm` (GOAL 2: LHS navbar…) and `yg29` (GOAL 3: showing who-iris…). The skill's own §"Goals that are not in the store are a gap" exists to make exactly this possible, and it has happened. Nothing tells the no-goals path to use them, so the review drops the one input the store could supply.

## Done when
- [x] with no goals given, the command lists the store's goal milestones, in their own words, and offers them as the queue basis in the closing question, rather than silently building no queue
- [x] it says the milestones' titles are the owner's words only where the milestone quotes the owner; otherwise say so

## Summary of Changes

Amended `cat-harness/skills/sdlc/sdlc-core/goal-review.md` (and `.claude/commands/goal-review.md` for tjj6) on branch claude/magical-archimedes-4qkfxp-goal-review-gaps; every done-when box addressed in the skill text.
