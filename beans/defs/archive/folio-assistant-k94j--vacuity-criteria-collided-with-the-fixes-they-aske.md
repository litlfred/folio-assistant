---
# folio-assistant-k94j
title: 'vacuity criteria collided with the fixes they asked for: one false positive, one unclearable fail'
status: completed
type: task
priority: normal
created_at: 2026-08-24T21:15:22Z
updated_at: 2026-08-24T21:15:51Z
---



## What happened (2026-08-24)

Two agents landed inside the same hour. `fa/ilbh` shipped
`lean-no-definitional-laundering` (`d8d586d`, folio-assistant). `qou-09mr/7nbx/
2y13/uno5` repaired four one-model classes (`ca23d591c76`, qou). Neither could
see the other: the checker lives in folio-assistant, the corpus in qou, and the
qou content gate does not run the vacuity criteria. Running the new checker
against the repaired corpus produced two hits, both wrong in different ways.

## 1. `lean-no-vacuous-instance-data` fired on the fix — FIXED

`sl3DemazureLevelOne` (`QOU/Machinery/KashiwaraCrystalBasic.lean:285`) is the
three-vertex crystal written *specifically* to give
`DemazureSubcrystal.demazure_closure` teeth: a proper sub-crystal `{0,1}` whose
closure is checked by exhaustion. The conjunction fired because

- `highest := 0` matched `DEGENERATE_VALUE` — there it is a **vertex index**
- `highest_mem := by decide` matched `TRIVIAL_DISCHARGE` — there it evaluates
  `0 ≠ 2`

and the criterion required only *one* degenerate data field, ignoring the
sibling `member := fun v => v ≠ 2`.

Firing on the declaration written to fix the defect is this criterion's worst
failure mode: it reads as evidence the fix did not take.

**Fix.** A data field that reads a non-wildcard binder it declares vetoes the
conjunction — constant data is the whole mechanism of the defect, so a field
that computes from its arguments cannot be part of it.

**Rejected first.** Reusing the sibling criterion's `doesRealWork` veto looked
like the obvious move and was measured wrong: on the qou corpus it takes the
criterion from **26 hits to 6**, and the 20 it drops are overwhelmingly true
positives — `triv_hecke` survives it on `carrier_addCommGroup := by
infer_instance`, `witnessR5Full_deuterium_placeholder` on a `by simp` carrying
an inline comment. `isSubstantiveDischarge` is calibrated for a population whose
fields are already known non-constant; on this one it is a `by`-detector.
Argument-dependence removes **exactly one** hit and leaves the sibling
criterion's list byte-identical.

## 2. Detection 2 graded `fail` on correct mathematics — FIXED

`instSl2DemazureSubcrystal` has `member := fun _ => True`, and that is the
**value the mathematics forces**: `sl₂` has one simple root, so `B(Λ₁)` has
exactly two Demazure sub-crystals and the level-1 one is the whole two-vertex
crystal. The `qou-uno5` agent established this and rewrote the docstring to
concede the exact vacuity the checker reports — the claim fields carry no force —
while keeping the value.

So the finding is real and there is no edit that clears it. A `critical`
criterion that cannot be satisfied by correct content gets switched off, not
obeyed.

**Fix.** `hard = constant_prop_defs` only. Detection 1
(`def F args : Prop := True`) stays `fail` — a tautology is wrong whatever the
author meant. Detections 2 and 3 grade `warn` and both now open
"REVIEW (not a verdict)", because they turn on the same non-syntactic question:
was the constant forced, or arranged? Detection 3 always said so; detection 2
shipped claiming more than it can know.

Worth noting `ilbh` had already considered this declaration and judged it "a
real finding", writing into `INHABITATION_WITNESS` that *"'genuine' is NOT a
trigger — `instSl2DemazureSubcrystal` calls itself 'a genuine
`DemazureSubcrystal`' and is a real finding."* That was correct against the
docstring it read, which asserted closure had been checked. `qou-uno5` replaced
that docstring with one that concedes it. The veto comment is now describing a
file that no longer says what it quotes.

## Still open — the coordination gap, not the two bugs

The qou content gate does not run the vacuity criteria, so nothing in either
repo's CI would have caught this. Both defects were found by hand, by running
the checker against the corpus after the fact. Until the criteria run over the
Lean tree on a gate, "the checker agrees with the corpus" is an assertion
someone has to re-establish by hand every time either side moves.
