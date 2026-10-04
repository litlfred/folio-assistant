---
# folio-assistant-jd1e
title: 'A CALLER UNDID g5kt: merge-base reported regen''s three verdicts as one, so could-not-determine reached the author as a defect in their branch'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-04T13:11:35Z
updated_at: 2026-10-04T13:11:58Z
parent: folio-assistant-1xhc
---

Found while re-measuring my own four claims about the `merge:main` defect class
(PR #2086). THREE OF THE FOUR did not survive measurement; this is the one that
did, and it was not where I said it was.

## The defect

`merge-base.ts` had ONE message for every non-zero `regen` exit:

    if (regen.status !== 0) abort("the gate set could not reproduce the
      resolution (regen reported unrepaired checks)");

g5kt's whole achievement was making regen say which of three things happened
(`exitCodeFor`, four named reasons, code 2 for `not-settled`). Its only caller
then collapsed them back. The sentence is FALSE in three of the four cases:

- exit 2 `not-settled` — regen reported NO unrepaired check. It reported that
  it could not reach a fixed point, so it cannot stand behind the count it
  printed. Its own words: "this is NOT a clean regeneration".
- exit 1, every bad check `no-browser` — regen labels that could-not-determine
  in as many words: "not a finding about the tree, and it is not a pass either".
- exit 1 `no-writer` / `writer-failed` — a verdict about the TOOL, which is the
  distinction i1q7 exists to keep.
- any other code, or a signal — regen itself failed and nothing was measured;
  the message described that as a measurement.

The ABORT was right in every case: none of them may push. Only the recorded
reason was wrong.

## Why it is 1xhc's shape and not just bad wording

Two measured consequences, both now pinned by tests.

1. The abort line is the one place the reason is written down, and the PR
   comment is built from it. So a could-not-determine reached the PR's AUTHOR
   as "**Error** (exit N) — merge-base failed ...", asserting a defect in their
   branch where regen had either measured nothing or explicitly declined to
   judge.

2. The three verdicts shared ONE SIGNATURE. `no-browser` prints "  ? ..."
   which `SALIENT` does not match, and `not-settled` prints no "✗" line at
   all — so the identical abort sentence was the only salient line for each.
   `classifyVerdict` then read the second DISTINCT failure on one head as a
   `repeat` and suppressed its notification. A gate that does not fire is
   indistinguishable from one that passed, one layer out from where 1xhc
   usually bites.

## The general lesson, which is the part worth keeping

g5kt did not fail. g5kt's fix was UNDONE BY ITS CALLER, and nothing failed
when that happened, because a three-state verdict read through a
`!== 0` test is indistinguishable from a two-state one at the call site.
Every tool here that reports could-not-determine has callers, and this is the
first measurement of one of them. Worth asking of the others:
`merge-leftover` (3 verdicts), `regen` (4 outcomes + 3 exits), `survey:owed`
(4 states), `audit:coverage` (4 per-kind states), `check:ci-health`
(3 + cancelled). The question is not whether the tool distinguishes, it is
whether anything fails when a caller stops distinguishing.

## Done when

[x] merge-base names the verdict regen actually reported, per exit code
[x] the decode is a pure, exported, tested function living BESIDE `exitCodeFor`
    (`regenExitMeaning`), with a test asserting the two stay inverses over the
    codes `exitCodeFor` actually emits — built from `exitCodeFor`, so adding a
    verdict there fails in the decode's test
[x] exit 1 deliberately names all four kinds rather than picking one: the code
    cannot distinguish them, and asserting one would be this defect again
[x] the PR comment says "Could not determine" where regen could not determine
[x] the verdict crosses the module boundary through a DECLARED tag
    (`REGEN_VERDICT_TAG`), not matched prose, with a test pinning both ends and
    that the false sentence does not come back
[x] a test asserts the three verdicts no longer share one signature
[ ] the five other could-not-determine tools above: does anything fail when a
    caller flattens them? NOT MEASURED — handed on, not folded in
