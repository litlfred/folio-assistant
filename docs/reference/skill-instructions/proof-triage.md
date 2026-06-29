---
layout: default
title: Proof Triage & Resolution
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/proof-triage.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/proof-triage.md) — do not edit here.

{% raw %}
# Proof Triage & Resolution

## Overview

This skill examines the entire Lean codebase for unresolved `sorry` markers,
builds a dependency-ordered work list, and iteratively attempts to replace each
`sorry` with a valid proof or well-typed definition.  When a proof attempt
fails, it searches existing libraries for similar statements and presents these
to a proof writer for guidance.

## When to Use This Skill

- After a formalization pass leaves `sorry` stubs
- After a `lake build` produces sorry warnings or type errors
- When onboarding a new chapter and filling in proof obligations
- Periodically as a "proof debt" sweep

## Lean MCP Tools (paper-assistant)

When the MCP server is available, it **transforms every phase** of triage:

| Phase | Old workflow | MCP tool | Improvement |
|-------|-------------|----------|-------------|
| Inventory | `grep sorry` + manual classification | `lean_diagnostic_messages` | Structured sorry warnings with file/line/type |
| Goal reading | Manual file reading | `lean_goal` | Live goal state at each sorry position |
| Mathlib search | `Grep` on Mathlib source | `lean_leansearch` | Natural language: "lemma about positivity of norms" |
| Type-sig search | Manual `exact?` | `lean_loogle` | Type signature search: "_ → 0 ≤ _" |
| Tactic attempts | Edit → `lake build` → repeat | `lean_multi_attempt` | Try 5+ tactics at once, get goal states for each |
| "Try This" | Read `lake build` output | `lean_code_actions` | Get resolved edits directly |
| Verification | `lake build` | `lean_diagnostic_messages` | Per-file, no full rebuild |
| Axiom check | `axiom_report.py` | `lean_verify` | Axioms used by a specific theorem |
| Similar lemmas | Grep for conclusion type | `lean_local_search` | Ripgrep-powered search across project + stdlib |

### MCP-first triage loop (replaces Phases 3–4)

For each sorry site:

```
1. lean_goal          → read the goal
2. lean_multi_attempt → try [simp, ring, linarith, aesop, positivity, omega]
3. If all fail:
   a. lean_leansearch  → "what lemma proves <goal in words>?"
   b. lean_loogle      → search by type signature of the goal
   c. lean_code_actions → check for "Try This" suggestions
4. If a tactic works:
   a. Apply the edit
   b. lean_diagnostic_messages → verify no new errors
   c. lean_verify → check axiom soundness
5. If nothing works:
   a. lean_local_search for similar declarations in the project
   b. Escalate with goal state + failed attempts + similar lemmas
```

This loop replaces the edit-build-check cycle with **interactive feedback**
that doesn't require a full `lake build` between attempts.

## Prerequisites

- `lake build` should be run once before starting (to populate oleans)
- paper-assistant MCP server configured (`.mcp.json`)
- Mathlib4 and any project-specific libraries are in `lakefile.toml`
  (per-paper) and aggregated in the root `/lakefile.toml`
- The Lean files follow the project's naming conventions

## Workflow

### Phase 1 — Inventory

1. **`lean_diagnostic_messages`** on each file (or `grep sorry` as fallback)
2. For each hit, classify into one of:
   - **Type stub**: `def X : Type* := sorry` — needs a concrete type or structure
   - **Proof stub**: `theorem/lemma ... := sorry` or `by sorry` — needs a proof
   - **Field stub**: a structure field defaulting to `sorry` — needs a value or proof
   - **Axiom placeholder**: `sorry` with a comment like "deferred to Ch.N" — skip for now
3. Record each sorry site:
   - File path and line number
   - Declaration name
   - Classification (type / proof / field / axiom-placeholder)
   - Statement signature (hypotheses and goal type)
   - Any `-- sorry:` or adjacent comment explaining the deferral
   - **Criticality** (`routine` | `core` | `restates-target`, per
     [`proof-gap-audit`](proof-gap-audit.md) §"Gap criticality").
     `restates-target` is an **auto-fail**: do not attempt it — escalate,
     because the block is mis-typed (it defers the target itself), not
     merely under-proved.

### Phase 2 — Dependency Ordering

1. For each sorry site, identify **what it depends on**:
   - Other definitions/structures referenced in its type signature
   - Imports from mathlib or other project files
2. Build a rough dependency DAG:
   - Glossary type stubs are leaves (no intra-project dependencies)
   - Theorem stubs depend on the structures they quantify over
   - Chapter-level theorems may depend on cross-chapter definitions
3. **Priority ordering** (work on these first → last):
   1. Standalone field proofs (e.g. `error_nonneg : 0 ≤ x`)
   2. Limit / degeneration theorems (e.g. a parameter limit reducing to a known case)
   3. Algebraic identities provable by `ring` / `field_simp` / `linarith`
   4. Approximation lemmas requiring `norm_num` or `native_decide`
   5. Type stubs that need concrete structure definitions
   6. Deep mathematical content deferred to later chapters

**Criticality overlay (value, not just ease).** The ordering above is by
*ease* (quick mechanical wins build confidence). Cross it with the *value*
axis from [`proof-gap-audit`](proof-gap-audit.md) §"Gap criticality": once
the mechanical wins are banked, attack `core` gaps (where the result's idea
lives) ahead of remaining `routine` ones, and never *attempt* a
`restates-target` gap — it is a non-proof to escalate, not a `sorry` to
discharge. *An honest gap beats a no-gap dead end.*

### Phase 3 — Iterative Proof Attempts

For each sorry site, in priority order:

1. **Read the declaration** and its surrounding context (10 lines above/below)
2. **Identify the goal type** — what needs to be proved or constructed
3. **Search for relevant lemmas** (MCP preferred):
   - **`lean_leansearch`** with a natural language description of the goal
   - **`lean_loogle`** with the type signature of the goal
   - **`lean_local_search`** for similar declarations in the project
   - Fallback: `Grep` on Mathlib source for key terms
4. **Attempt a proof** (MCP preferred):
   - **`lean_multi_attempt`** with all candidate tactics at once:
     `[simp, ring, linarith, positivity, omega, norm_num, aesop]`
   - **`lean_code_actions`** on the sorry line for "Try This" suggestions
   - For positivity: `by positivity` or `by linarith` with explicit bounds
   - For approximation: `by norm_num` or `by native_decide`
   - For algebraic: `by ring` or `by field_simp; ring`
   - Fallback: edit + `lake build` cycle
5. **Test the proof**:
   - **`lean_diagnostic_messages`** on the file (fast, per-file)
   - Fallback: `lake build` on the specific file
6. **Record the outcome**:
   - **Success**: mark as resolved, move to next
   - **Failure**: capture the error message, proceed to Phase 4

### Phase 4 — Escalation to Proof Writer

When a proof attempt fails:

1. **Document the failure**:
   - The exact declaration and goal type
   - What tactics were tried and what errors resulted
   - The specific Lean error message
2. **Search for similar statements**:
   - Grep mathlib for lemmas with similar conclusion types
   - Look for generalizations that could be specialized
   - Check if the statement holds under stronger hypotheses
3. **Present to proof writer** with:
   - The original statement
   - 2–3 similar lemmas from mathlib that are "close but not matching"
   - A suggestion of which mathlib lemma might be adaptable
   - Any missing hypotheses that would make the proof go through
4. **Iterate**: incorporate proof writer feedback, retry, repeat

### Phase 5 — Build Verification

After each batch of resolved sorries:

1. Run `lake build` on the modified files
2. Check for:
   - New type errors introduced by proof changes
   - Sorry warnings (expected for remaining stubs)
   - Successful compilation of resolved proofs
3. If a previously-resolved proof breaks:
   - Add it back to the work list
   - Re-examine dependencies that may have changed

### Phase 6 — Commit & Report

1. Commit resolved proofs in logical batches:
   - One commit per file, or per thematic group
   - Message pattern: `feat(lean): prove <theorem-names> in <File>.lean`
2. Generate a summary table:

   | Declaration | File | Status | Tactic | Notes |
   |-------------|------|--------|--------|-------|
   | `error_nonneg` | MyPaper.Foo | Resolved | `linarith` | — |
   | `main_commutative_diagram` | MyPaper.Bar | Deferred | — | Ch.11 |

3. Update any tracking files (proof-objects.json if present)

## Tactic Cheat Sheet

| Goal Pattern | Try First | Then Try |
|-------------|-----------|----------|
| `0 ≤ x` | `positivity` | `linarith [hyp]` |
| `x = y` (algebraic) | `ring` | `field_simp; ring` |
| `x = y` (definitional) | `rfl` | `unfold ...; rfl` |
| `x = 0` (limit/degeneration) | `unfold ...; rw [h]; ring` | `simp [h]` |
| `x < y` (numeric) | `norm_num` | `linarith` |
| `∃ x, P x` | `exact ⟨witness, proof⟩` | `use witness; simp` |
| `P ∧ Q` | `exact ⟨proof_P, proof_Q⟩` | `constructor <;> simp` |
| `P → Q` | `intro h; exact ...` | `fun h => ...` |
| Anything | `simp` | `aesop` |

## Common Mistakes to Avoid

### 1. Ill-typed theorem conclusions (`= True` anti-pattern)

**Wrong:**
```lean
theorem self_dual_curvature ... : inst.self_dual hn = True := by sorry
```
Here `inst.self_dual hn` is a *term of type `True`* (a proof), while `True` is
a *type* (`Prop`).  You cannot compare a proof to its type with `=`.

**Right:**
```lean
theorem self_dual_curvature ... : inst.self_dual hn := by sorry
```
When the goal is to *prove* a proposition, the conclusion IS the proposition,
not `proposition = True`.  Before resolving any sorry, verify the statement
is well-typed by checking that `lake build` produces a sorry warning (not a
type error).

### 2. Placeholder field axioms: prefer `True := by trivial`

**Wrong:**
```lean
laplacian_vanishes : ∀ (p : M), (0 : ℝ) = 0  -- placeholder for Δ α = 0
```
This is technically provable but semantically misleading — it universally
quantifies over an unused variable and states a tautology unrelated to the
real axiom.

**Right:**
```lean
laplacian_vanishes : True := by trivial  -- placeholder for Δ α = 0
```
Use `True := by trivial` for placeholder axioms.  It's immediately discharged,
clearly marks itself as a placeholder, and is consistent with other axiom
placeholders in the codebase.

### 3. Pin external dependencies to commit hashes

In `lakefile.toml`, never track `main` for external dependencies:
```toml
# Wrong: tracks a moving target, non-reproducible builds
[[require]]
name = "someDep"
git  = "https://github.com/example/some-dep"
rev  = "main"

# Right: pinned to a specific commit
[[require]]
name = "someDep"
git  = "https://github.com/example/some-dep"
rev  = "abc1234def5678"
```
After adding a new dependency, run `lake update` and use the commit hash from
the generated `lake-manifest.json`.

### 4. Glossary notation consistency

In `glossary.json`, follow the existing notation conventions:
- Use `q^-1` not `q^{-1}` (no LaTeX-style braces in JSON narrative fields)
- Use `K^pm 1` not `K^{pm 1}`
- Use `mapsto` not `->` for function mappings
- Use `textstylesum` not `sum` for summation notation
- Check 2–3 neighboring entries for the prevailing style before adding new ones

## Current Sorry Inventory

Live state — **do not** maintain a static snapshot in this skill file
(prior dated tables drifted within months and misled fresh agents).
Pull the current inventory at the start of each triage pass:

| Source | Command |
|--------|---------|
| All sorry sites with file/line/category | `lean_diagnostic_messages` per file (MCP), or `grep -rn 'sorry' content/<paper>/lean/` as fallback |
| Per-block formalization status | Read `proof-objects.json` (CI artefact, derived from Lean diagnostics) |
| Axiom dependencies for any theorem | `lean_verify` |
| Bibliographic backing of each sorry | `grep -B2 'sorry' <file>.lean` — every sorry must carry a `-- Ref: [key]` line per the project authoring conventions |

When triaging, classify each live sorry into the four categories from
Phase 1 (type stub / proof stub / field stub / axiom placeholder) and
apply the priority ordering from Phase 2.

## Feedback & Iteration Notes

These notes capture lessons learned from applying the skill across the codebase.
Update them after each triage pass.

### Classification Boundaries

- **Glossary type stubs** (`def X : Type* := sorry`) are **design tasks**, not
  proof tasks.  They need a concrete `structure`/`class`/`inductive`.  Route
  them through Phase 3b (Design Review), not Phase 3 (Proof Attempts).
- **Structure field defaults** (`field : P := by sorry`) are a special case:
  the sorry lives in the structure definition but must be resolved per-instance.
  The fix is usually to remove the default and provide explicit proofs at each
  construction site.  This is a **refactoring task**, not a single proof.
- **Axiom placeholders** (`True := by trivial` with `-- axiom placeholder`
  comment) are sorry-free by design.  Do not count them in the sorry inventory.
- **`axiom` declarations** (if any remain) are intentionally unproved — they
  represent conjectures or assumptions stated honestly.

### Common Proof Patterns

- **Limit / degeneration theorems** (a parameter limit reducing to a known
  case) are the easiest wins. Pattern: `unfold <op>; rw [hq, inv_one,
  sub_self, ...]; ring`.  Always attempt these first — they build confidence
  and verify the operator definitions.
- **Approximation lemmas** on `noncomputable def` values: always `unfold` first.
  Without `unfold`, `norm_num` sees an opaque constant and fails silently.
- **Division rearrangement** (`a/b = c ↔ b*c = a`): `field_simp` is the
  correct first move.  Always provide `h : b ≠ 0` (or `pow_ne_zero` for `b²`).
- **Composed numeric expressions** (e.g. `1 - 1/(1.1097)`): if `norm_num` fails
  after `unfold`, rewrite the constant as an explicit rational (`11097/10000`).

### Escalation Triggers

- **>10 minutes on a single sorry**: move on.  The iterative approach means
  it's better to attempt the next sorry and come back with new information.
- **Nonlinear real arithmetic** (square roots, reciprocal composition): these
  almost never yield to `norm_num`/`linarith`.  Escalate immediately with:
  (a) the exact goal after `unfold`, (b) which tactics were tried,
  (c) a suggestion to use `polyrith` or rational rewriting.
- **Missing mathlib lemma**: if you need a helper that doesn't exist, state it
  as a local `have` or `lemma` and prove it.  Don't wait for upstream.

### Process Notes

- **Deferred axiom placeholders** should be skipped unless the referenced
  chapter has been formalized.  Check comments for `-- deferred to Ch.N`.
- **Build errors vs sorry warnings**: A sorry warning means the file compiles
  but has holes.  A build error means something is broken.  Always fix build
  errors before attempting new proofs.
- **Batch size**: resolve 3–5 sorries per commit.  Larger batches make it
  harder to bisect if a proof breaks something downstream.
- **Sorry comments**: after each failed attempt, update the sorry comment with
  what was tried.  This saves future triage passes from repeating work.

## Content Object Integration

Each formalizable item lives as a **triple**: `block.ts` (typed manifest with
`kind`, `label`, and `lean.ref` URI), `block.md` (narrative), and
`block.lean` (formalization). The `.ts` manifest is authoritative — it
determines whether a block requires Lean. Formalization status is **not**
stored in `.ts`; it is derived at build time and written to
`proof-objects.json`.

**Kind-aware filtering.** Only triage blocks whose `kind` requires Lean:
- `definition`: `.lean` required — always triage if sorry present.
- `theorem` / `lemma` / `proposition` / `corollary`: `.lean` expected — triage.
- `example` / `remark` / `conjecture`: `.lean` optional — triage only if a
  `.lean` sibling exists and contains sorry.
- `prose` / `equation` / `diagram`: no Lean — **skip entirely**.

**Dependency-driven prioritization.** Use the `uses[]` field in `.ts`
manifests to order the work list: blocks depended on by many others should
be resolved first. This replaces or supplements the DAG built from Lean
imports in Phase 2.

**Source of truth.** Formalization status is derived at build time from
`.lean` file content and Lean build output, then written to
`proof-objects.json`. It is not stored in `.ts` manifests.

## Checklist

- [ ] All `.lean` files grepped for `sorry`
- [ ] Each sorry classified (type / proof / field / axiom-placeholder)
- [ ] Theorem statements checked for well-typedness (no `= True` anti-pattern)
- [ ] Placeholder axioms use `True := by trivial` consistently
- [ ] Dependency order established
- [ ] Easy proofs attempted first (positivity, ring, limit cases)
- [ ] `noncomputable def` values unfolded before `norm_num`
- [ ] Mathlib searched for similar lemmas on failed attempts
- [ ] Failed proofs documented with similar-lemma suggestions
- [ ] `lake build` passes (sorry warnings OK, errors not OK)
- [ ] External deps pinned to commit hashes in `lakefile.toml`
- [ ] Resolved proofs committed with descriptive messages
- [ ] Summary table generated
{% endraw %}
