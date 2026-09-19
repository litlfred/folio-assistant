---
name: lean-mathlibext-curator
roles: [collaborator, owner]
description: >
  Curate `<Paper>/MathlibExt.lean` — the staging area for upstream-
  candidate lemmas (List/sort plumbing, Foldl/foldr at Monoid
  level, Real-function bridges).  Decide what lives in `MathlibExt`
  vs inline, and tag candidates with `-- TODO upstream: …`.
allowed-tools: Read Edit Bash Grep Glob
---

# `MathlibExt` Curator Skill

## Role

Maintain the `<Paper>/MathlibExt.lean` namespace as a stable, documented
library of Mathlib-style lemmas that the paper repeatedly needs but that
have not yet landed upstream.  Decide whether a one-off helper
inside a proof body should be promoted to `MathlibExt`, and write
`-- TODO upstream: …` annotations against the relevant Mathlib
module so future sweeps can submit them.

## When to Use This Skill

- A `.lean` file inside the paper's lib defines a `private` lemma whose
  signature is general (no project-specific types) and whose proof is
  short.
- A proof body inlines `have : <general identity> := …` more than
  once — the second occurrence triggers promotion.
- After a `lake update` reveals Mathlib added one of the
  candidates — remove from `MathlibExt`, replace with import.

## Stratification (what goes in which section)

Group lemmas into clearly labelled sections by Mathlib home, e.g.:

```
<Paper>/MathlibExt.lean
├─ §1  List / Sort plumbing            (List.sum, insertionSort.sum)
├─ §2  Foldl/foldr at Monoid level     (no commutativity required)
├─ §3  Pairwise Commute / foldl=foldr  (transfer-matrix chain)
├─ §4a Real.sqrt brackets              (lt_sqrt_of_sq_lt etc.)
└─ §4b Real.rpow ↔ Real.sqrt bridges
```

Each lemma must carry:

```lean
/-- ⟨short statement⟩.

    TODO upstream: `Mathlib.<Module>` — ⟨one-line rationale⟩. -/
```

The `TODO upstream:` tag is **required** — it is what makes the
nightly upstream-candidate sweep machine-readable.

## Promotion criteria (inline → `MathlibExt`)

A helper is promoted when **all** hold:

1. **Signature is project-free** — no project-specific types or
   constants.  Pure Mathlib types only.
2. **Used at least twice** in the paper's lib, **OR** plausibly used by
   future work in another paper.
3. **Proof is short** (≤ 10 lines) and uses only Mathlib tactics
   — no project-internal lemmas or project-specific constants.
4. **A reasonable Mathlib home exists** — you can name a module
   that would accept it as a PR.

## Demotion criteria (`MathlibExt` → inline)

Move a lemma out of `MathlibExt` when:

- Mathlib added it under any name — replace with import + alias.
- It became unused after a refactor — remove (do not leave
  dead code in `MathlibExt`).
- Its proof acquired a project-specific dependency — move it back into
  the `<Paper>/<Chapter>/` file that needs it.

## Recipes

### Promoting an inline helper

When you spot

```lean
-- inside MyPaper/SomeChapter/SkewSYT.lean
have sum_insertionSort_eq (xs : List ℕ) (r : ℕ → ℕ → Bool) :
    (xs.insertionSort r).sum = xs.sum :=
  (xs.perm_insertionSort r).symm.sum_eq
```

move it to `MathlibExt.lean` §1, add the TODO tag, and replace
the inline definition with the `MathlibExt` reference (preserve
the local name as a one-line alias if the file uses it heavily):

```lean
-- in MyPaper/MathlibExt.lean
/-- Sorting a list (by any relation) preserves its sum.

    TODO upstream: `Mathlib.Algebra.BigOperators.Group.List` —
    standard permutation-invariance of list sums. -/
theorem List.sum_insertionSort_eq {α} [AddCommMonoid α]
    (xs : List α) (r : α → α → Bool) :
    (xs.insertionSort r).sum = xs.sum :=
  (xs.perm_insertionSort r).symm.sum_eq
```

```lean
-- in MyPaper/SomeChapter/SkewSYT.lean
import MyPaper.MathlibExt
-- alias preserves the original local name
theorem sum_insertionSort_eq (xs : List ℕ) (r : ℕ → ℕ → Bool) :
    (xs.insertionSort r).sum = xs.sum :=
  MyPaper.MathlibExt.List.sum_insertionSort_eq xs r
```

### Generalising before promotion

When you see a `CommMonoid`-level statement that only uses
`mul_assoc`, generalise to `Monoid`.  For example,
`foldl_mul_eq_mul_prod`/`foldr_mul_eq_prod_mul` may be originally
stated over `CommMonoid` but proved at `Monoid` strength;
keep the original `CommMonoid` name as a one-line alias for
back-compat.

## Anti-patterns

- **Never** add a lemma to `MathlibExt` without the
  `TODO upstream: <module>` tag.
- **Never** promote a one-off helper that depends on a
  project-specific constant.
- **Do not** duplicate a Mathlib lemma — `lean_leansearch` /
  `lean_loogle` first; only promote if no Mathlib equivalent
  exists.
- **Do not** put `noncomputable def`s into `MathlibExt` —
  reserve it for `theorem`/`lemma`/`def` that compile.

## Cross-references

- `formalizer.md` §"MathlibExt promotion".
- `lean-build-fix.md` — when a Mathlib bump breaks `MathlibExt`,
  start there before touching consumer files.
