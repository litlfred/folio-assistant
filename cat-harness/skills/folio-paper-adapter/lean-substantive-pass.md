---
name: lean-substantive-pass
roles: [collaborator, owner]
user_invocable: true
description: >
  Convert abstract `holds : Prop` / `claim : Prop` placeholder Lean
  stubs into typed sub-claim contexts with manuscript-semantic
  field names. Three escalation levels: hand-craft per-block
  (highest fidelity), bulk-script split on numbered sub-claims, and
  docstring enrichment (extract first-sentence summaries from .md).
  Use this skill after `local/lean-generation` has created the
  placeholder stubs and the backlog is structurally closed.
allowed-tools: Read Edit Write Bash Grep Glob Skill
---

# /lean-substantive-pass

The job of this skill is to take an abstract `class FooContext where
... holds : Prop` placeholder and turn it into a typed sub-claim
context. Three levels of fidelity, escalating:

```
Level 1 (hand-crafted, ~5-30 min/block)
  └── typed Real/Nat fields + named sub-claims with full manuscript context
Level 2 (bulk-script split, ~seconds/block)
  └── numbered claim_i, claim_ii, ..., claim_N : Prop (count from .md numbered list)
Level 3 (docstring enrichment, ~seconds/block)
  └── /-- Manuscript sub-claim (i) — <first-sentence-from-md>. -/
```

## 0. When to invoke

- After `local/lean-generation` has populated `.lean` stubs with
  `holds : Prop` placeholders (the "backlog closure" pass).
- Before `local/lean-completeness-audit` reports trivial-skeleton
  status — typed sub-claims downgrade the audit verdict from
  "structural placeholder" to "named structural placeholder".
- After resolving a `.md` block's `uses[]` cone (so the manuscript
  content is stable enough to encode as Lean types).

## 1. Recognised manuscript patterns

The pass works because manuscript propositions follow consistent
shapes. Recognise these and apply the matching Lean encoding:

| Pattern in .md | Lean encoding |
|----------------|---------------|
| `$\boxed{lhs = rhs}$` or `$\boxed{lhs \leq rhs}$` | `claim_boxed_identity : lhs = rhs` with `lhs, rhs : ℝ` abstract fields |
| `1. ... 2. ... 3. ...` numbered list | `claim_i, claim_ii, claim_iii : Prop` (split into N) |
| `\begin{cases} ... \end{cases}` piecewise | conditional sub-claims `cond_i → result_i = ...` |
| "is an equivalence relation" with refl/sym/trans | three sub-claims; theorem proves `Equivalence ctx.rel` |
| Table of moves / rules (one row per rule) | one `claim_<move_name>` Prop per row |
| "exists and is unique" | `claim_existence : ∃ x, P x` + `claim_uniqueness : ∀ x y, P x → P y → x = y` |
| Numerical formula `Q = ... × c × ...` | typed `claim_formula : Q = ... * c * ...` |
| Polynomial recurrence `a_{n+2} = X · a_{n+1} + a_n` | `noncomputable def + theorem ... : rfl` |
| Matrix identity `T_pp · T_nn = I` | entry-level equalities `entry_00 = 1 ∧ entry_11 = 1` |

## 2. Type-field heuristics

When a block uses recurring manuscript vocabulary, declare matching
typed fields. The map is project-specific — build a vocabulary table
for the paper at hand; the *shape* of the encoding is what generalises:

| Manuscript word | Lean field |
|-----------------|-----------|
| a scalar parameter `q` | `q : ℝ` (+ `q_gt_one : 1 < q` when needed) |
| a derived scalar `h = f(q)` | `h : ℝ` + `h_eq : h = ...` |
| an integer count `Z` | `Z : ℕ` |
| a second integer count `N` | `N : ℕ` |
| a derived count `A = Z + N` | `A : ℕ` + `A_eq : A = Z + N` |
| an external/measured constant `c` | `c : ℝ` (external input) |
| a categorical object `A` | `CategoricalObj : Type` |
| an indexed algebra `H_n` | `IndexedAlgebra : Type` or `IndexedAlgebra : ℕ → Type` |
| an index/partition `λ` | `Idx : Type` |
| a combinatorial representative | `Rep : Type` |
| an optimisation dual variable | `dual_price : ℝ` or named per channel |
| a reference weight | `w : Idx → ℝ` |
| a deformed weight | `w_tilde : Idx → ℝ` |

Per the project authoring conventions (archimedean wall), keep types generic unless the
specific construction requires `ℝ`. `Matrix R d₁ d₂`,
`Polynomial R`, `Finset.sum` are all generic-typeclass-friendly.

## 3. Workflow

### Step 3.1 — Survey

```bash
# Count remaining placeholders by chapter
grep -lr "^  holds : Prop\|^  claim : Prop\|^  claim_i : Prop" \
  content/<paper>/lean/MyPaper/ 2>/dev/null \
  | awk -F'/MyPaper/' '{print $2}' | awk -F/ '{print $1}' \
  | sort | uniq -c | sort -rn
```

Pick the largest chapter; commit to finishing it before moving on.

### Step 3.2 — Bulk-split (Level 2)

Run the bulk-split script first to convert single `holds : Prop`
into `claim_i, claim_ii, ..., claim_N : Prop` based on numbered
sub-claims in the .md:

```bash
python3 .work/bulk-split-holds.py
```

Output: split count + rename count. Both are mechanical.

### Step 3.3 — Docstring enrichment (Level 3)

Run the enrichment script to add first-sentence-from-md summaries
to each generic sub-claim docstring:

```bash
python3 .work/enrich-subclaim-docstrings.py
```

After this, every `claim_i, claim_ii, ...` carries a manuscript-
fragment summary in its docstring — enough for downstream readers
to know what each sub-claim asserts.

### Step 3.4 — Hand-craft (Level 1)

For high-value blocks (key formulas, predicted observables,
foundational propositions), hand-craft each sub-claim with:

1. Read `.md` to identify the structural pattern (table 1 above).
2. Read `.lean` to see current placeholder fields.
3. Apply the matching Lean encoding (table 1) and type fields
   (table 2).
4. Re-state the theorem as a conjunction (or `Equivalence`,
   `∀ k`, etc.) that proves directly from the named sub-claim
   fields by `⟨...⟩` constructor.
5. The body remains `sorry`-free **only** when every sub-claim is
   a class hypothesis (no need to discharge); else stays `sorry`.

## 4. Patterns that emerged in practice

These are anti-patterns to **avoid**:

- **Don't rename `holds` → `claim` without checking the .md.** If
  the .md has numbered sub-claims, split into `claim_i, claim_ii,
  ...` instead.
- **Don't use generic `claim_i, claim_ii, ...` names when the
  manuscript has clear semantic identifiers.** Use names like
  `claim_i_spectral_decomposition`, `claim_ii_existence`, etc.
- **Don't introduce `Finset.univ.sum` / `Finset.univ.prod` without
  importing** `Mathlib.Algebra.BigOperators.Group.Finset.Defs`.
- **Don't use `q := ...` named-argument syntax inside class
  field types** — it's only valid in term-mode binders. Use a
  named field `s : ℝ` with `s_eq : s = ...` instead.
- **Don't break a multi-claim conjunction with `refine ⟨..., ?_⟩`
  if the entire conjunction can be discharged constructively.**
  Use `⟨ctx.claim_i, ctx.claim_ii, ...⟩` directly when every
  sub-claim is a context field.

## 5. Sub-skills delegated

- `local/lean-generation` — populates stubs initially.
- `local/lean-build-fix` — fixes any compilation errors from the
  typed sub-claim encoding (missing imports, syntax errors).
- `local/lean-completeness-audit` — measures coverage afterwards.
- `local/proof-conciseness` — tightens the final theorem proofs
  once they're typed.

## 6. Author-ask templates

For ambiguous block-level shape choice:

> Block `<label>` has manuscript text with both a boxed identity
> (`B = ... × c × ...`) and three sub-bullets. Should the Lean
> encoding be: 1) single `claim_boxed_identity` typed `=`,
> 2) split into `claim_i_xxx, claim_ii_yyy, claim_iii_zzz`,
> 3) both (boxed identity + sub-bullets each as their own field)?

For unrecognised structural patterns:

> Block `<label>` has narrative text describing `<concept>` but no
> recognisable boxed identity / numbered list / table / cases.
> Should I: 1) keep single `claim : Prop`, 2) hand-craft typed
> fields based on my reading of the manuscript intent, 3) defer
> until you provide a structural template?

## 7. Output

End the run with:

- Coverage summary (chapter X: K/N blocks hand-crafted,
  M/N split, 0 single-Prop remaining).
- Any queued author questions (in `.work/author-questions.md`).
- Pointer to the modified `.lean` files for review.
