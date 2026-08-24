---
# folio-assistant-ilbh
title: Vacuity detector sees constant data only — it misses definitional laundering
status: todo
type: bug
priority: normal
created_at: 2026-08-24T19:37:43Z
updated_at: 2026-08-24T19:37:43Z
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
