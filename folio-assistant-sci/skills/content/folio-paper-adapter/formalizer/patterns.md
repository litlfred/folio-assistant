---
part-of: formalizer
description: >
  Detail for `formalizer`, split out of it so the parent stays a short entry
  point. NOT a skill of its own — reached through the parent.
---

# formalizer — proof patterns and the tactic ladder

What to reach for once the statement is written: patterns that are known to
work here, the tactic ladder, authoring patterns, and the simplification pass
that runs after a proof closes.

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

