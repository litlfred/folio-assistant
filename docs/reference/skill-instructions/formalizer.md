---
layout: default
title: Lean 4 Formalizer (Narrative to Proof)
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/formalizer.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/formalizer.md) — do not edit here.

{% raw %}
# Lean 4 Formalizer (Narrative to Proof)

## Heavy-proof discipline (MANDATORY)

When formalising a content block, **every Lean theorem you add MUST
have a matching `**Proof.**` narrative block in the sibling `.md`
file**. The narrative proof is not optional — it is the
authoritative human-readable form of the result.

Required structure in the `.md` for every Lean theorem `foo`:

```markdown
**Proposition (Lean: `foo`).** Statement of the theorem.
*Proof.* Brief narrative — one paragraph for typical algebraic
identities, two or three for inductive or case-analysis proofs.
Cite the Mathlib lemmas / structural moves used so a reader can
follow the Lean proof line-by-line. End with $\square$ or □.
```

The narrative proof should:

- State the theorem in math notation (not Lean syntax) + name the
  Lean theorem with `(Lean: \`name\`)` so navigation is explicit.
- Sketch the key idea in 1–3 sentences for trivial / algebraic
  cases; expand for inductions / case-splits.
- Cite the structural moves: Mathlib lemma names, induction
  variable, key field identities (`field_simp`, `ring`, etc.).
- Match the Lean proof's structure — if the Lean uses induction
  on `n`, the narrative explains the base case + step.

**Anti-pattern**: writing a Lean theorem with no `.md` counterpart,
or with only a one-line "see Lean" stub. Both leave the paper
narrative incomplete and force readers to read Lean to understand
the math. The `.md` must stand on its own as a math reading.

When generating Lean theorems, ALWAYS edit the `.md` in the same
diff to add the narrative proof. Don't split into separate
commits — Lean and narrative must move together.

## Overview

This skill translates the **logical skeleton** of the paper into Lean 4
tactic blocks.  It depends on the Ontologist skill having already produced
a resolved glossary — every term used in theorems must have a unique type
assignment before formalization can proceed.

### Pre-flight: rebase + lean-ref migration

Before authoring or editing `.lean` siblings, the working branch must
be on the current `lean.ref` URI shape.  If the branch was rebased
or merged from upstream, run the idempotent migration **first**:

```bash
cd content && bun run migrate-lean-refs
```

When authoring the `.ts` manifest for a new block, set
`lean: { ref: "<pkg>:<Decl>" }` (never the legacy `decl:` / `file:`
shape).  Use `<pkg>` from `LEAN_PACKAGES` in
`folio-assistant/schemas/lean-packages.ts`.  See the project authoring conventions for the
URI grammar and §0b for the rebase workflow.

## When to Use This Skill

- After the Ontologist has produced `glossary.json` and `Glossary.lean`
- When translating theorem statements from LaTeX to Lean
- When filling `sorry` placeholders with actual proofs
- When `lake build` succeeds but there are remaining `sorry` warnings

## Lean MCP Tools (paper-assistant)

When the MCP server is available, **prefer MCP tools over shell commands**:

| Old workflow | MCP tool | Why better |
|-------------|----------|-----------|
| `lake build` + parse output | `lean_diagnostic_messages` | Structured errors per file, no parsing |
| Export proof state via script | `lean_goal` | Live goal state at any line/column, no scripting |
| Grepping Mathlib for lemmas | `lean_leansearch` / `lean_loogle` | Natural language + type-signature search across all of Mathlib |
| Guessing tactics one at a time | `lean_multi_attempt` | Try multiple tactics at a sorry position in one call |
| Manual `exact?` / `apply?` | `lean_completions` | Auto-complete with context-aware suggestions |
| Reading Mathlib source for docs | `lean_hover_info` | Hover docs for any symbol inline |
| Manual `Try this` checking | `lean_code_actions` | Get resolved edits from "Try This" suggestions |

### MCP-first tactic workflow

When filling a `sorry`:

1. **`lean_goal`** at the sorry position → read the goal state
2. **`lean_multi_attempt`** with candidate tactics from the tactic table → try all at once
3. If no tactic works, **`lean_leansearch`** with the goal in natural language
4. If leansearch finds a close match, **`lean_loogle`** with the type signature
5. **`lean_code_actions`** on the line → check for "Try This" suggestions
6. After editing, **`lean_diagnostic_messages`** → verify no new errors

### MCP-enhanced library synthesis

Instead of a script for import synthesis:
1. Write the theorem stub with a `sorry` body
2. **`lean_diagnostic_messages`** → see "unknown identifier" errors
3. **`lean_leansearch`** for each unknown identifier → find the right import
4. **`lean_completions`** at the import line → auto-complete module paths

## Important: Generation is agent-only

The scripts below are **proof-writing tools**. They create or modify Lean
files. They must only be run when the author has requested formalization.

- **Do not** run them during setup, session start, or routine builds.
- **`lake build`** = compile-only. Never precede it with generation scripts.
- CI workflows run them automatically — that is CI-only behavior.

## Workflow (invoke only on author request)

### 1. Library synthesis

The Formalizer identifies required Mathlib imports from the glossary
(reads `glossary.json` and produces the import block for each chapter
file). Prefer the MCP-driven flow above; a project may also wire a
generation script for this step.

### 2. Generate theorem stubs

Create Lean theorem declarations with `sorry` bodies, using the glossary
types for the statement signatures.

**Witnessed values in narrative.**  Whenever the narrative statement
of a theorem, lemma, proposition, conjecture, corollary, or its proof
quotes a computation-derived numerical literal, the **`.md`
narrative** must use the `:val[name]` directive — not a hard-coded
number — so the rendered statement tracks the canonical witness JSON.
The `.lean` file is unaffected (Lean uses its own numerical
constants); the rule is about the LaTeX render of the narrative
sibling.

### 3. Tactic translation

The Formalizer maps narrative proof phrases to Lean tactics:

| Narrative Phrase                    | Primary Tactic          | Fallbacks                       |
|-------------------------------------|-------------------------|---------------------------------|
| "By calculation"                    | `ring`                  | `field_simp`, `polyrith`        |
| "Clearly follows from..."          | `aesop`                 | `linarith`, `omega`             |
| "By induction on n..."             | `induction n with`      | `cases n`                       |
| "By the universal property of..."  | `Limits.IsLimit.lift`   | `Limits.IsLimit.hom_ext`        |
| "Diagram commutes" / "naturality"  | `aesop_cat`             | `slice_lhs`, `slice_rhs`        |
| "By contradiction"                 | `by_contra`             | `exfalso`                       |
| "By definition"                    | `rfl`                   | `unfold`, `simp only`           |

### 4. The "Sorry" Bridge

When a narrative step is too complex for immediate formalization:

1. Extract the logical structure of the proof
2. Create a `lemma` for each non-trivial step
3. Fill each lemma body with `sorry`
4. **Add a `-- Ref: [key] url` comment** before each `sorry` linking
   to the foundational reference that would resolve the gap
5. Ensure the file remains syntactically correct
6. Use direct grep for sorry counts rather than trusting any generated
   `proof-objects.json` artefact — extractors that read generated
   LaTeX artefacts can silently produce 0 objects.

```lean
/-- Intermediate step: a sub-result of the main theorem.
    TODO: formalize using the cited structure. -/
lemma my_substep (A : MyStructure) :
    MyHypothesis A → MyConclusion A := by
  -- Ref: [author2004] https://doi.org/10.xxxx/xxxxx
  sorry
```

**Rule**: Every `sorry` must have a `-- Ref:` annotation.  The `key`
must match a citation key in `content/schema/references.ts` exactly (case-sensitive).
(`references.bib` is auto-generated from this file — never edit `.bib` directly.)  If no
published reference exists, use `[manuscript]` and cite the chapter/section.
This is enforced by the axiom report's Theoretical Gap Report.

**Conditional-class carve-out.** Class-body sorries are NOT missing
proofs — they are conjectural inputs per the project authoring conventions-cond, permanent
by design. Before adding a `-- Ref:` to a `sorry`, check whether you are
inside a `class` body — if yes, the `sorry` is the conjectural
axiomatisation and no external citation is required (the conjecture
itself IS the reference). Only `theorem | lemma | def | instance` body
sorries need `-- Ref:`. Maintain a catalogue of class-body sorries so a
sweep can distinguish them from missing proofs (correct the `\bsorry\b`
regex to `\bsorry\b(?!-)` so the docstring phrase `sorry-free` is not
counted).

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

> **Quickest path — run [`scripts/check-sidecars.sh`](../../../scripts/check-sidecars.sh)
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

## Proof State Export

**Preferred (MCP):** Use `lean_goal` with the file path and line/column of the
sorry position. Returns structured goal state directly — no scripting needed.

## Integration with Ontologist

1. **Before formalization**: Ontologist runs, produces resolved `glossary.json`
2. **During formalization**: Formalizer checks every term against the glossary
3. **On type mismatch**: Formalizer reports back to Ontologist for re-evaluation
4. **After `lake build`**: If build fails, Ontologist re-scans for type conflicts

## Lean Output Structure

The Lean source tree lives **per paper** under `content/<paper>/lean/`,
with the repo's root `/lakefile.toml` aggregating every package into a
single Lake workspace. See [Root Lake workspace
(standardized)](#root-lake-workspace-standardized) below for the
canonical layout, package registry, and build commands. Do **not**
create a top-level `lean/` directory — that layout is deprecated.

## Proven Patterns

### Existence Constructors for Structure Definitions

Every `structure` definition must have at least one **existence constructor**
— a `def` or `noncomputable def` that builds an instance of the structure
from its prerequisites. Without this, downstream theorems depend on
structures that may be vacuously satisfiable.

**Pattern**: The constructor takes upstream structures as parameters and
returns the target structure. The type signature makes the dependency
chain explicit — the type checker enforces it.

```lean
-- Definition: declares WHAT the structure looks like
structure WeightDecomposition (C : Type u) [Category.{v} C]
    [MonoidalCategory C] [Preadditive C] where
  forms : C
  proj_H : forms ⟶ forms
  proj_V : forms ⟶ forms
  complementary : proj_H + proj_V = 𝟙 forms
  ...

-- Existence constructor: proves THAT it can be built
noncomputable def WeightDecomposition.ofMaximalTorus
    {C : Type u} [Category.{v} C] [MonoidalCategory C] [Preadditive C]
    (mt : MaximalTorus C) (forms : C) : WeightDecomposition C :=
  { forms := forms
    proj_H := sorry  -- Ref: [author1993] ...
    proj_V := sorry  -- Ref: [author1993] ...
    complementary := sorry  -- Ref: [author1993] ...
    ... }
```

**Naming convention**: `StructureName.ofPrerequisite`.

**When to use each variant**:

| Situation | Pattern | Example |
|-----------|---------|---------|
| Concrete construction (no sorry) | Direct `def` | `MyParameter.ofConstant c hpos hge hroot` |
| Construction from upstream structures | `noncomputable def` with sorry | `CategoricalReeb.ofWeightDecomposition mt wd` |
| Canonical/unique choice | `instance : Inhabited T` | `instance : Inhabited (MyParameter ℝ)` |
| Auto-resolved by typeclass | `class` + `instance` | `class HasMyParameter M` |

**Content object requirements**: Each existence constructor gets its own
content block triple (`.ts` + `.md` + `.lean`):
- Block kind: `theorem` (label: `thm:<name>-exists`)
- `uses[]`: must list the definition it constructs AND its immediate prerequisite (the structure it's built from) — not the full transitive chain
- `.lean`: the constructor function, with sorry-annotated fields citing references

**Dependency graph rule**: If definition B's `.lean` `structure` takes a
parameter of type A (another project structure), there MUST exist a
`thm:<b>-exists` block whose `uses[]` includes `def:b` (and `def:a`
only if A is an **immediate** prerequisite of the existence theorem,
not already reachable via `def:b`'s own `uses[]`). The `uses[]` field
lists only direct neighbors — transitive deps are walked by the graph.

**Checklist for every `structure` definition**:
- [ ] At least one `.ofFoo` constructor exists in a sibling `.lean` file
- [ ] A `thm:*-exists` content block triple references it
- [ ] The constructor's parameters include all upstream structures
- [ ] Each `sorry` in the constructor has a `-- Ref:` annotation
- [ ] The chapter manifest places the existence theorem after the definition

### Subsingleton as Categorical Vanishing

Use `Subsingleton` to model vanishing conditions (e.g., a cohomology group
equals 0) without requiring `Preadditive` or `AddCommGroup` structure:

```lean
/-- All morphisms 𝟙 → Ad(A) are equal ⟺ Hom(𝟙, Ad(A)) = 0. -/
adjoint_vanishing : Subsingleton ((𝟙_ C) ⟶ adjointObj)

/-- All global adjoint sections are equal ⟺ H⁰(M, Ad(P)) = 0. -/
adjoint_cohomology_vanishes : Subsingleton adjointSections
```

**Why**: In a `k`-linear category, the zero morphism always exists, so
`Subsingleton` implies the only morphism is zero — equivalent to the hom-space
vanishing.  This avoids importing `Preadditive` just for a vanishing axiom.

### Irreducibility via Subsingleton Propagation

Prove irreducibility by propagating `Subsingleton` through an injective map.
**Pattern**: Given `Subsingleton Y` and `f : X → Y` injective, conclude
`Subsingleton X` by `⟨fun a b => h_inj (inst.allEq _ _)⟩`.

### Coevaluation + Snake Identities for Exact Self-Pairing

Model non-degeneracy of a bilinear form as a categorical self-duality
(exact pairing) using coevaluation and snake identities:

```lean
coevaluation : (𝟙_ C) ⟶ (obj ⊗ obj)
pairing_snake_left :
  (ρ_ obj).inv ≫ (obj ◁ coevaluation) ≫ (α_ obj obj obj).inv ≫
    ((mul ≫ form) ▷ obj) ≫ (λ_ obj).hom = 𝟙 obj
pairing_snake_right :
  (λ_ obj).inv ≫ (coevaluation ▷ obj) ≫ (α_ obj obj obj).hom ≫
    (obj ◁ (mul ≫ form)) ≫ (ρ_ obj).hom = 𝟙 obj
```

**Why**: Non-degeneracy of a bilinear form is hard to state categorically
without linear algebra.  The snake identities (`zig-zag`) are equivalent and
work in any monoidal category.

### Abstract Hodge Involution

Model an involutive endomorphism — works at both the categorical level and
the concrete level:

```lean
-- Categorical level (any category with identity):
structure CatHodgeInvolution {C : Type u} [Category.{v} C] (X : C) where
  star : X ⟶ X
  star_sq : star ≫ star = 𝟙 X

-- Concrete level (Type):
structure HodgeInvolution (V : Type*) where
  star : V → V
  star_sq : ∀ v, star (star v) = v
```

Self-duality predicates follow as `f ≫ star = f` (categorical) or
`star v = v` (concrete).

## Adding New Dependencies

When a proof requires a library not in `lakefile.toml`:

1. Add the `[[require]]` entry to the relevant `lakefile.toml`
2. Run `lake update` — this fetches the dep into `.lake/packages/`
3. Run `lake exe cache get` if the dep has prebuilt oleans
4. Run `lake build` to verify everything compiles
5. **Only commit**: `lakefile.toml` and `lake-manifest.json`
6. **Never commit**: `.lake/`, `lake-packages/`, `build/` (all gitignored)

The MCP server will pick up new dependencies automatically after `lake build`.

### Toolchain compatibility (critical)

All `[[require]]` deps in a Lean project **must agree on the same
`lean-toolchain` version**. A mismatch causes build failures — often
cryptic Lake API errors in transitive deps like proofwidgets.

**Before adding or changing a dependency:**

1. Check the new dep's `lean-toolchain`:
   ```bash
   git ls-remote --refs <repo-url> HEAD
   # then check lean-toolchain at that commit, or:
   cat .lake/packages/<dep>/lean-toolchain
   ```
2. Compare against every other dep's toolchain:
   ```bash
   for pkg in .lake/packages/*/; do
     echo "$(basename $pkg): $(cat $pkg/lean-toolchain 2>/dev/null)"
   done
   ```
3. If they disagree, **do not proceed**. Find a compatible version.

**How to find a compatible version:**

- Check the new dep's `lake-manifest.json` for the Mathlib commit it
  was tested against:
  ```bash
  cat .lake/packages/<dep>/lake-manifest.json | grep -A3 mathlib
  ```
- Use **that same Mathlib commit hash** as `rev` in your `lakefile.toml`.
  This ensures all transitive deps (proofwidgets, batteries, aesop, etc.)
  resolve to versions tested together.

**Pin to commit hashes, not tags or branch names:**

- `rev = "master"` or `rev = "main"` — breaks when upstream updates.
- `rev = "v4.16.0"` — tag may target a different Lean version than
  you expect (Mathlib version numbers ≠ Lean version numbers).
- `rev = "f897ebcf72cd..."` — **preferred**. Reproducible and stable.

**When `lake update` changes `lean-toolchain` automatically:**

Lake overwrites `lean-toolchain` if a dep requires a different version.
This makes the file dirty and blocks `git pull`. Fix with
`git checkout lean-toolchain` before pulling, then let `lake update`
set it again.

### Recovery from broken `.lake/`

When dependency resolution is broken, **move** (don't delete) the
`.lake/` directory and re-resolve:

```bash
mv .lake /tmp/lake-backup-$(date +%s)
lake update
```

Using `mv` to `/tmp` is safer than `rm -rf` — you can recover if
the new resolution also fails.

### Root Lake workspace (standardized)

The repo is a **single Lake workspace** rooted at `/lakefile.toml`
with one `lean-toolchain` at the root.  Every paper is a Lake
**package** declared via `[[require]]`. Prefer running `lake` from
the **repo root**:

```bash
lake build           # build all papers
lake build MyPaper   # just one library
lake exe cache get   # Mathlib cache for the workspace
```

Per-paper `cd content/<paper>/lean && lake build` still works as a
standalone build path, but CI, the MCP `lean_build` tool, and the
skills here all prefer the root workspace.  The registry mapping
short-form package names to paper directories lives in
`folio-assistant/schemas/lean-packages.ts`.

## Blueprint Synchronization

The Formalizer must keep Lean declarations in sync with the blueprint:

1. Every Lean declaration referenced by `\lean{}` in
   `blueprint/src/content.tex` must exist in the Lean source
2. When a `sorry` is resolved, update the blueprint entry to add `\leanok`
3. When adding new theorems, add a corresponding entry to
   `blueprint/src/content.tex` with `\lean{}` and `\uses{}` edges
4. The `-- Ref: [key]` in Lean must match `\cite{key}` in the blueprint
   where applicable, ensuring bibliography consistency across both systems

## Content Object Integration

The authoritative source of truth is the **content object** triple, not raw
LaTeX. Every formalizable block is defined by three sibling files:

```
content/<paper>/<chapter>/
  <block-name>.ts    ← Manifest: kind, label, lean.ref, uses[]
  <block-name>.md    ← Narrative (markdown + TeX snippets)
  <block-name>.lean  ← Lean formalization (when required by kind)
```

### Block kind determines Lean requirements

| Block kind | Lean required? | Completeness criteria |
|-----------|---------------|----------------------|
| `definition` | **Yes** (enforced) | `.ts` has `lean.ref` (URI form `pkg:Decl`), sibling `.lean` exists, compiles |
| `theorem`, `lemma`, `proposition`, `corollary` | **Expected** (warning) | Same as definition |
| `example`, `remark`, `conjecture` | Optional | `.lean` only if author requests |
| `prose`, `equation`, `diagram` | N/A | No Lean needed |

### Workflow with content objects

1. **Read the `.ts` manifest** to get `lean.ref` (parse with
   `parseLeanRef()` from `folio-assistant/schemas/lean-packages.ts`
   to extract `{ package, decl, module, name }`) and `uses[]`
2. **Check `uses[]`** to understand upstream dependencies — ensure they're
   formalized first (dependency DAG ordering)
3. **Write/update the sibling `.lean` file** in `content/<paper>/<chapter>/`
4. **Update the `.ts` manifest**: set `lean.ref` to the package-qualified
   URI `"<pkg>:<Decl.Path>"` (per the project authoring conventions; legacy `lean.decl` /
   `lean.file` shape is removed)
5. **Run validation**: `bun run content/pipeline/validate.ts` to check
   cross-references and constraint rules

### Glossary terms in narrative `.md`

If you author or update the `.md` sibling alongside a Lean file, defined
terms (any slug in any block's `defines: [...]`) **must** be wrapped in
`:defterm[…]{#slug}` (canonical site) or `:refterm[…]{#slug}` (every
other mention). Do **not** add `\emph{}` or plain-text mentions of
defined terms. The Lean side is unaffected by this contract — Lean
declarations are linked via `lean.ref`, not glossary slugs — but the
validator will flag stray plain-text mentions in the narrative
companion. See `local/glossary-build`.

### The `uses[]` dependency graph

The `uses` field in `.ts` manifests forms a narrative dependency DAG.
**List only immediate neighbors** — if A depends on B and B depends on C,
A lists only B (not C). Transitive deps are derived by walking the graph.
Run `bun run pipeline/prune-transitive-deps.ts` to enforce this.

- When formalizing a theorem, walk the `uses[]` graph to check that all
  upstream blocks are already formalized (or have `sorry`-bridged stubs)
- The Lean import graph should mirror the `uses[]` graph
- Use `uses[]` to prioritize: formalize blocks with the most dependents first

## Post-proof simplification pass

After completing a proof (or batch of proofs), run a simplification pass
before committing. This catches verbose patterns that accumulate during
iterative proof development.

### Checklist (apply in order)

1. **`by exact X` → `X`** — drop the tactic mode wrapper when a single
   term suffices. Similarly `by rfl` → `rfl`.

2. **`unfold f; simp [...]` → `simp [f, ...]`** — `simp` can unfold
   definitions directly; the separate `unfold` is redundant.

3. **`unfold f; rw [...]` → `simp [f, ...]`** — when the rewrite chain
   is just normalization, `simp` with the definition is cleaner.

4. **Intermediate `have` → inline in `linarith`/`simp`** — if a `have`
   exists only to feed the next tactic, pass it inline:
   ```lean
   -- Before:
   have h := foo; linarith
   -- After:
   linarith [foo]
   ```

5. **Multi-line `apply; apply` → single `exact`** — chain applications:
   ```lean
   -- Before:
   apply div_pos; apply sq_pos_of_ne_zero _ h
   -- After:
   exact div_pos ... (sq_pos_of_ne_zero _ h)
   ```

6. **Tautological theorems** — never create theorems that just restate a
   structure field (`theorem foo (s : S) : ... := s.field`). Callers
   should use `s.field` directly.

7. **`@Zero.zero T inst.toZero` → `(0 : T)`** — let Lean infer instances.

8. **Retraction pattern** — when proving `(f ∘ₗ g) x = x` from
   `f ∘ₗ g = LinearMap.id`, prefer:
   ```lean
   congr_fun (congr_arg DFunLike.coe h_retraction) x
   ```
   over `rw [h]; rfl`.

9. **Dead code** — remove duplicate docstrings, stale comments, and
   unreferenced helper lemmas.

## Checklist

- [ ] All theorem statements match the `.md` narrative originals
- [ ] Import blocks are minimal and correct
- [ ] Every `sorry` has a `-- Ref: [key] url` comment (citation-linked)
- [ ] All `-- Ref:` keys exist in `content/schema/references.ts`
- [ ] `lake build` succeeds (sorry warnings are expected)
- [ ] Tactic choices match the narrative proof strategy
- [ ] Proof state can be exported at every sorry site
- [ ] `blueprint/src/content.tex` entries match Lean declarations
- [ ] `\leanok` only on sorry-free declarations

---

## Tactic ladder

When filling a `sorry`, attempt these tactics in order via
`lean_multi_attempt` before reaching for hand-written proof structure.
Reorder the ladder around your project's actual goal distribution as you
gather evidence from sorry-closing commits.

| Rank | Tactic / recipe | Best for |
|------|-----------------|----------|
|  1 | `rfl` | `comp_id`, `nodeOf _ := PUnit.unit` style |
|  2 | `unfold <decl>; rfl` | registry lookup, table tabulation lemmas |
|  3 | `omega` after `rw [sel.field_eq]` | `Nat`-valued conjecture-class consequences |
|  4 | `decide` | `_ ∉ Finset _`, decidable enum equality |
|  5 | `simp` / `simpa using h` / `unfold; simp` | tabulation lemmas |
|  6 | `ring` | pure polynomial identity |
|  7 | `field_simp; ring` | rational identity (e.g. `(q+q⁻¹)/2 - 1 = (q-1)²/(2q)`) |
|  8 | `linear_combination <multiplier> * q_mul_q_inv` | Laurent normal forms |
|  9 | `linarith` / `gcongr` | additive bound after factorisation |
| 10 | `positivity` after AM-GM rewrite `(q-1)²/q` | `q + q⁻¹ ≥ 2` family |
| 11 | `nlinarith [sq_nonneg …, mul_nonneg …, hq_pos]` with a positivity hint set | windowed polynomial bound |
| 12 | `induction <list> with \| nil … \| cons … ih => …` | foldl/foldr / recursion identities |
| 13 | `interval_cases n <;> omega` | finite `n` case split |
| 14 | `fin_cases i <;> fin_cases j <;> simp […] <;> ring` | 2×2 / Fin-indexed matrix equality |
| 15 | 2-monomial `Finset` witness against `no_relation` | `Irrational`/`Transcendental` of an algebraic constant |

### Laurent normal-form recipe (rank 8)

Whenever two normal forms of a Laurent word are to be shown equal, the
difference is often a Laurent-polynomial multiple of `q · q⁻¹ = 1`.
Name that hypothesis `q_mul_q_inv` and invoke `linear_combination`:

```lean
have q_mul_q_inv : q * q_inv = 1 := …  -- usually already in scope
simp only [nf_coefficients, HA]
linear_combination (q^4 - 5*q^2 + q_inv^4 - 5*q_inv^2 + 20) * q_mul_q_inv
```

### 2×2 transfer-matrix equality (rank 14)

```lean
ext i j
fin_cases i <;> fin_cases j <;>
  simp only [transferMatrix, Matrix.mul_apply, Fin.sum_univ_two,
             Matrix.cons_val_zero, Matrix.cons_val_one,
             Matrix.head_cons, Matrix.head_fin_const] <;>
  ring
```

### MathlibExt promotion

When a proof body inlines a general-purpose helper (no project-specific
types), promote it via the `lean-mathlibext-curator` skill before
continuing. The promotion removes the lemma from the proof body and adds
a `-- TODO upstream: <module>` tag in the project's `MathlibExt.lean`.

## Proof-authoring patterns

### 1. Structure-hypothesis + projection-theorem (encode cited content sorry-free)

When a result is **true modulo a manuscript/realisation input** you
cannot yet formalise, do **not** write `sorry`. Package the realisation
as a `structure` *field* and prove the downstream identity by
**projecting that field**:

```lean
structure PeriodResidue (k : ℕ) where
  period : ℂ
  twoPiI : ℂ
  residues : Fin k → ℂ
  period_eq : period = twoPiI * ∑ p, residues p   -- the realisation, as hypothesis

theorem period_eq_residue_sum (S : PeriodResidue k) :
    S.period = S.twoPiI * ∑ p, S.residues p := S.period_eq
```

The file is genuinely `sorry`-free; the cited input is visible as the
structure's hypothesis (honest), and downstream blocks consume it via an
instance. For **conjectures**, use the §3b class form (`class C … ; theorem
downstream [C] : …` proved from the class) — same idea, instance = the open
input. Mark the `.ts` `lean.validation: "validated"` only after a real
compile (below).

> **Caution.** This pattern is honest **only when the field is a genuine
> hypothesis the theorem composes/derives from** — not the conclusion
> itself projected verbatim. Carrying the conclusion as a field and
> returning it (`:= S.conclusion`) is the self-assuming-projection
> anti-pattern; see `lean-proof-vacuity-audit.md`.

### 2. Mathlib v4.24.0 import map

| You want | DEAD (pre-split) | USE in v4.24.0 |
|---|---|---|
| `∑` notation + `Finset.sum_congr` | `Mathlib.Algebra.BigOperators.Basic` | `Mathlib.Algebra.BigOperators.Group.Finset.Basic` |
| `Finset.mul_sum` | `…BigOperators.Basic` | `Mathlib.Algebra.BigOperators.Ring.Finset` |
| `Fintype (Fin k)` for `∑ p : Fin k` | (implicit) | add `Mathlib.Data.Fintype.Card` |

`Mathlib.Algebra.BigOperators.Basic` **does not exist** in v4.24.0 — a
file importing it fails before any tactic runs. Symptom: "unknown
module" then cascade "Function expected" / "failed to synthesize Fintype".

### 3. Verify content-block `.lean` with `lake env lean <file>` (not lake build)

Content-block `.lean` files are **siblings** outside the `lean/` lib root,
so `lake build <Package>` does not compile them. Typecheck each standalone:
`export PATH="$HOME/.elan/bin:$PATH" && lake env lean <path>` (exit 0 + no
output = sorry-free). This is a **from-source** typecheck, so it is immune
to the stale-olean false-green trap (see `lean-environment-setup.md`).
Restore `.lake` first; only elan/`cache get` are firewalled, `lake env
lean` works.

### 4. Decompose a conjecture into obligations; find the keystone

Before "proving" a bundled conjecture, **enumerate its distinct claims**
as separate obligations. Tag each proved / partial / open. Then identify
the **keystone** — the one derivation that, once done, collapses the rest
to a finite check. Prove the keystone, then **upgrade the conjecture to a
§3b-cond conditional-class theorem** (rigorous modulo one named class
instance) rather than leaving a bare conjecture. This staging is the
honest path from `conjecture` → `validated conditional theorem`.
{% endraw %}
