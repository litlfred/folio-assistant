---
name: chapter-analysis
roles: [collaborator, owner]
description: >
  Thorough analysis and Lean 4 formalization of a single manuscript chapter.
  Extracts all narrative definitions/propositions (excluding remarks), identifies
  missing glossary terms, writes comprehensive Lean stubs using mathlib, and
  proves limiting-case and structural theorems where possible.
allowed-tools: Read Write Edit Bash Grep Glob
---

# Chapter Analysis & Formalization

## Overview

This skill performs a complete analysis-to-formalization pass on a single
chapter of the manuscript.  It is the union of the Ontologist, Formalizer,
and Lean Generation skills applied in a structured, chunked workflow.

## When to Use This Skill

- When a chapter is ready for its first Lean formalization pass
- When reviewing a chapter for glossary completeness
- When bringing a chapter's Lean infrastructure from empty stubs to
  comprehensive definitions with proved structural results
- When onboarding a new mathematical domain into the Lean codebase

## Prerequisites

- The chapter's `.tex` file exists in `chapters/`
- The corresponding `lean/<Paper>/<Chapter>.lean` file exists (may be empty)
- `lean/<Paper>/Glossary.lean` and `glossary.json` are current
- The per-paper `lakefile.toml` (and the root `/lakefile.toml`) have all needed dependencies (mathlib4, …)

## Chunked Workflow

The analysis proceeds in 8 chunks.  Each chunk is independently committable.
Mark each chunk done before proceeding.

### Chunk 1 — Narrative Inventory

1. Read the chapter `.tex` file in full
2. List every `\begin{definition}`, `\begin{lemma}`, `\begin{proposition}`,
   `\begin{theorem}`, `\begin{example}`, `\begin{corollary}` — **excluding
   remarks** unless explicitly requested
3. For each item record:
   - LaTeX label (e.g. `def:core-structure`)
   - Display name (e.g. "Core Structure")
   - Environment type (definition / lemma / proposition / …)
   - Dependencies (items referenced via `\ref`)
4. Output: a markdown table of all narrative items

### Chunk 2 — Glossary Gap Analysis

1. Compare the narrative inventory against `glossary.json` entries for
   this chapter
2. Identify terms **used** in definitions but not present as glossary entries
3. For each missing term, determine:
   - `narrative_term`: human-readable name
   - `lean_name`: fully qualified Lean name (`<Paper>.Glossary.<PascalCase>`)
   - `kind`: `def`
   - `narrative_definition`: 1–2 sentence definition from the text
   - `latex_label`: the label of the definition that uses this term
   - `chapter`: chapter number
4. Output: list of new glossary entries

### Chunk 3 — Lean Structures (Categorical / Algebraic)

Write Lean `structure` or `class` declarations for the foundational algebraic
objects in the chapter.  Follow these rules:

- Import from mathlib: `CategoryTheory.Monoidal.Basic`, `Functor.Basic`,
  `Algebra.Group.Basic`, etc.
- Use `sorry` only for axiom placeholders that represent deep mathematical
  content (non-degeneracy, cohomological vanishing).  Prefer `True := by trivial`
  for conditions that are axiomatically assumed.
- Every structure field gets a `/-- ... -/` docstring
- Naming: `PascalCase` for structures, `camelCase` for defs/theorems,
  `snake_case` for lemma names

### Chunk 4 — Lean Structures (Geometric / Analytic)

Write Lean structures for any concrete/geometric realisation in the chapter:

- Manifold data, connections, model parameters
- Use `M → ℝ` as a simplified type for sections/fields when full
  differential-geometric types are not yet available in the project
- Include positivity/boundedness conditions as fields

### Chunk 5 — Lean Definitions (Parameter-Deformed Operators)

When the chapter introduces operators that depend on a deformation/specialization
parameter, write a `noncomputable def` for each.  Such operators frequently
share a common interpolation structure between a base case and a correction
term; capture that shared shape once and reuse it. For example:

```lean
noncomputable def deformedOperator {M : Type*} (p : Parameter M)
    (baseOp : M → ℝ) (correction : M → ℝ) (x : M) : ℝ :=
  (p.field x)⁻¹ * baseOp x +
    (1 - (p.field x)⁻¹) * correction x
```

### Chunk 6 — Lemmas and Propositions

For each lemma/proposition in the chapter:

- State as a `theorem` with the correct hypotheses
- If the proof is contained in the chapter, attempt formalization
- If the proof is deferred, use `sorry` with a comment citing the chapter
- Prove **limiting-case theorems** (the parameter's trivial value recovers
  the classical/base object) — these are typically straightforward
  `unfold; rw; ring`

### Chunk 7 — Update Glossary Files

1. Add new entries to `glossary.json` (update `entry_count`)
2. Add corresponding `def` declarations to `lean/<Paper>/Glossary.lean`
   with docstrings, LaTeX labels, and mathlib references

### Chunk 8 — Commit, Push, PR

1. `git add` the modified files (typically 3–4 files)
2. Commit with message pattern:
   ```
   feat: formalize Chapter N definitions and add missing glossary terms
   ```
3. Push to the working branch
4. Create PR with a table of Lean declarations and their status

## Lean Style Guidelines

- `autoImplicit` is `false` — declare all universe and type variables
- Prefer `structure` over `def ... := sorry` for data-carrying types
- Group declarations under `/-! ## §N  Section Title -/` comments
- Proved theorems (no sorry) should be prioritised:
  - Parameter bounds (e.g. `0 ≤ ℏ_q < 1`)
  - Limiting cases (trivial parameter value recovers the base operator)
  - Decomposition identities (`total = horizontal + vertical`)
- Use mathlib tactics: `linarith`, `ring`, `field_simp`, `simp`, `rfl`

## Mathlib Import Cheat Sheet

| Concept | Import |
|---------|--------|
| Monoidal categories | `Mathlib.CategoryTheory.Monoidal.Basic` |
| Functors | `Mathlib.CategoryTheory.Functor.Basic` |
| Groups/rings | `Mathlib.Algebra.Group.Basic`, `Mathlib.Algebra.Ring.Basic` |
| Ordered fields | `Mathlib.Algebra.Order.Field.Basic` |
| Real numbers | `Mathlib.Data.Real.Basic` |
| Manifolds | `Mathlib.Geometry.Manifold.SmoothManifoldWithCorners` |
| Inner product spaces | `Mathlib.Analysis.InnerProductSpace.Basic` |
| Exterior algebra | `Mathlib.LinearAlgebra.ExteriorAlgebra.Basic` |
| Topological spaces | `Mathlib.Topology.Basic` |
| Continuous functions | `Mathlib.Topology.ContinuousFunction.Basic` |
| Fiber bundles | `Mathlib.Topology.FiberBundle.Basic` |

## Content Object Integration

Chapter analysis should populate **content object triples**, not just
extract items from LaTeX. Each narrative definition, theorem, lemma,
proposition, example, or corollary becomes a triple:

- `block-name.ts` — typed manifest with `kind`, `label`, `lean.ref`,
  `status`, and `uses[]` referencing other content object labels.
- `block-name.md` — narrative content (markdown with inline/display math).
- `block-name.lean` — Lean formalization (required for `definition`,
  expected for `theorem`/`lemma`/`proposition`/`corollary`, optional for
  `example`/`remark`/`conjecture`, absent for `prose`/`equation`/`diagram`).

**Chunk 1 output should feed content object creation.** The narrative
inventory table maps directly to `.ts` manifests: environment type becomes
`kind`, LaTeX label becomes `label`, and `\ref` dependencies become
`uses[]` entries. Populate content objects during analysis rather than
treating LaTeX as the authoritative source.

**Dependency graph.** Build `uses[]` edges from `\ref` cross-references
found during inventory. These edges drive both the Lean import graph and
formalization priority ordering.

## Checklist

- [ ] All non-remark narrative items have Lean declarations
- [ ] Limiting-case theorems are proved (no sorry)
- [ ] Missing glossary terms are added to both `.json` and `.lean`
- [ ] `entry_count` in `glossary.json` is updated
- [ ] Every `sorry` has a comment explaining what it defers
- [ ] Lean file compiles with `lake build` (sorry warnings expected)
- [ ] Commit message follows repository conventions
