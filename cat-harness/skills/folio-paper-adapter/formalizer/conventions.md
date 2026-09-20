---
part-of: formalizer
description: >
  Detail for `formalizer`, split out of it so the parent stays a short entry
  point. NOT a skill of its own — reached through the parent.
---

# formalizer — Lean conventions that constrain what you may write

The base ring rule, import ordering, and library synthesis. Read before
writing a declaration; getting these wrong produces Lean that compiles and
says the wrong thing.

## Base ring convention — generic `R` vs archimedean `ℝ` (STRICT)

Per **the project authoring conventions**: every Lean declaration that holds in a generic
commutative ring must be stated over a **type variable**, never silently
specialised to `ℝ`. The archimedean wall is the structural cut:

* **Stay generic** (`{R : Type*} [CommRing R]` / `[Field R]` /
  `[GroupWithZero R]`): categorical content, algebraic identities,
  structural representation-theory data, content/hook arithmetic over `ℤ`
  exponents (`Q ^ (someSum λ)`), anything whose *statement* only uses
  ring / field operations.
* **Specialise to `ℝ`** only when the declaration genuinely needs
  `Real.sqrt`, `Real.rpow`, `Real.cos`, `Real.exp`, `Real.log`, an
  ordering predicate (`0 < q`, `q < 1`), `linarith` / `positivity` /
  `nlinarith`, or an experimental / external numerical literal.

**Default to generic at point of authoring.** Generic → `ℝ`
specialisation is cheap (drop the parameter); `ℝ` → generic refactor
is much harder once downstream code accretes archimedean assumptions
silently. When in doubt, start generic.

### Pre-commit base-ring GATE (STRICT — "it compiles" is NOT the gate)

`lake build` / `lean`-direct passing says **nothing** about §7c — a
gratuitous `(q : ℝ)` compiles fine.

> **Quickest path — run `scripts/check-sidecars.sh` (no longer in this repository)
> on your changed files.** It maps each changed file to the QA sidecar
> criteria that apply (`q-usage-*`, `wall-side-correct`, one-voice, …)
> and runs the §7c base-ring check on standalone library Lean that has
> no sidecar. **This is an agent-owned MANUAL pre-commit gate; CI is a
> *backup*, not the primary check** — agents run the relevant checks for
> their own PRs by hand; CI catches only what the agent missed.

**Before committing any new or edited `.lean`, run the base-ring pass:**

1. **Per-declaration triage (always, by hand).** For EACH declaration
   ask: *does the **statement** (not the proof) use an archimedean
   construct* — `Real.*`, an ordering (`0 < q`, `<`),
   `linarith`/`positivity`/`nlinarith`/`norm_num`, or a numeric
   literal? **No → it MUST be over generic `{R} [CommRing R]` /
   `[Field R]`, not `ℝ`.** A `det = 1`, a ring/field identity, a
   bar-symmetry `q ↦ q⁻¹` are all generic; only the
   ordering/`Real.*`/numeric piece is `ℝ`. **The classic miss:** stating
   an algebraic `q`-identity over `ℝ` because it will *later* be
   evaluated at some `q₀ ∈ ℝ` — the fibre-level statement is generic
   (`ℚ(q)` / `ℤ[q,q⁻¹]`); only the evaluation is archimedean.
2. **Run the mechanical checker** on touched **content-block** Lean:
   `bun run content/pipeline/q-usage-audit.ts --no-write` (q-regime +
   `q-usage-archimedean-in-categorical-chapter`) and the
   `wall-side-correct` checker (`checkWallSide` flags `: ℝ`, `(ℝ)`,
   `linarith`, `positivity`, `norm_num`, `LinearOrderedField`).
3. **Library files are NOT auto-swept — step 1 is the only gate they
   get.** The q-usage / wall-side checkers run per content-block
   (`<block>.qa.json`). A standalone library file with no `.ts`/`.md`
   sibling has no sidecar and escapes the sweep, so you MUST run the
   per-declaration triage by hand for those.

Skipping this gate is how a gratuitous `(q : ℝ)` / `SL₂(ℝ)` lands on a
purely-algebraic statement (a `det = 1` is `CommRing`-universal; a
bar-even `[2]_q` identity holds over any field; only an ordering like
`τ > 2` is genuinely `ℝ`). The gate above catches it at authoring time.

Concrete cheat-sheet:

| Construction | Typeclass | Example |
|--------------|-----------|---------|
| Polynomial identity | `[CommRing R]` | `theorem foo (x : R) : (x + 1)^2 = x^2 + 2*x + 1` |
| Inverse / `x⁻¹` | `[Field R]` / `[GroupWithZero R]` | `def bar (Q : R) := 1 / (1 - Q)` |
| Negative `ℤ` powers | `[GroupWithZero R]` | `Q ^ (someSum λ)` where `someSum λ : ℤ` |
| Square root / radical | `ℝ` | `noncomputable def myRadical (q : ℝ) := …` |
| Ordering / `linarith` | `ℝ` (or `[LinearOrderedField R]`) | `theorem bar_inv (q : ℝ) (hq : 0 < q)` |
| `Real.cos`, `Real.exp` | `ℝ` | `Real.cos (α - b * c^2 / 2)` |
| Experimental / external | `ℝ` | `noncomputable def measured_const_MeV : ℝ := 938.272` |

The narrative `.md` side mirrors this: `q ∈ R` in the algebraic
discussion, `q ∈ ℝ` only when the archimedean evaluation is needed.

### Wall-side QA checker — tactic constraints

The `wall-side-correct` QA checker (`content/pipeline/qa-checkers-voice.ts`,
`checkWallSide`) enforces this convention mechanically. It **strips `/- -/`
+ `--` comments and `import` lines**, then scans the *code body* for
archimedean markers — `Real.sqrt|rpow|log|exp|cos|sin|pi`, `linarith`,
`positivity`, `nlinarith`, **`norm_num`**, `: ℝ`, `(ℝ)`,
`LinearOrderedField` — and for generic markers (`CommRing`,
`{R : Type*}`). Practical consequences when authoring/refactoring:

* **`norm_num` counts as archimedean** even on a concrete `ℕ`/`ℤ` fact.
  In a generic-`R` (or otherwise wall-clean) file, prove concrete numeric
  goals with **`decide`** (`(-1:ℤ)^4 = 1`, `(3:ℕ)*4 = 2+4+6`), ring/field
  identities with **`ring`** / **`linear_combination`** / **`field_simp`**
  — never `linarith`/`norm_num`/`positivity`. `decide` also needs no
  Mathlib import, so it survives in import-light files. Caveat: `decide`
  does **not** reduce `Ne` over `ℚ` (`Rat` kernel reduction) — for
  concrete `ℚ` facts you need a non-`norm_num` route or a different ring.
* **A file with BOTH archimedean and generic markers fails** ("split into
  two files per §7c"); a `.md` banner does **not** clear this mixed mode.
  Make the file one-sided, or split the archimedean specialisation into a
  separate file that consumes the generic result via `(R := ℝ)`.
* **A purely-archimedean file passes** iff its `.md` acknowledges the
  specialisation (any of: "archimedean", "over ℝ", "specialise",
  "numerical evaluation", "experimental").
* Comments/imports are stripped, so an `ℝ` in a docstring or a
  `Mathlib.Data.Real.*` import is harmless — **only the code body counts**.

Verification caveat: a sandbox olean cache is seeded from a specific
import cone. Files importing modules outside that cone hit *missing-olean*
errors (not real proof failures) until a fuller cache is seeded. Pick
in-cone imports when you need to verify a refactor in the sandbox.

**Extending the cone.** To verify a refactor that needs an out-of-cone
module, build *that module* incrementally with `lake build
Mathlib.<Module.Path>` (e.g. `lake build
Mathlib.LinearAlgebra.Matrix.Trace`). It compiles only the uncached deps
from the materialised source and writes the olean into `.lake` — safe,
fast, no wipe. This is the supported way to grow the cache
module-by-module. Do **NOT** use `lake env true` / `lake update` / `lake
exe cache get` for this — those re-resolve the manifest and can wipe the
restored oleans. Whole `Mathlib.Tactic` is the one practical exception:
it pulls in most of Mathlib, so narrow `import Mathlib.Tactic` to the
specific tactic modules (`Tactic.Ring`, `Tactic.FieldSimp`, …).

## CRITICAL: Imports before doc blocks (Lean 4.24+)

All `import` statements **must** come before `/-! ... -/` module
docstrings. Lean 4.24+ rejects files that place the doc block first.
See `lean-generation.md` for the correct template and a bulk
import-order repair script.

## Library Synthesis Rules

Based on the glossary types, import the correct Mathlib modules:

| Glossary Type             | Required Mathlib Import                              |
|---------------------------|------------------------------------------------------|
| `TopologicalSpace`        | `Mathlib.Topology.Basic`                             |
| `SmoothManifold`          | `Mathlib.Geometry.Manifold.SmoothManifoldWithCorners`|
| `Category`                | `Mathlib.CategoryTheory.Category.Basic`              |
| `MonoidalCategory`        | `Mathlib.CategoryTheory.Monoidal.Basic`              |
| `Functor`                 | `Mathlib.CategoryTheory.Functor.Basic`               |
| `NatTrans`                | `Mathlib.CategoryTheory.NatTrans`                    |
| `Limits.IsLimit`          | `Mathlib.CategoryTheory.Limits.IsLimit`              |
| `Group`                   | `Mathlib.Algebra.Group.Basic`                        |
| `Ring`                    | `Mathlib.Algebra.Ring.Basic`                         |
| `Module`                  | `Mathlib.Algebra.Module.Basic`                       |
| `FundamentalGroupoid`     | `Mathlib.Topology.AlgebraicTopology.FundamentalGroupoid` |
| `ModuleCat`               | `Mathlib.Algebra.Category.ModuleCat`                 |

