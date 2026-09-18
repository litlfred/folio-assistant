---
# folio-assistant-qusg
title: 'q-usage narrative-chapter-mismatch flagged ~50% of eight chapters'
status: completed
type: bug
priority: normal
created_at: 2026-08-07T21:15:00Z
updated_at: 2026-08-07T21:25:00Z
---

Triage of what `q-usage-audit` reports now that it runs at all (1b82747 —
before that it swept 0 blocks and exited 0, so nobody had seen this).

## First run: 8 fails, 729 warns

694 of the 729 were ONE criterion, `q-usage-narrative-chapter-mismatch`,
hitting **23% of all 3017 blocks**. Per chapter that was 40-57% across eight
chapters:

    mass-theory        349/661  53%      organic-chemistry    13/23  57%
    predicted-spectra   91/214  43%      measurement-obs       6/12  50%
    observations        89/189  47%      climax-volume-mass   27/54  50%
    fluid-dynamics      51/96   53%      molecular-constr     28/70  40%

compared with `braids-and-knots` at 4% and `q-geometric-langlands` at 10%.
A criterion flagging half a chapter is describing its own table, not the
content.

## Cause

Every archimedean chapter's expected set was
`["na", "real-positive", "real-gt-1", "fixed-q0"]` — **no `symbolic`, no
`generic-R`**. 632 of the 694 flagged blocks detected nothing but those two.

It is also the wrong DIRECTION. §7c makes the algebraic substrate the default
and archimedean specialisation the declared exception, so a purely symbolic
block is on the safe side of the wall wherever it sits. And the criterion's
own doc says a mismatch marks a block as "a candidate for being moved" — a
symbolic *definition* inside `mass-theory` is not a candidate for being moved,
it is just a definition. Every chapter needs its definitions.

The dangerous direction has its own criterion,
`q-usage-archimedean-in-categorical-chapter`, which reports 8 — a plausible rate.

## Fix + result

Added `symbolic` and `generic-R` to the twelve archimedean chapter sets.
Categorical sets untouched (verified individually).

    729 warns -> 82.   694 mismatch -> 47.   8 fails unchanged.

The 47 survivors are the right shape: spread across 13 chapters (max 7), and
every one detects a SPECIALISED regime where it is not expected —
`root-of-unity` x29, `real-positive`, `real-gt-1`, `mod-gt-1`, `fixed-q0`.
E.g. `real-positive` and `root-of-unity` blocks inside `appendix-surreals`,
a categorical chapter. That is the signal the criterion exists for.

## This is a RECURRING failure mode for this criterion

`scripts/tests/qa-checkers-q-usage.test.ts` already exists to fix an EARLIER
false-positive in the same criterion, in the same archimedean chapters (a
`\bq\b` na-guard matching `-q-` inside kebab-case labels). Hence a test
pinning the invariant rather than trusting the table:
`scripts/tests/q-usage-chapter-regimes.test.ts` (4 tests) asserts every chapter
accepts the substrate regimes, archimedean chapters still expect
`real-positive` + `fixed-q0` (the fix did not become "anything goes"), and
categorical chapters still reject `fixed-q0`.

## Still open — NOT mine to decide

- **The 8 fails.** All `archimedean-in-categorical-chapter`. Note 5 of the 6
  in `appendix-surreals` cite the SAME file and line
  (`QOU/AppendixSurreals/Conjectures.lean:105`), so it is ~4 distinct sites,
  not 8. The other two: `CoxeterGeometricRepresentationFull.lean:89` and a
  MeV/CODATA reference in `meson-em-sinh-closed-form.md:21`. Each is a
  §7c placement call for the owner.
- **The 47 surviving mismatches** — each is "move it, or tag it as a declared
  specialisation". Editorial.
- **`CHAPTER_EXPECTED_REGIMES` is qou-specific configuration hardcoded in the
  PLATFORM.** Forty qou chapter names live in `qa-checkers-q-usage.ts`. Same
  class as the hardcoded paper name (1b82747) and `qou-paper-builder`
  (bc8937a) — it belongs in folio config, not platform code. Any second folio
  gets `n/a` for every block, silently.
