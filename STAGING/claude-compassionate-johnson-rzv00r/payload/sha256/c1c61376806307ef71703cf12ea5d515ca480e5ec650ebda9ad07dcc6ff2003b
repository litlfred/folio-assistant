---
# folio-assistant-f6r1
title: 'TRANSLATION CATALOGUES: 19 of 27 are provably not derivable, 8 undetermined — and the roundtrip test that says otherwise fails on known-good catalogues'
status: completed
type: bug
priority: normal
created_at: 2026-09-26T09:59:36Z
updated_at: 2026-09-26T10:42:14Z
parent: folio-assistant-bzyu
---


Asked whether `main`'s 27 uncatalogued translations could be resolved by
DERIVING their `.po` catalogues, rather than by recording their absence (which
the owner ruled out, bean `ngxj`) or by fresh authoring.

**Answer: 19 provably not, 8 undetermined, 0 demonstrated derivable.** The
undetermined 8 are undetermined *because the test that would decide them is
invalid* — see below. Three states, and the third is not a failure.

## The idea, and why it was worth testing

`UNCATALOGED`'s docstring says a catalogue "cannot be derived from a finished
translation without inventing the segmentation". The segmentation objection is
answerable: `pot-extract.ts` DEFINES the segmentation, canonically, and applying
it to source and translation alike invents nothing. So the test was: extract
both, pair positionally, and check.

## What is measured, on `main` at `74f27e4c7f`

| verdict | n | basis |
|---|---|---|
| **count mismatch** | **18** | source and translation yield different segment counts |
| **needs `msgctxt`** | **1** | `ru/getting-started` — a repeated source msgid whose two occurrences are translated DIFFERENTLY, which a msgid-keyed `.po` cannot represent |
| **undetermined** | **8** | the roundtrip check fails on them, and it fails on known-good catalogues too |

The count mismatches are not rounding. `zh/content-types` 117 -> 95,
`zh/accessibility` 130 -> 111, `zh/getting-started` 165 -> 147. Around twenty
source segments have no counterpart, so deriving would mean DECIDING which
segments went untranslated and which were merged. That is authoring judgement,
and it is the docstring's point reached by a different route: not that the
segmentation is unavailable, but that **these translations are not segment-wise
images of their sources at all**.

## The control that invalidated my own test, and the correction it forces

The roundtrip check was: inject the derived catalogue into the source, re-extract,
and require the segments to equal the published translation's. Run against the
**8 catalogues that already exist and are accepted**, it fails on every one:

    ar/index               back=44  published=43   (po entries=37)
    es/index               back=44  published=44   (sequences differ)
    zh/index               back=42  published=39
    ar/agent-onboarding    back=75  published=85
    fr/agent-onboarding    back=75  published=63   (po entries=18)
    ru/agent-onboarding    back=74  published=83

So identity does not hold for catalogues that are not in question, which makes
the criterion useless as a test of a catalogue's correctness. `injectMarkdown`
collapses a multi-line paragraph onto its first line and blanks the
continuations, so re-extraction legitimately re-segments.

**Three of my own earlier claims were wrong and are corrected here**, because a
wrong measurement recorded confidently is worse than none:

1. "0 of 27 derivable" — the true answer is 19 not-derivable, 8 undetermined.
   Reporting 0 stated a determined negative over cases nothing had decided.
2. "duplicate msgids block 8 of them" — duplicates are mostly BENIGN. Where
   counts allow the comparison, repeated msgids are translated identically in
   every case but one, so a msgid-keyed `.po` represents them fine. Only
   `ru/getting-started` genuinely needs `msgctxt`.
3. "`content-types` repeats 15 of its 117 cleaned strings" — 15 is the excess
   OCCURRENCE count. It has **6** distinct repeated msgids.

## Corroboration, not a new finding

`fr/agent-onboarding.po` carries **18** entries against an 85-segment source.
That is bean `07p7`, "the fr catalogues are stale on main", reproduced
independently by this control rather than read from its body.

## What would actually resolve the 27

Per-segment authoring: `.pot` templates extracted from the sources (mechanical,
`pot-extract` already does it) handed to the `t8g3` campaign, which is the
owner's standing decision. Derivation is not a shortcut to it, and this bean is
the evidence rather than the assertion `tbdg` had to make.

## Done when

- [x] the derivation attempted and measured, not argued
- [x] the invalidating control run against known-good catalogues
- [x] my three wrong claims corrected in the same place they were made
- [x] the 8 undetermined recorded as undetermined, never as failures
- [ ] a VALID correctness test for a catalogue — needs a comparison that
      tolerates re-segmentation; not attempted here, and no claim is made that
      one is easy
- [ ] the catalogues themselves — the `t8g3` campaign's, under `bzyu`

## Summary of Changes

No code and no catalogues. One measurement, its control, and three corrections
to earlier claims of mine. `UNCATALOGED` untouched.


## 2026-09-26, from another session — the headline number is SUPERSEDED, and the `msgctxt` finding CORRECTED my tool

Read on merging `origin/main` into `claude/wonderful-gauss-7frcrw` (PR #1369),
which was working the same question in parallel. Recorded here rather than only
there, because a reader who finds this bean first would otherwise take
*"0 demonstrated derivable"* as settled.

### "0 demonstrated derivable" no longer holds — 10 are derived

Measured on that branch: **10 of 25 derived**, 15 refused, and the gate's findings
go 25 → 15 with no new drift on the ten. Spot-checked against Arabic.

**This bean was not wrong when written.** It measured `main` at `74f27e4c7f`, and on
that tree the answer really was 7 derivable at best — I measured 7 there myself
before changing anything. What moved the number was fixing the extractor, not
re-reading the corpus:

- **`6b8u`** — `MD_MIN_TEXT_LEN` was a minimum in CHARACTERS, so translatability
  was a property of the locale's script. Now a letter count.
- **`ig4a`** — a code fence was only recognised at column 0, so an indented fence
  inside a list item was extracted as prose.

So this bean's own framing is the one that survives, and is sharper than its
count: *"these translations are not segment-wise images of their sources at all."*
Correct — and for **most** of them the reason was in `pot-extract.ts` rather than
in the translations. Bean `lvk9` (list items and blockquotes extracted PER LINE, so
a msgid depends on the author's hard wrap) takes alignment to 17/25 and is the
largest single cause.

### The `msgctxt` finding is the valuable half, and it corrected my code

This bean's row *"needs `msgctxt`: `ru/getting-started` — a repeated source msgid
whose two occurrences are translated DIFFERENTLY"* names a defect in
`derive-po.ts` that I had written and documented without noticing. My
`formatDerivedPo` deduped by msgid, *"keeping the FIRST translation seen"*, with a
comment explaining that it did — a description of the behaviour that never asked
whether it was lossy. It is: a `.po` is keyed by msgid, so keeping one of two
different translations discards a real difference and the file is well-formed and
wrong.

**No wrong catalogue shipped** — checked across all 10, 0 conflicting duplicates.
That is luck rather than design: `ru/getting-started` is refused for
`count-differs` today, so the collision never had the chance, and `lvk9` would
align that pair and activate it.

Fixed: `conflictingDuplicate` now REFUSES the pair with a `msgid-conflict` reason
naming both translations and pointing at `msgctxt`, rather than silently choosing.
A duplicate translated identically stays benign, which is the common case. Three
tests, including an anti-vacuity floor over the real corpus.

### Its self-invalidating control is also evidence for `lvk9`

This bean's roundtrip check failed on known-good catalogues because
*"`injectMarkdown` collapses a multi-line paragraph onto its first line and blanks
the continuations, so re-extraction legitimately re-segments."* That is the same
hard-wrap sensitivity from the injecting side, and it is worth carrying into `lvk9`:
a fix that makes a msgid survive a re-wrap on the extract side should be checked
against the inject side too, or the round trip stays non-identical for a new reason.

Left `completed`. Nothing here reopens it — its measurement was honest on the tree
it measured, and the parts that still stand are noted above.
