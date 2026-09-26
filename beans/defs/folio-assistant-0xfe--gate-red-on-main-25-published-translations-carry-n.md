---
# folio-assistant-0xfe
title: 'GATE RED ON MAIN: 25 published translations carry no `.po` catalogue, compounding across three merges'
status: in-progress
type: bug
priority: normal
created_at: 2026-09-26T06:44:45Z
updated_at: 2026-09-26T06:47:24Z
parent: folio-assistant-bzyu
---


`translation-drift`'s ratchet test — "no NEW drift, and nothing unreadable" —
fails on `main`. 25 published translations are served with no `.po` catalogue
and no entry in `UNCATALOGED`, so the gate has been red on every merge since
it started.

## Measured 2026-09-26, by bisecting `main`'s first-parent history

| merge | findings |
|---|---|
| `ffe24b51cc` (#1362) | **0 — green** |
| `778fae27e0` (#1368) | 7 |
| `2702e852d0` (#1371) | 17 |
| `a0fbdc7ac7` (#1374) | 25 |

Three translation PRs merged in a row, each publishing pages with no
catalogue, each making the same test worse. **The gate fired on all three and
the merges kept coming** — the same shape as `skill-manifest-coverage` under
#1365, where a working hard gate named six files exactly and nobody acted
between the merge and the next day.

A clean 5 x 5 grid: `accessibility`, `content-types`, `contributing`,
`getting-started`, `installation` x `ar`, `es`, `fr`, `ru`, `zh`. Re-measured
on `772b14accd` after `main` moved: still exactly 25.

## Why RECORDING is the fix and generating catalogues is not

Every one of the 25 is a catalogue finding. **Zero are structure findings**,
and that is a measurement rather than an assumption: `driftFor` runs the
structure check independently of the catalogue check in the same loop, so each
page was compared against its source and `sameStructure` held. Only the `.po`
is absent.

`UNCATALOGED`'s own docstring settles the rest — a catalogue "cannot be
derived from a finished translation without inventing the segmentation". So
the two `agent-onboarding` entries already there are precedent for exactly
this situation, and the same reason applies verbatim.

## What this bean does NOT decide

It does not decide that these pages should ship without catalogues. The list
is a BACKLOG by its own docstring, every entry carries `2026-09-26`, and
whoever owns the translation work clears them by adding the catalogues.

## The overlap with #1370, deliberately

#1370 records five of the same 25 (`getting-started`). Recording only the
other 20 was tried first and measured: the gate stays RED at 5 findings, so a
20-entry PR cannot unblock `main` by itself and would wait on a 63-bean sweep
to land. This carries all 25 instead.

Whichever PR merges second drops its copy of those five. Not left to
vigilance: the "no page is recorded TWICE" test spans `KNOWN_DRIFT` and
`UNCATALOGED` together, so the duplicate fails the suite rather than merging
quietly. That is the `kfkh` shape — two sessions adding the same key at
different line positions merge with no conflict — and it is caught here.

## Done when

- [x] every one of the 25 is recorded with a date and a reason naming what is missing
- [x] `translation-drift.test.ts` green — 18 pass, 0 fail (was 17/1)
- [x] the reason is a measurement: zero structure findings, verified via the independent structure check
- [x] the gate set run against the MERGE commit, not `bun test` alone — CI on `e62f82bbd0`:
      11738 pass / 5 fail, and `translation-drift` is **not** among the 5
- [ ] #1370's session told to drop its five rather than extend, so the second merge does not duplicate
- [ ] the catalogues themselves added, or these entries re-justified — **owner's, not this bean's**

## Evidence

Bisect above, re-measured on `772b14accd`. After recording:
`bun test cat-harness/content/pipeline/translation-drift.test.ts` -> 18 pass,
0 fail, 76 expect() calls. `UNCATALOGED` holds 27 entries (2 pre-existing +
25). Intermediate state with only 20 recorded left exactly the 5
`getting-started` findings, which is what established that a partial fix does
not clear the gate.

## CI, 2026-09-26 06:51Z — the gate this bean exists for passed

`TypeScript — tests, lint, types (hard)` on `e62f82bbd0`: **11738 pass / 5 fail**.
`translation-drift`'s ratchet is absent from the failures, measured on the merge
of this head into `main` rather than only locally. The change works.

The 5 that remain are #1365's set — the retired `roles:` key (two are one test
file), 8 stale reference pages, 6 unlisted manifest entries, and the
declared-directory guard as a knock-on. None touches
`content/pipeline/translation-drift.ts`.

**#1376 and #1381 are exactly complementary**, which is itself evidence each
fixes what it claims and nothing more:

| | failures |
|---|---|
| #1376 — fixes #1365's five | **1**, `translation-drift` |
| #1381 — fixes `translation-drift` | **5**, #1365's set |

Not porting #1376's 37 files here: that change was #1377, closed as a strict
subset of #1376, and re-adding it would recreate a withdrawn duplicate in the
one file category where two branches collide worst. Not spending the one
re-run either — these five fail deterministically on pristine `origin/main` at
both `ffe24b51cc` and `772b14accd`, so there is no suspected flake to confirm.
