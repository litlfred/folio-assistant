---
# folio-assistant-wesu
title: Cycle detection cannot see an interprets leg
status: completed
type: bug
created_at: 2026-08-15T23:40:00Z
updated_at: 2026-08-15T23:40:00Z
---

Asked how the four editorial cycles could be **prevented at author time**. The
answer turned out to be mostly reassuring, with one precise hole.

## The mechanical check already exists, and mostly works

`detangler-no-dependency-cycle` is a real QA criterion with a real
implementation. Run against the six blocks in the four cycles:

| block | before this fix |
|---|---|
| `conj:q-collatz` | **fail** |
| `thm:ns-singularity-descartes` | **fail** |
| `prop:ns-kummer-specialisation` | **fail** |
| `rem:skein-filtration-trichotomy` | **fail** |
| `rem:frobenius-packing-density` | pass |
| `conj:mass-volume-factorization` | pass |

So three of the four cycles are **already flagged** — they are known findings
sitting in the corpus, not undetected ones. Author-time prevention for the
`uses[]`-only case is in place and needs nothing.

## The hole: one cycle it cannot see

`loadChapterGraph` builds `usesGraph` from `uses[]` alone, and `inCyclePath` is
computed from that. So a cycle whose return leg is an `interprets` edge is
invisible:

```
rem:frobenius-packing-density --interprets--> conj:mass-volume-factorization
conj:mass-volume-factorization --uses-------> rem:frobenius-packing-density
```

"Read A before B and B before A" is exactly as circular whichever field carries
the leg. `interprets` became an editorial edge in `i8ad`; the cycle scan did not
follow.

## The fix, and what it deliberately does not touch

A separate `editorialGraph` (`uses[]` + `interprets`) inside `loadChapterGraph`,
used **only** for cycle detection. `usesGraph` is untouched, so
`detangler-no-forward-ref` keeps counting `uses[]` alone.

That separation is the whole design. Merging them would also make the
forward-reference gate count the ten forward-pointing `interprets` edges,
moving it 196 → ~206 — a number five merged PRs were measured against. That is
a **separate** decision and is not smuggled in here.

Verified: cycle-flagged blocks **4 → 6** (all six members now caught), forward
references **196 → 196**.

## Tests

`scripts/tests/editorial-cycle-detection.test.ts`, three of them, asserted
generically against whatever folio is attached rather than against specific
labels — a test that hardcodes content breaks when the content is fixed.

- the checker flags every block the union graph puts on a cycle (**fails**
  against the pre-fix checker — this is the regression)
- it invents none the union graph does not have
- forward-reference hits all name a `uses[]` target, so the gate cannot have
  been widened as a side effect

The last two pass either way by design: they are the guards that keep the fix
from over-reaching, not evidence of the bug.

## What this does not do

It does not resolve the four cycles. Those are editorial: each says a reader
must read A before B and B before A, and choosing which leg to cut is a claim
about what a block is *about*. The checker's job is to stop the fifth one being
written, and now it can.
