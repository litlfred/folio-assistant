---
layout: default
title: Lean Build Fix
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/lean-build-fix.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/lean-build-fix.md) — do not edit here.

{% raw %}
# Lean Build Fix Skill

## Role

Automate the iterative cycle of: build Lean project, diagnose errors,
apply fixes, rebuild — until `lake build` passes with zero errors and
zero fixable warnings.

## When to Use This Skill

- "fix lean build errors"
- "lean build is broken"
- "lake build fails"
- "fix build errors and warnings"
- "make the lean build pass"
- After Mathlib version bumps that introduce API renames
- After bulk edits to `.lean` files that may have introduced syntax errors

## Prerequisite: working Lean MCP

This skill assumes `lean_diagnostic_messages` returns real items, not
timeouts. If your MCP queries return `success: false, items: []`
(60 s timeout) OR `lake exe cache get` returns 403 on every shard,
route to **[`lean-environment-setup` §"Mathlib cache 403 fallback"](lean-environment-setup.md#mathlib-cache-403-fallback-proven-workaround)**
first — the proven workaround is a `git clone` of mathlib4 to a sibling
directory plus a `git config --global url.insteadOf` redirect.
Don't start iterating blind — establish LSP feedback first.

## Lean MCP Tools (paper-assistant)

When the MCP server is available, **prefer MCP tools over shell commands**:

| Old workflow | MCP tool | Why better |
|---|---|---|
| `lake build` + parse output | `lean_build` | Triggers build, returns structured result |
| grep for errors in output | `lean_diagnostic_messages` | Per-file structured errors/warnings |
| manual hover to check types | `lean_hover_info` | Type info at any position |
| grep Mathlib for API names | `lean_leansearch` / `lean_loogle` | Semantic + type-signature search |
| edit-build-repeat | `lean_multi_attempt` | Try multiple tactic alternatives in one call |
| manual axiom check | `lean_verify` | Axiom dependency audit |

### MCP-first workflow

1. Run `lean_build` to trigger a full build
2. Run `lean_diagnostic_messages` on each failing file to get structured errors
3. For each error, diagnose and fix (see error taxonomy below)
4. After fixing all errors in a file, run `lean_diagnostic_messages` on that
   file to verify before moving to the next
5. Once all files are clean, run `lean_build` to confirm full success
6. Address warnings (dupNamespace, unused variables) as a final pass

### Fallback workflow (no MCP)

When the MCP server is unavailable, parse `lake build` output directly
**from the repo root** (the root workspace builds all paper packages
in one pass):

```bash
lake build 2>&1                       # build every paper
lake build MyPaper 2>&1               # or just one library
```

Per-paper `cd content/<paper>/lean && lake build` still works, but the
root workspace resolves cross-paper imports in a single pass and is the
standardized entry point.

Parse the output for lines matching:
- `error:` — build-breaking errors (must fix)
- `warning:` — linter warnings (fix if possible)
- `Building` / `Built` / `Replayed` — progress indicators

## Error Taxonomy and Fix Patterns

### 1. Unknown identifier / Unknown constant

**Pattern**: `Unknown identifier 'foo'` or `Unknown constant 'foo'`

**Diagnosis**: API was renamed in Mathlib or Lean core.

**Fix strategy** (try in order):
1. **MCP search**: `lean_leansearch` or `lean_loogle` with the type signature
2. **Common renames** (check this table first):

| Old name | New name / workaround | Version |
|----------|----------------------|---------|
| `Mathlib.Topology.ContinuousFunction.Basic` | `Mathlib.Topology.ContinuousMap.Basic` | Mathlib 2024+ |
| `Mathlib.Geometry.Manifold.SmoothManifoldWithCorners` | `Mathlib.Geometry.Manifold.IsManifold.Basic` | Mathlib 2024+ |
| `Mathlib.CategoryTheory.Monoidal.Basic` | `Mathlib.CategoryTheory.Monoidal.Category` | Mathlib 2024+ |
| `lt_div_iff` / `div_lt_iff` | **Nonexistent** — use `by_contra` + `div_mul_cancel₀` pattern (see below) | Lean 4.24 |
| `div_lt_div_iff` | **Nonexistent** — same workaround | Lean 4.24 |
| `unfold_let x` | **Nonexistent** — use `show <expanded> ...` to unfold local `set` defs | Lean 4.24 |
| `sq_pos_of_ne_zero _ h` | `sq_pos_of_ne_zero h` (no underscore arg) | Lean 4.24 |
| `List.Lex.cons x proof` | `List.Lex.cons proof` (element arg now implicit) | Lean 4.24 |
| `List.Lex.wellFounded` | **Nonexistent** — use `sorry` pending MCP search | Lean 4.24 |
| `pow_le_pow_left` | varies by type | Mathlib 2024+ |
| `Finset.max'` | varies | Mathlib 2024+ |

3. **Suffix conventions**: Try adding `₀` suffix (e.g., `one_lt_pow₀`,
   `pow_lt_one₀`, `div_mul_cancel₀`) — Mathlib uses `₀` for variants
   with weaker hypotheses
4. **Division bound workaround** (when `lt_div_iff`/`div_lt_iff` don't exist):

```lean
-- To prove: a < 1 / b  (given b > 0)
have key : a * b < 1 := by nlinarith  -- prove multiplication form
by_contra h; push_neg at h             -- assume 1/b ≤ a
have : 1 ≤ a * b :=                   -- derive contradiction
  calc 1 = 1 / b * b := (div_mul_cancel₀ 1 (ne_of_gt hb_pos)).symm
    _ ≤ a * b := mul_le_mul_of_nonneg_right h (le_of_lt hb_pos)
linarith                               -- contradicts key
```

5. **`show` pattern for local `set` definitions** (when `unfold_let` doesn't exist):

```lean
set r := vol / ratio
have hr_pos : r > 0 := by
  show vol / ratio > 0        -- expand r to its definition
  apply div_pos <;> positivity
```

6. **If unfound**: Replace with `sorry` + bibliographic `-- Ref:` citation,
   noting the missing API in a comment

### 1b. Import ordering and hygiene

**Imports must be at the very top of the file**, before any content
including `/-! ... -/` doc comments. Lean 4 rejects imports after
non-import content:

```lean
-- WRONG: doc comment before imports
/-! # Module docs -/
import Mathlib.Data.Real.Basic

-- RIGHT: imports first, then doc comment
import Mathlib.Data.Real.Basic
/-! # Module docs -/
```

**Ambiguous identifiers from `open`**: When two opened namespaces
export the same name (e.g., `Foo.my_lemma` vs `Bar.my_lemma`), remove
the less-needed namespace from `open` or qualify the ambiguous name.

**Explicit Mathlib imports**: Prefer explicit imports for Mathlib
features used directly (tactics, types) rather than relying on
transitive imports. This protects against upstream import changes:

```lean
-- Defensive: import what you use
import Mathlib.Data.Nat.Prime.Basic    -- for Nat.Prime
import Mathlib.Tactic.Omega           -- for omega
import Mathlib.Tactic.Ring            -- for ring
import Mathlib.Tactic.Linarith        -- for linarith/nlinarith
import Mathlib.Tactic.NormNum         -- for norm_num
import Mathlib.Tactic.Positivity      -- for positivity
import Mathlib.Tactic.FieldSimp       -- for field_simp
```

### 2. Unexpected token / Parse errors

**Pattern**: `unexpected token '⟨'; expected command`

**Common causes**:
- **`cases with` destructuring**: Lean 4's `cases ... with | inr ⟨a, b⟩ =>`
  does NOT support anonymous constructor patterns. Fix: use `rcases` instead.

```lean
-- WRONG:
cases h with
| inr ⟨heq, hrest⟩ => ...

-- RIGHT:
rcases h with hrank | ⟨heq, hrest⟩
· ...
· ...
```

- **`set_option ... in` placement**: Must come BEFORE doc comments, not between
  `/-- ... -/` and the declaration.

```lean
-- WRONG:
/-- Doc comment -/
set_option linter.dupNamespace false in
abbrev Foo := Bar

-- RIGHT:
set_option linter.dupNamespace false in
/-- Doc comment -/
abbrev Foo := Bar
```

### 3. Type mismatch

**Pattern**: `Type mismatch ... has type X but is expected to have type Y`

**Fix strategy**:
1. Read the full error to understand what type is expected vs provided
2. Check if a rewrite (`rw`, `▸`) can bridge the gap
3. Check if the wrong overload was selected (e.g., `ℕ` vs `ℝ` variant)
4. For `Prod.Lex.right`: requires equal first components — use `heq ▸` to
   rewrite before applying

### 4. Unsolved goals

**Pattern**: `unsolved goals ... ⊢ <goal>`

**Fix strategy**:
1. Read the goal state carefully
2. Check if the issue is `≤` vs `<` (strict vs non-strict) — a common
   source of `linarith` failures
3. Try tactic alternatives per the standard tactic table:

| Goal pattern | Try first | Then try |
|---|---|---|
| Algebraic identity | `ring` | `field_simp; ring` |
| Non-negativity | `positivity` | `linarith` |
| Numeric | `norm_num` | `linarith` |
| Definitional | `rfl` | `unfold ...; rfl` |
| Diagram/naturality | `aesop_cat` | `slice_lhs`/`slice_rhs` |
| Monotonicity | `gcongr` | explicit lemma |
| Anything else | `simp` | `aesop` |

4. If `gcongr` closes the goal completely, don't add further tactics
   (check for "No goals to be solved" on the next line)

### 5. Application type mismatch

**Pattern**: `Application type mismatch: The argument ... has type X but is
expected to have type Y`

**Common causes**:
- Using a `ℕ`-specific lemma on `ℝ` (e.g., `pow_le_pow_left₀` is Nat-only)
- Wrong arity or argument order after API rename
- Need `le_of_lt` or `lt_of_le_of_lt` to convert between `<` and `≤`

### 6. Tactic made no progress

**Pattern**: `'simp' made no progress` or `'rw' made no progress`

**Fix**: The expression is already in the target form, or the rewrite
rule doesn't match syntactically. Remove the non-progressing tactic or
replace with a different approach.

### 7. No goals to be solved

**Pattern**: `No goals to be solved`

**Fix**: A previous tactic closed the goal completely. Remove the
subsequent tactic(s) that have nothing left to prove.

### Spurious ℝ-specialisation (the project authoring conventions)

**Pattern**: A categorical / algebraic identity is declared over `ℝ`
without needing any archimedean operation (no `Real.sqrt`, `Real.rpow`,
`Real.cos`, `Real.exp`, `Real.log`, no ordering predicate, no
`linarith` / `positivity`). Build errors then cascade when a downstream
consumer wants to instantiate the same identity over `ℚ`, `ℂ`, or a
formal power series ring.

**Fix**: Refactor the declaration to use a generic type variable
`{R : Type*}` with the weakest typeclass that admits the construction
(`[CommRing R]`, `[Field R]`, `[GroupWithZero R]`, etc.). Concrete
`ℝ`-evaluations live in a separate file (e.g. under an `evaluations/` or
`observations/` subtree) that consumes the generic result via a
`(R := ℝ)` instantiation.

```lean
-- Before — ℝ-specialised by accident
noncomputable def qBracket (q : ℝ) (n : ℕ) : ℝ :=
  (q ^ n - q ^ (-(n : ℤ))) / (q - q⁻¹)

-- After — generic
def qBracket {R : Type*} [Field R] (q : R) (n : ℕ) : R :=
  (q ^ n - q ^ (-(n : ℤ))) / (q - q⁻¹)
```

If the declaration **does** cross the archimedean wall, keep `ℝ` but
document the specific archimedean construct in the docstring (e.g.
`/-- … uses `Real.sqrt` so this is ℝ-specific. -/`).

## Linter Warning Fixes

### dupNamespace

**Pattern**: `The namespace 'Foo' is duplicated in the declaration 'X.Foo.Foo'`

**Fix**: When a structure/abbrev name matches its enclosing namespace
(intentional), suppress with `set_option linter.dupNamespace false in`
placed BEFORE the doc comment.

### Unused variable

**Pattern**: `unused variable 'x'`

**Fix**: Prefix with underscore: `x` → `_x`

### Declaration uses sorry

**Not a fix target** — these are expected incomplete proofs with
bibliographic citations. Only flag if the `sorry` lacks a `-- Ref:` comment.

## Iteration Protocol

1. **Collect all errors** from the build output before fixing anything
2. **Group by file** — fix all errors in one file before moving to the next
3. **Fix errors before warnings** — errors block the build; warnings don't
4. **After each file's fixes**, verify with `lean_diagnostic_messages` (MCP)
   or a targeted rebuild
5. **Commit after each logical group** of fixes with a descriptive message
   explaining what was broken and why
6. **Final full build** to confirm zero errors
7. **Warning pass** — address fixable warnings (dupNamespace, unused vars)
8. **Final commit and push**

## Commit Message Convention

```
Fix Lean build errors: <summary>

<File>:
- <old API/syntax> → <new API/syntax> (<reason>)

<File>:
- <description of fix>
```

## Checklist

- [ ] All `error:` lines from build output are resolved
- [ ] All fixable `warning:` lines are resolved
- [ ] No new `sorry` introduced without `-- Ref:` citation
- [ ] `lake build` passes with zero errors
- [ ] Changes committed with descriptive messages
- [ ] Changes pushed to the working branch
{% endraw %}
