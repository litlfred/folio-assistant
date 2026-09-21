---
# folio-assistant-oh78
title: 'ISSUE DISCIPLINE assumes every change has an issue: 54 merges, 2 issue updates, and #558 has no bean link'
status: in-progress
type: task
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-21T06:14:42Z
parent: folio-assistant-ahvw
---

Found by the goal-review sweep of 2026-09-20 13:45–17:45 UTC (session_017PqeiS4JYySSWGAYLedmus, bean `mgta`, issue #578). An instruction gap: something the instructions said that the sweep could not do as written, said two ways, or did not say.

## Measured
54 proposals merged in the window; 2 issues changed (both newly opened). `issue-marks/` tracks two issues (#203, #223). Issue #558 ("Sticky pin: unpinning loses the theme") has no bean link although bean `ivfw` is its subject verbatim; issue #464 is open on a completed bean (`mggs`) whose body says the agent left it open on purpose.

## The gap
issue-working says a round summary goes on the ISSUE after each round, and that feature work is linked to an issue. Most of this day's work was bean-driven with no issue at all, so the rule was silently inapplicable rather than broken. Nothing says where the round summary goes when the work has a bean and no issue, or that a bug arriving as an issue must be linked from its bean.

## Done when
- [x] issue-working says what a bean-driven change with no issue owes, and where
- [x] A bean opened from an issue (or an issue opened from a bean) carries the link both ways, and a check reports the ones that do not

*Ticked IN PLACE 2026-09-21, not appended below.* This bean carried its own
`shadow-checklist` defect — a ticked copy further down while these read open —
and it was baselined rather than repaired an hour ago precisely because it was
not yet claimed. Claimed now, so repaired.

**Item 1** landed in PR #589: `issue-working` §"When the work has a BEAN and no
issue (STRICT)".

**Item 2** is complete with this change: `check:bean-issue-links` now asks the
forge for the issue → bean direction, which was the half it could only report
as unknown.

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

## Summary of Changes

*2026-09-21, session_01AYHimvYMmf8h8e9fFN6dW5.* **The API half is built, and
the first thing it found was this session breaking this bean's own rule.**

### The direction that stood as "could not determine" since #595

`check:bean-issue-links` reported three rows: bean → issue **checked**,
issue → bean for a tracked issue **checked**, and issue → bean in general
**could not determine — needs the GitHub API**. That third row was honest and
it was the whole of Done-when 2.

It now asks the forge, following `check:ci-health`'s model exactly rather than
inventing one — `GITHUB_TOKEN`/`GH_TOKEN` when present, a 20-second timeout,
and every failure path resolving to **`unknown`**, never to clean. Pull
requests are excluded: the REST issues endpoint returns them and a PR is not
an issue a bean should name.

**`unknown` is not a pass, and the wording says so where a reader meets it.**
A check that asks a network and reports silence as agreement asserts something
about every issue in the repository on no evidence — this check's own prose
warned about that while the direction went unasked. `--offline` exercises the
path deliberately.

### What it found immediately: 23 of 50 open issues named by no open bean

**Four of them were mine, created in this session, from these beans.**

| bean | issue created from it | recorded in the bean? |
|---|---|---|
| `hajp` | #645 | **no issue reference at all** |
| `sfhr` | #639 | no |
| `b963` | #620 | no |
| `cvab` | #651 | no |

That is precisely the defect this bean names — *"a bean opened from an issue
(or an issue opened from a bean) carries the link both ways"* — committed four
times **by the session working this bean**, and invisible until the direction
it asks for existed. The links are now written into all four.

23 → 20 after the repair. The remaining 20 are **counted, not failed**: an
issue with no bean may be somebody else's, a question, a discussion. Failing
on them would make this check a demand that every issue in the repository
become somebody's bean, which nothing in `issue-working` says.

### The bean's own store defect, repaired on claiming

`oh78` carried a `shadow-checklist` — a ticked copy below an open canonical
one. It was **baselined an hour ago rather than repaired**, because it was not
yet claimed and repairing an unclaimed bean is what `bean-coordination`
cautions against. Claimed, repaired in place, and **removed from the
baseline** — a baseline entry is a deferral, not a home.
