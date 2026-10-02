---
# folio-assistant-ilbh
title: Vacuity detector sees constant data only — it misses definitional laundering
status: completed
type: bug
priority: normal
created_at: 2026-08-24T19:37:43Z
updated_at: 2026-08-24T21:03:03Z
---

`content/pipeline/qa-checkers-vacuity.ts` — `checkNoVacuousInstanceData`.

## The measurement that exposed it

A hand-read pass over the qou corpus on 2026-08-24 produced **8** vacuity
findings. Running the detector over the same corpus the same day produced **25**
hits. The overlap is **zero**. Both lists are real; they are different defects.

The detector's model is stated in its own docstring and is *constant data*:

```ts
const DEGENERATE_VALUE =
  /^(?:0|1|_|T|0|PUnit\.unit|Unit\.unit|\(\)|default|True|trivial|Nat\.zero|List\.nil|\[\]|Finset\.empty|Classical\.arbitrary\b.*)$/;
```

A field is degenerate only if its value is *literally* one of those tokens.

## The shape it misses: definitional laundering

The data field is a real, non-constant expression — and is still chosen so the
propositional field closes by `rfl`. Five of the eight findings are this:

| decl | data field | why the detector passes it |
|---|---|---|
| `BraidKnot/CrystalRMatrixSubLemma.lean:188 canonical` | `poleIndicator := fun rho => decide (rho <= -1)` | not a degenerate token; fields are in a tactic `exact { ... }`, not a `where` |
| `Archimedean/BorromeanQuark.lean:124 canonical` | `topological_mass := fun q => borromean_volume / (1 - 1/q)^2` | the value *is* the claim's RHS, verbatim |
| `Mathlib/ArchimedeanRealization.lean:120 canonical` | `q0 := q_zero` | a named constant, not a literal |
| `MassTheory/CableWidthBraneTowerLift.lean:73 colorRule` | `w := fun _ => cableWidthColor` | ditto — constant *behind a name* |
| `Machinery/KashiwaraCrystalBasic.lean:215 instSl2DemazureSubcrystal` | `member := fun _ => True` | `True` is in the token list; `fun _ => True` is not |

The last row is the cheapest fix and the most telling: the regex is anchored
`^...$`, so a constant hidden behind one lambda defeats it. So does a constant
hidden behind one `def`.

## Three separable improvements, cheapest first

1. **Unwrap trivial lambdas.** Match `fun _ => <degenerate>` (any arity of
   wildcards) as degenerate. One-line regex change; catches
   `instSl2DemazureSubcrystal` and `colorRule`-style fields directly.
2. **Resolve module-local constants one hop.** `q0 := q_zero` where
   `def q_zero : R := ...` — a name whose definition is a literal is as
   degenerate as the literal. Bounded: one hop, same file, no import following.
3. **Definitional laundering proper** — data field's RHS is syntactically the
   expression the Prop field compares against. This is the real prize and the
   hardest: it needs the class *declaration* as well as the instance body, so
   the checker has to read the `class ... where` block that the instance
   inhabits. Worth scoping before building.

## Do not treat the count as the finding

The corpus-wide number moved 26 -> 25 in a day under an unrelated agent's
demotions, and neither number is the population of the defect. Report what a
read confirms, not what the checker totals.

## Consumers

qou beans `qou-09mr` (CrystalRMatrixSubLemma), `qou-7nbx` (ArchimedeanRealizationFunctor),
`qou-2y13` (SubstrateWidthRule), `qou-uno5` (instSl2DemazureSubcrystal),
`qou-znut` (BorromeanQuark) each record that this detector will NOT
regress-guard their fix.


---

## Closed 2026-08-24 on `claude/gracious-dijkstra-0ijp2l`

New criterion **`lean-no-definitional-laundering`** in
`content/pipeline/qa-checkers-vacuity.ts`, registered in
`qa-criteria-registry.ts` (`automated: true`, `critical`) and wired into
`VACUITY_AUTOMATED_CHECKERS`. `lean-no-vacuous-instance-data` is untouched: its
conjunction is precise and that precision is why it has near-zero false
positives. Its loop body was lifted into `vacuousDataConjunction()` so the new
criterion can *skip* any decl the old one already flags — the two lists stay
disjoint by construction, not by luck. The refactor is proved
behaviour-preserving: HEAD's checker and the refactored one emit identical hit
lists on the same corpus snapshot.

### Three detections, against the bean's three proposals

1. **Argument-ignoring body** — `def F (args…) : Prop := True | False`, after
   discarding `let` bindings whose results are dropped. Catches
   `ToroidalHarmonicODE`, `WeberODE`, and the pre-`opaque` `InTensorSpan`.
   Requires ≥ 1 parameter: an argument-free `def X : Prop := True`
   (`beta3IsLChi4_3`, `qou-35zi`) is `proof-no-trivial-true`'s
   `def-disguised-true`, already in the registry.
2. **Lambda-wrapped constant** — proposal 1, `fun _ … => <degenerate>` beside a
   reflexivity discharge. Catches `instSl2DemazureSubcrystal` (`qou-uno5`) and
   `ClassicalLimitStpart.canonical`.
3. **Definitional identity** — proposal 3, and it did not need scoping to be
   affordable. The class field's *conclusion* (binders stripped, hypotheses
   split off) is matched as `data args = RHS`; the instance's `data` is compared
   to that RHS up to alpha-renaming of its binders. Catches `poleIndicator`
   (`qou-09mr`), `BorromeanQuark` (`qou-znut`), `ArchimedeanRealizationFunctor`
   (`qou-7nbx`), `SubstrateWidthRule` (`qou-2y13`), plus four sites the hand
   pass had not named.

**Proposal 2 (one-hop constant resolution) was NOT built, and should not be.**
Both sites that motivated it — `q0 := q_zero`, `w := fun _ => cableWidthColor` —
turn out to be detection-3 shapes: the named constant *is* the class field's
RHS. Following the name buys nothing they do not already report, and following
it in general fires on every instance that uses a named constant correctly.

### Detection 3 grades `warn`, not `fail`

Pinning a field to a formula and observing the law then holds by `rfl` is a
legitimate way to exhibit a model. Whether the class field was a *constraint*
the instance had to meet or a *definition* it was entitled to make is a question
about what the class was for, and no regex answers it. Those hits say "REVIEW
(not a verdict)" in their own evidence and name the disputing docstring when
there is one — `BorromeanQuark.canonical` argues the identity IS the content.

### Corpus

25 → 26 for the old criterion (sibling-agent churn during the session, not this
change) and **9** for the new one, disjoint. The first sweep returned 26; all
were read and five vetoes came out of the wrong ones, each documented at its
definition: a discharge lambda that names its binders is a proof not a
reflexivity; a decl where some law needed real tactic work is a model doing
work; one real proof among the name-matched claims means the constants are a
corner; a declared inhabitation witness is the prescribed remedy; a `theorem`
exhibiting a record proves an existential.

**Do not quote 9.** Four of the eight hand-audit sites were repaired by a
sibling agent *while this was being written* — `CrystalRMatrixSubLemma`,
`ArchimedeanRealization` and `CableWidthBraneTowerLift` took the
parameterise-the-class remedy, `AlgebraicPrimality` took `opaque`. The criterion
passes every one of the repaired forms, and each repair is pinned as a NEGATIVE
test beside the defect it fixed: a criterion that still fires after its own
prescribed remedy is worse than no criterion.

### Not built, deliberately

- **Semantic constancy** (`w A := 3 * A * 0`). Needs `whnf`. That is the
  elaborator's job and no regex reaches it.
- **Cross-file classes.** Detection 3 needs the `class … where` block, so it
  reads only same-file classes. Resolving imports to guess at one produces a
  confident false report about a decl the checker never read.

Tests: `scripts/tests/qa-checkers-vacuity.test.ts`; suite 810 → 843, 0 fail.
Every fixture is a real qou declaration quoted from the state the hand audit
read it in. Each negative pin was mutation-checked — minimally perturbed into
its positive and confirmed to fire — which is how a nested-`∀` conclusion gap
and an alpha-rename placeholder collision (`y → x` routed through `" 0 "`
rewrites `g 0 y` to `g x x`) were both found.
