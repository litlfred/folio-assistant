---
# folio-assistant-oh78
title: 'ISSUE DISCIPLINE assumes every change has an issue: 54 merges, 2 issue updates, and #558 has no bean link'
status: in-progress
type: task
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-20T19:00:00Z
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

---

_2026-09-20T19:00Z_ — **Done-when 1 landed** (PR #589, issue #588).
`issue-working` §"When the work has a BEAN and no issue (STRICT)" says what is
owed: a round summary either way, and with no issue it goes on the change
proposal **and into the bean**, because the bean is the durable artefact a
sibling reads and a summary living only in a PR thread is invisible to the work
plan on `main`. It also states the both-ways link rule, with #558/`ivfw` and
#464/`mggs` as the measured cases.

**Done-when 2 is partly landed, and the part that is not is named rather than
implied.** `bun run check:bean-issue-links` checks two directions and reports
the third as undetermined every run:

| direction | verdict |
|---|---|
| bean → issue | checked — 101 issues are named by an open bean |
| issue → bean, for an issue tracked in `issue-marks/` | checked — both are named |
| issue → bean, in general | **could not determine** — needs the GitHub API |

The third row is printed rather than dropped, because a check reporting the
first two as a clean bill of health would be asserting something about every
issue in the repository on the evidence of two files.

- [x] issue-working says what a bean-driven change with no issue owes, and where
- [ ] A bean opened from an issue (or an issue opened from a bean) carries the link both ways, and a check reports the ones that do not — the API half is still unchecked
