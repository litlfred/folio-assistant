---
# folio-assistant-m1k4
title: DUPLICATE manifest entry survives every gate — the uniqueness check uses a Set, which collapses it
status: todo
type: task
parent: folio-assistant-1xhc
created_at: 2026-09-26T08:05:18Z
updated_at: 2026-09-26T08:05:36Z
---

Measured on `origin/main` at `0c5086db6c1`, 2026-09-26.

`cat-harness/skills/workflow/package-manifest.json` lists **14** skills of which
**13 are distinct**. `release-epic-planning` appears **twice**.

    skills entries: 14 | distinct: 13
    DUPLICATES: {'release-epic-planning': 2}

## Why no gate sees it

`scripts/tests/skill-manifest-coverage.test.ts:133`:

    const listed = new Set(p.listed);

A `Set` is the right structure for asking *"is this skill covered?"* and it is
structurally incapable of answering *"is it covered once?"* — the duplicate is
collapsed before the assertion runs. The check is not lax here; it is answering
a different question and cannot be asked this one. `bun test` over that file:
**4 pass, 0 fail**, with the duplicate present.

## Where it came from, and why that matters more than the entry

This is `6ptx`'s cost, realised. Two sessions independently repaired the same
defect — `release-epic-planning.md` arriving unlisted — and both appended the
entry:

- `#1364` (*"FOURTH OCCURRENCE, fixed in the same pass"*)
- `#1383` (*"remove `roles`, append the skill to the workflow package manifest"*)

Each was correct alone. Applied together they compose into a state neither
intended and no gate rejects. **That is the argument for coordination stated as
a defect rather than as an opinion**: the cost of duplicated repair is not only
the wasted session-hours the earlier bean measured, it is artefacts that are
wrong in a way the test suite is blind to.

## Done when

- [ ] The duplicate is removed from `skills/workflow/package-manifest.json`.
- [ ] A gate asserts each manifest lists every skill **exactly once** — the
      complement of the coverage question, not a widening of it. It must fail
      on today's `main` before the removal and pass after, or it is not testing
      what it claims.
- [ ] Every other `package-manifest.json` is checked for the same shape. One
      duplicate found by accident says nothing about the rest, and this one was
      found only because a merge-preview was being inspected for another
      reason.

## Not doing here

Not fixed in this branch. `main` is in a contested state — `#1364` was merged
and then reverted by `#1384` on the owner's instruction within forty minutes,
and two sessions hold the opposite decision on the neighbouring UNCATALOGED
question under bean `ngxj`. Landing an unrelated one-line manifest edit into
that is how a small correct change acquires someone else's conflict. Filed for
whoever owns `v625`, which is the live bean on manifest entries.

