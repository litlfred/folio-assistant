---
# folio-assistant-cvab
title: 'BRANCH-ONLY WORK PLAN: 12 of 13 IRIS beans live only on PR #477, so the store on main is blind to a whole goal'
status: completed
type: task
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-21T05:53:44Z
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
- [x] The owner has chosen; bean-coordination says it
- [x] If 1: the beans on PR #477 land on main in their own change

*Ticked IN PLACE 2026-09-21 with the evidence, not appended below.* This bean
carried its own `shadow-checklist` defect — a ticked copy at the foot while
these read open — which is pointed: its subject is *the store saying something
different depending on where you stand*.

**Item 1:** `bean-coordination.md` line 420 on `main` carries §"The store on
`main` is the one every sibling reads (STRICT)", citing this bean's own
measurement. Landed in PR #589.

**Item 2 is satisfied in substance and not in letter, and the difference is
recorded rather than glossed.** PR #477 **merged** at 2026-09-20T18:18:43Z —
33 minutes after the sweep window that found the stranding. The `kupb` epic
and its children are on `main` now, verified by listing them. They landed
**with** the code rather than ahead of it, so the remedy this bean asked for
was never exercised on the case that prompted it; the case resolved itself
first. The rule stands for the next long-lived branch, untested by this one.

---

_2026-09-20T19:00Z_ — **The owner chose BOTH remedies** (PR #589, issue #588),
and `bean-coordination` §"The store on `main` is the one every sibling reads"
now says so as a STRICT rule: land beans ahead of code, **and** a sweep reads
the open branches' stores. The section states why they are not alternatives —
(1) prevents the blindness, (2) catches the branches that were already open
when (1) landed, #477 among them.

- [x] The owner has chosen; bean-coordination says it
- [ ] If 1: the beans on PR #477 land on main in their own change

## Summary of Changes

*2026-09-21, session_01AYHimvYMmf8h8e9fFN6dW5.* **Closed on evidence, not on
authorship** — the work landed elsewhere and this records where.

**The stranding resolved itself 33 minutes after it was measured.** PR #477
merged at 2026-09-20T18:18:43Z; the sweep window that found the problem closed
at 17:45. The `kupb` epic and its children are on `main`, verified by listing
them rather than by reading the PR description.

**Both remedies were already chosen and landed** — `bean-coordination.md`
carries §"The store on `main` is the one every sibling reads (STRICT)" citing
this bean's own measurement (PR #589).

So the deliverable here is neither of the two Done-when items: it is the
**finding this bean produced on the way to being closed.**

### The bean was invisible to the checker built for exactly its shape

`cvab` carries a ticked copy of its checklist below an open canonical one —
the `shadow-checklist` defect, merged as a detector in PR #640 an hour before
this. It was **not reported**, and the reason is a real gap:

> `splitChecklist` ended the canonical section at the next `##` heading. This
> store separates dated entries with a `---` rule. Measured: **61** beans end
> their canonical section with a rule against **141** with a heading — so the
> reader folded 61 beans' later checklists back INTO the canonical section,
> where a ticked duplicate looks canonical and can never fire.

Blind to 61 beans while reporting a clean run over them — the `dh4f` shape
aimed at the checker, one day after the same shape was found aimed at
`check:command-paths` (`7iog`). **Found by USING the check on the next task,
not by re-reading it.**

Fixed: the section now ends at whichever comes first, a heading or a rule. A
table's `|---|` is not a rule and does not match. Four tests.

It found three more, all in this epic: `cvab` and `sfhr` repaired in place,
`oh78` baselined because it is queued next here and not yet claimed —
repairing an unclaimed bean is what `bean-coordination` cautions against.

### What this bean never got to test

The remedy it asked for — land beans ahead of code — was **not exercised on
the case that prompted it**. #477's beans landed *with* the code. The rule
stands for the next long-lived branch, untested by this one, and that is worth
knowing before anybody cites this bean as evidence the rule works.

*Issue link, recorded 2026-09-21.* **[#651](https://github.com/litlfred/folio-assistant/issues/651)** — closed on evidence, and the 61-bean blind spot.

Written down because `check:bean-issue-links` found it missing, and the defect is this epic's own: an issue was opened FROM this bean and the link was never carried back, so the work plan could not reach the issue from the bean. `oh78` names exactly that, and it happened four times in the session working `oh78`.
