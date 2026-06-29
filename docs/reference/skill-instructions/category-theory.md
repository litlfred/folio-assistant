---
layout: default
title: Category Theory Formalization
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/category-theory.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/category-theory.md) — do not edit here.

{% raw %}
# Category Theory Formalization

## Overview

Category theory is the "connective tissue" of Mathlib.  In Lean 4, a
`Category` is not just a set of data — it is a **capability** that types
can have (via typeclasses).  This skill provides the tactics, patterns,
and glossary requirements for effective category-theoretic formalization.

## Lean MCP Tools (paper-assistant)

When the MCP server is available, it supercharges category theory work:

| Task | MCP tool | How it helps |
|------|----------|-------------|
| Finding Mathlib lemmas | `lean_leansearch` | "naturality of adjunction counit" → exact lemma |
| Type-signature search | `lean_loogle` | `_ ⟶ _ ≫ NatTrans.app _ _ = _` → matching lemmas |
| Checking diagram types | `lean_hover_info` | Verify morphism source/target without reading Mathlib |
| Goal state in diagram chase | `lean_goal` | See exact morphism equation to prove |
| Trying aesop_cat + fallbacks | `lean_multi_attempt` | Try `[aesop_cat, simp [assoc], rw [naturality]]` at once |
| "Try This" from simp | `lean_code_actions` | Get the exact simp lemma set that closes the goal |
| Finding all uses of a functor | `lean_references` | Impact analysis before refactoring |
| Universe mismatch debugging | `lean_diagnostic_messages` | Structured errors with universe annotations |

### MCP-first diagram chase

1. **`lean_goal`** at the sorry → see the morphism equation
2. **`lean_multi_attempt`** with `[aesop_cat, simp [Category.assoc], rw [NatTrans.naturality]]`
3. If that fails, **`lean_leansearch`** with the goal in natural language
4. **`lean_code_actions`** → check for "Try This" from `simp?` or `exact?`

## When to Use This Skill

- When formalizing proofs involving diagram commutativity
- When working with functors, natural transformations, or adjunctions
- When the narrative mentions universal properties (limits, colimits)
- When dealing with monoidal categories or braided structures
- When universe level mismatches appear in `lake build` output

## Skill 1: The Diagram Chaser (Naturality & Commutativity)

Most category theory proofs involve showing a diagram commutes.

### Tactic Strategy

1. **First attempt**: `aesop_cat` — the category-specific automation tactic
2. **If `aesop_cat` fails**: Use `slice_lhs` / `slice_rhs` to focus on
   a specific part of the composition
3. **Manual fallback**: `simp` with `[CategoryTheory.Category.assoc]`

### Example: Naturality Square

```lean
import Mathlib.CategoryTheory.NatTrans

open CategoryTheory

-- Given: F G : C ⥤ D and α : F ⟶ G (a natural transformation)
-- Prove: naturality square commutes
example {C D : Type*} [Category C] [Category D]
    (F G : C ⥤ D) (α : F ⟶ G) {X Y : C} (f : X ⟶ Y) :
    F.map f ≫ α.app Y = α.app X ≫ G.map f := by
  exact α.naturality f
```

### `slice_lhs` and `slice_rhs` Usage

These tactics "zoom in" on a segment of a long composition:

```lean
-- For a composition f ≫ g ≫ h ≫ k:
-- slice_lhs 2 3 focuses on (g ≫ h) in the LHS
-- Then you can apply a rewrite within that segment
example {X Y Z W V : C} (f : X ⟶ Y) (g : Y ⟶ Z) (h : Z ⟶ W) (k : W ⟶ V)
    (comm : g ≫ h = some_other_morphism) :
    f ≫ g ≫ h ≫ k = f ≫ some_other_morphism ≫ k := by
  slice_lhs 2 3 => rw [comm]
```

## Skill 2: Universal Property Resolver

### Narrative-to-Tactic Mapping

| Narrative Phrase                         | Lean Structure / Tactic         |
|------------------------------------------|---------------------------------|
| "By the universal property of the product" | `Limits.IsLimit`              |
| "There exists a unique morphism..."      | `Limits.IsLimit.lift`           |
| "Uniqueness follows from..."             | `Limits.IsLimit.hom_ext`        |
| "By the universal property of the coproduct" | `Limits.IsColimit`          |
| "The adjunction gives..."               | `Adjunction.homEquiv`           |

### Example: Limit Lift

```lean
import Mathlib.CategoryTheory.Limits.IsLimit

open CategoryTheory Limits

-- "By the universal property of the product, there exists a unique morphism"
example {J C : Type*} [Category J] [Category C]
    {F : J ⥤ C} (t : Cone F) (ht : IsLimit t) (s : Cone F) :
    ∃! f : s.pt ⟶ t.pt, ∀ j, f ≫ t.π.app j = s.π.app j := by
  exact ⟨ht.lift s, ht.fac s, fun m hm => ht.uniq s m hm⟩
```

## Skill 3: Functorial Translation (Bundling/Unbundling)

### Critical Distinction

In Lean, functors are **bundled** objects.  The agent must distinguish:
- `F.obj X` — action on objects
- `F.map f` — action on morphisms

**Common mistake**: Treating `F` as a simple function.  It is NOT.

### Whiskering (Horizontal Composition)

When composing natural transformations between composed functors:

```lean
-- Given: F₁ F₂ : C ⥤ D and G : D ⥤ E
-- Whiskering α : F₁ ⟶ F₂ by G gives: G.map (α.app X) for each X
-- In Lean: whiskerRight α G or α ◫ G
```

This must be explicitly defined in the Glossary to prevent confusion
with standard function composition.

## Skill 4: Universe Management

### Universe Requirements Table

| Narrative Concept      | Lean Type                  | Universe    | Required Instances                |
|------------------------|----------------------------|-------------|-----------------------------------|
| Category C             | `Category.{v, u} C`       | `u`, `v`    | —                                 |
| Small Category         | `SmallCategory C`          | same `u`    | —                                 |
| Abelian Category       | `Abelian C`                | `u`, `v`    | `Preadditive`, `HasLimits`        |
| Monoidal Category      | `MonoidalCategory C`       | `u`, `v`    | `Category`                        |
| Braided Monoidal       | `BraidedCategory C`        | `u`, `v`    | `MonoidalCategory`                |
| Rigid Monoidal         | `RigidCategory C`          | `u`, `v`    | `MonoidalCategory`                |

### Universe Mismatch Detection

If `lake build` reports:

```
type mismatch: universe level u_1 is not <= u_2
```

The Ontologist must check whether the glossary entry for that type has
correct universe annotations.

## Mathlib Imports for Category Theory

```lean
import Mathlib.CategoryTheory.Category.Basic
import Mathlib.CategoryTheory.Functor.Basic
import Mathlib.CategoryTheory.NatTrans
import Mathlib.CategoryTheory.Monoidal.Basic
import Mathlib.CategoryTheory.Monoidal.Braided.Basic
import Mathlib.CategoryTheory.Limits.IsLimit
import Mathlib.CategoryTheory.Adjunction.Basic
import Mathlib.CategoryTheory.Abelian.Basic
import Mathlib.CategoryTheory.Preadditive.Basic
```

## `aesop_cat` Integration

When the narrative proof involves a diagram chase or naturality:

1. **First**: Attempt `aesop_cat`
2. **If fails**: Fall back to `slice_lhs` / `slice_rhs` to manually
   navigate the composition until a rewrite can be applied
3. **If still fails**: Decompose into intermediate `sorry` lemmas

```lean
-- Golden template: aesop_cat solving a naturality proof
example {C D : Type*} [Category C] [Category D]
    (F G : C ⥤ D) (α : F ⟶ G) {X Y : C} (f : X ⟶ Y) :
    α.app X ≫ G.map f = F.map f ≫ α.app Y := by
  rw [α.naturality]
```

## Skill 5: Monoidal Category Notation

### Idiomatic Notation

Always use `open scoped CategoryTheory.MonoidalCategory` and prefer the
short notation over fully qualified names:

| Fully Qualified | Short Notation | Meaning |
|-----------------|---------------|---------|
| `CategoryTheory.MonoidalCategory.tensorObj X Y` | `X ⊗ Y` | Tensor product |
| `CategoryTheory.MonoidalCategory.tensorUnit` | `𝟙_ C` | Tensor unit |
| `CategoryTheory.MonoidalCategory.associator X Y Z` | `α_ X Y Z` | Associator |
| `CategoryTheory.MonoidalCategory.leftUnitor X` | `λ_ X` | Left unitor |
| `CategoryTheory.MonoidalCategory.rightUnitor X` | `ρ_ X` | Right unitor |
| `CategoryTheory.MonoidalCategory.whiskerLeft X f` | `X ◁ f` | Left whiskering |
| `CategoryTheory.MonoidalCategory.whiskerRight f X` | `f ▷ X` | Right whiskering |
| `CategoryTheory.CategoryStruct.id X` | `𝟙 X` | Identity morphism |

**Rule**: Never write `CategoryTheory.MonoidalCategory.tensorObj` in structure
fields when the scoped notation is open.  Use `X ⊗ Y` instead.

### Example: Frobenius Object

```lean
open scoped CategoryTheory CategoryTheory.MonoidalCategory

structure FrobeniusData (C : Type*) [Category C] [MonoidalCategory C] where
  obj : C
  mul : (obj ⊗ obj) ⟶ obj
  unit : (𝟙_ C) ⟶ obj
  comul : obj ⟶ (obj ⊗ obj)
  counit : obj ⟶ (𝟙_ C)
  frobeniusForm : obj ⟶ (𝟙_ C)
  coevaluation : (𝟙_ C) ⟶ (obj ⊗ obj)
  -- Snake identities (exact self-pairing / self-duality):
  pairing_snake_left :
    (ρ_ obj).inv ≫ (obj ◁ coevaluation) ≫ (α_ obj obj obj).inv ≫
      ((mul ≫ frobeniusForm) ▷ obj) ≫ (λ_ obj).hom = 𝟙 obj
  pairing_snake_right :
    (λ_ obj).inv ≫ (coevaluation ▷ obj) ≫ (α_ obj obj obj).hom ≫
      (obj ◁ (mul ≫ frobeniusForm)) ≫ (ρ_ obj).hom = 𝟙 obj
  -- Frobenius relation:
  frobenius_relation :
    mul ≫ comul = (comul ▷ obj) ≫ (α_ obj obj obj).hom ≫ (obj ◁ mul)
```

### Categorical Vanishing via Subsingleton

Use `Subsingleton (X ⟶ Y)` to express that a hom-space is trivial
without requiring `Preadditive`:

```lean
adjoint_vanishing : Subsingleton ((𝟙_ C) ⟶ adjointObj)
```

### Categorical Hodge Involution

An involutive endomorphism `⋆ : X ⟶ X` with `⋆ ≫ ⋆ = 𝟙 X` models
the Hodge star in any category.  Self-duality: `f ≫ ⋆ = f`.

## Knot Theory Integration

For formalizing knot-theoretic content, use combinatorial representations:

### Mathlib Foundations

| Sub-library | Usage |
|-------------|-------|
| `Mathlib.Topology.AlgebraicTopology.FundamentalGroupoid` | Fundamental group of knot complement |
| `Mathlib.Geometry.Manifold` | Knots as embeddings S¹ ↪ ℝ³ |
| `Mathlib.Algebra.Category.ModuleCat` | Alexander/Jones polynomial via representation theory |

### Knot Type Definition

Since no `Knot.lean` exists in Mathlib, define using available topology:

```lean
/-- A knot is a continuous embedding of S¹ into ℝ³. -/
def Knot := { f : 𝕊¹ → EuclideanSpace ℝ (Fin 3) // Continuous f ∧ Function.Injective f }
```

### Symbolic Representations

For Jones polynomial / Khovanov homology, use planar diagrams:

```lean
/-- A crossing in a planar diagram. -/
inductive Crossing where
  | positive : Fin n → Fin n → Crossing
  | negative : Fin n → Fin n → Crossing

/-- Planar diagram code for a knot. -/
structure PlanarDiagram where
  crossings : List Crossing
  components : ℕ
```

## Skill 6: LaTeX Diagram Conventions (Herrlich–Strecker style)

When writing or editing LaTeX definitions involving categorical structures:

### Diagram-First Presentation

Every definition of a categorical structure must include **commutative
diagrams** (using `tikzcd`, never `CD`/amscd) alongside the equations.
The diagram comes first; the equation it expresses follows.

### Required Diagrams by Structure

| Structure | Required Diagrams |
|-----------|-------------------|
| Monoidal category | Associator $\alpha$, left/right unitors $\ell$, $\rho$ |
| Rigid monoidal | Snake identity triangles (ev/coev) |
| Hopf object | Structure morphism layout ($\mu$, $\eta$, $\Delta$, $\varepsilon$, $S$) |
| Frobenius object | Pairing composition diagram, Frobenius relation square |
| Volume constraint | Naturality square with $\Lambda^2 g_V$ |
| Connection | Leibniz rule square, curvature composition |
| Factorisation | Dashed arrow for induced morphism |

### tikzcd Conventions

```latex
\begin{tikzcd}[row sep=2.5em, column sep=3em]
  X \ar[r, "f"] \ar[d, "g"']   % label below for downward arrows
  & Y \ar[d, "h"]
  \\
  Z \ar[r, "k"']               % label below for bottom arrows
  & W
\end{tikzcd}
```

- Epimorphisms: `two heads`
- Induced morphisms: `dashed`
- Isomorphisms: `"\sim"'` as second label
- Equality: `equal`

### Deformation/Parameter Convention

If the paper introduces a deformation or specialization parameter, it must
**not** appear in definitions or examples before the section that introduces
it.  Pre-parameter material uses the undeformed forms throughout.

### Running Example Convention

Definitions use a single running example, introduced in the first chapter,
that builds progressively across the paper.  Each step uses
"Continuing Example~\ref{...}" to chain back to the prior step.

### Cross-Paper Dependencies

A construction in one paper may depend on a result in another paper of the
same folio.  For instance, a canonical basis construction can depend on a
theorem (labeled, say, `cor:foo`) proved in another paper, cited via a
qualified cross-paper reference:

```typescript
uses: ["other-paper:cor:foo"],  // qualified cross-paper ref
```

## Content Object Integration

Category-theory blocks are content object triples (`.ts` + `.md` +
`.lean`). The `.ts` manifest's `kind` field determines formalization
requirements:

- `definition` (e.g., monoidal structure, Frobenius data): `.lean`
  **required**, `lean.ref` URI must name the `structure` or `def` in Lean,
  label prefix `def:`.
- `theorem` / `lemma` / `proposition` (e.g., naturality, diagram
  commutativity): `.lean` expected, `lean.ref` URI must name the `theorem`,
  label prefix `thm:` / `lem:` / `prop:`.
- `example` / `remark`: `.lean` optional.

**Lean declaration alignment.** The `lean.ref` URI (form `"<pkg>:<Decl>"`,
parsed via `parseLeanRef()`) in the `.ts` manifest must match the actual
declaration name in the `.lean` sibling. For categorical structures, this
is typically `"<paper-pkg>:<Paper>.<PascalCaseName>"`. Verify with `lean_hover_info`
when reviewing.

**Dependency graph.** Use `uses[]` in `.ts` manifests to track which
categorical definitions a theorem depends on. This mirrors the Lean import
graph and enables scoped validation — when a monoidal structure changes,
all blocks that `uses` it are flagged for re-check.

## Glossary Chapter (Ch 8)

Chapter 8 contains glossary blocks (`remark` with tag `"glossary"`) that
map paper terminology to Mathlib declarations. For category-theoretic
terms, the glossary provides:

- Canonical Mathlib name (e.g. `CategoryTheory.ExactPairing`)
- Import path (e.g. `Mathlib.CategoryTheory.Monoidal.Rigid.Basic`)
- Notation (e.g. `X ⊗ Y`, `α_ X Y Z`)
- Relationship to paper's usage

**When introducing a category-theoretic term** in any chapter `.md`:
1. Check Ch 8 for an existing glossary entry
2. If the term is a Mathlib synonym → add a glossary block, not a definition
3. If the term adds new structure → add a definition block in the chapter
4. Cross-reference glossary entries using `[term](#rem:glossary-<name>)`

Current glossary entries cover: monoidal category, braided/symmetric
monoidal, rigid category, exact pairing, left/right dual, pivotal
category, compact closed category, monoidal functor, $R$-linear category,
and hom-set.

## Checklist

- [ ] All diagram chase proofs attempt `aesop_cat` first
- [ ] Functorial operations use `F.obj` / `F.map`, never bare application
- [ ] Universe annotations match glossary entries
- [ ] Natural transformation compositions use whiskering notation
- [ ] Knot types are defined combinatorially when possible
- [ ] `slice_lhs` / `slice_rhs` used for manual composition navigation
- [ ] LaTeX definitions include tikzcd diagrams (Herrlich–Strecker style)
- [ ] Categories use bold notation ($\mathbf{C}$, $\mathbf{Rep}$), not calligraphic $\mathcal{C}$
- [ ] Fibre functor is $\tau$ (not $\omega$ or $U$); minimise its appearance
- [ ] No deformation parameter appears before the section that introduces it
- [ ] Running examples chain via "Continuing Example" cross-references
- [ ] New Mathlib-equivalent terms have glossary entries in Ch 8
```
{% endraw %}
