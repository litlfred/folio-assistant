---
# folio-assistant-oh78
title: 'ISSUE DISCIPLINE assumes every change has an issue: 54 merges, 2 issue updates, and #558 has no bean link'
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
54 proposals merged in the window; 2 issues changed (both newly opened). `issue-marks/` tracks two issues (#203, #223). Issue #558 ("Sticky pin: unpinning loses the theme") has no bean link although bean `ivfw` is its subject verbatim; issue #464 is open on a completed bean (`mggs`) whose body says the agent left it open on purpose.

## The gap
issue-working says a round summary goes on the ISSUE after each round, and that feature work is linked to an issue. Most of this day's work was bean-driven with no issue at all, so the rule was silently inapplicable rather than broken. Nothing says where the round summary goes when the work has a bean and no issue, or that a bug arriving as an issue must be linked from its bean.

## Done when
- [ ] issue-working says what a bean-driven change with no issue owes, and where
- [ ] A bean opened from an issue (or an issue opened from a bean) carries the link both ways, and a check reports the ones that do not
