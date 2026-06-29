---
layout: default
title: Proof Simplifier
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/proof-simplifier.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/proof-simplifier.md) — do not edit here.

{% raw %}
# Proof Simplifier

## Role

Review existing proofs in small connected clusters (2–4 declarations that
depend on each other) and identify simplifications across them.

## Lean MCP Tools (paper-assistant)

When the MCP server is available, use it for analysis and alternatives:

| Task | MCP tool | How it helps |
|------|----------|-------------|
| Identify slow tactics | `lean_profile_proof` | Pinpoint which tactic takes >1s |
| Try simpler alternatives | `lean_multi_attempt` | Test shorter tactic chains at the same position |
| Find shared lemmas | `lean_local_search` | Search project for reusable declarations |
| Find Mathlib shortcuts | `lean_leansearch` / `lean_loogle` | May find a single Mathlib lemma replacing 10 lines |
| Check "Try This" | `lean_code_actions` | `simp?` / `exact?` suggestions → minimal proof |
| Verify after simplification | `lean_diagnostic_messages` | Quick check without full `lake build` |
| Check axiom impact | `lean_verify` | Ensure simplification doesn't change axiom deps |

### MCP-first simplification

1. **`lean_profile_proof`** on each theorem in the cluster → identify slow spots
2. **`lean_multi_attempt`** at slow tactic positions → try simpler alternatives
3. **`lean_leansearch`** for the goal → maybe one Mathlib lemma replaces a chain
4. **`lean_code_actions`** with `simp?` → get the minimal simp lemma set
5. **`lean_verify`** after edit → confirm axiom soundness unchanged

## When to use

- After a batch of proofs has been filled in or reviewed
- When `proof-triage` flags a cluster as high-complexity
- When the author asks to simplify or streamline a proof network
- Proactively after any chapter-level editing pass

## Workflow

1. **Select a cluster.** Pick 2–4 declarations that form a connected
   subgraph of the proof dependency graph (e.g.\ a definition, its key
   lemma, and the theorem that uses both).

2. **Read all proofs.** Load the full LaTeX (and Lean, if formalised) for
   every declaration in the cluster.

3. **Check for simplifications.** Look for:

   | Pattern | Action |
   |---------|--------|
   | **Shared construction** — two proofs build the same intermediate object | Extract a shared lemma |
   | **Redundant hypothesis** — a condition assumed in one proof is already implied by another in the cluster | Remove the redundant hypothesis; add a remark |
   | **Shorter path** — a proof can invoke a result from the cluster directly instead of re-deriving it | Replace the derivation with a citation |
   | **Factored abstraction** — a common argument pattern appears across the cluster | Abstract into a named lemma or tactic |
   | **Repeated invocation under same conditions** — a block is cited from 3+ proofs in one chapter, each time with the same restriction or specialisation | Promote the (block + recurring conditions) bundle to a **specialisation lemma**; replace each invocation with a citation of the new lemma |
   | **Recurring sub-derivation** — the same 3-5 line argument (or near-verbatim variant) appears in multiple proofs | Promote to a **proposition** or shared remark; cite from each proof |
   | **Definite-article without source** — phrases like "the canonical $X$" or "the standard $Y$" recur without a single defining block | Add a **definition** block fixing the named object; replace with hyperref |
   | **Unused generality** — a proof works in more generality than needed, making it longer | Specialise to the case actually used |
   | **Duplicate notation** — two proofs introduce the same local notation differently | Unify notation across the cluster |

   The middle three rows are the **repeated-invocation heuristic**:
   when the same block + same conditions appear ≥3 times in a chapter,
   the abstraction is owed regardless of whether the existing proofs
   are individually short. Detection commands:

   ```bash
   # Block cited many times under the same hypothesis suffix
   grep -l '#def:foo' content/<paper>/<chapter>/*-proof.md \
     | xargs grep -l "at the boundary value"
   # Recurring distinctive phrase
   grep -l "by faithfulness of the trace" content/<paper>/<chapter>/*-proof.md
   ```

   This heuristic is also flagged by `proof-gap-audit` §J as an
   inter-proof gap — the two skills cooperate, but `proof-simplifier`
   owns the actual extraction.

4. **Propose changes.** For each simplification found:
   - State the pattern (from the table above)
   - Show the before/after for the affected declarations
   - Estimate the reduction in proof length (lines or steps)
   - Flag any downstream declarations that would need updating

5. **Confirm with the author.** Present simplifications as multiple-choice
   options (the author cannot type easily). Never apply a simplification
   that changes mathematical content without approval.

6. **Apply approved changes.** Edit LaTeX (and Lean stubs if they exist).
   Run `latex-validation` afterward to check cross-references.

## Block-ordering heuristics (from `chapter-complexity-review`)

The same dependency-graph heuristics used for chapter-level reordering
also apply inside a proof cluster. Reuse them before proposing any
simplification:

| Heuristic | Definition | Application in a proof cluster |
|-----------|-----------|------------------------------|
| **Backward edge** | Block A `uses` B but A appears before B in manifest order | A shared lemma is declared *after* its first user → extract and move earlier |
| **Graph energy** | Σ \|position(user) − position(dependency)\| over internal edges | High energy in a cluster = scattered helpers; tightening reduces cognitive load |
| **Span** | \|position(user) − position(dep)\| for one edge | Span > 3 inside a cluster suggests an intermediate abstraction is missing |
| **Max-dependents-first** | Topological order with highest-in-degree nodes earliest | Blocks used by the most cluster members belong at the top of the section |
| **Architectural irreducibles** | Genuine cross-domain cross-refs that cannot be untangled | Accept; annotate with a remark rather than refactor |

### When to apply

1. **Before simplification** — check the cluster's current energy and
   backward edge count; a high-energy cluster often has a missing
   shared lemma (pattern `Shared construction` in the table above).
2. **After simplification** — re-compute energy to confirm the change
   reduced span. If energy increased, the "simpler" proof actually
   scattered dependencies and should be reconsidered.
3. **When extracting a lemma** — the new lemma must land in a position
   that makes all its users forward references (no new backward edges).
4. **When merging two proofs** — verify the merged ordering is
   topologically consistent in the containing chapter.

### Cluster-level ordering fixes

| Situation | Fix |
|-----------|-----|
| Two proofs in the cluster share an auxiliary construction, declared inline in the later one | Extract to a lemma, place before both users (reduces span to 1) |
| Proof B cites Proof A but B's `.ts` appears first in section `blocks[]` | Swap block order in the section manifest (pure metadata edit) |
| Proof C is used by 3 proofs in the cluster and declared last | Promote C to the cluster's first position (max-dependents-first) |
| Cluster has a genuine cycle (A needs B, B needs A) | Extract the shared content to a `Preliminaries`-style block; neither A nor B references the other |

### Tooling

- Re-use the Python helper from `chapter-complexity-review`:
  `compute_energy(ordering, block_data)` — pass only the cluster's
  blocks to scope the computation.
- Report before/after energy alongside proof-length reduction in
  the simplification summary.

## Interaction with other skills

| Skill | Interaction |
|-------|-------------|
| `formalizer` | After simplifying LaTeX, update Lean stubs if formalised |
| `lean-proof-review` | Re-review any Lean proofs affected by the simplification |
| `proof-status-tracking` | Update `proof-objects.json` if declarations are added or removed |
| `category-theory` | Consult for categorical simplifications (adjunction/naturality shortcuts) |
| `proof-triage` | Feeds clusters to this skill based on complexity scores |
| `chapter-complexity-review` | Provides the block-ordering heuristics (backward edges, graph energy, span) reused above |
| `proof-gap-audit` | Flags missing bridging lemmas — often the same shared construction this skill extracts |
| `proof-editor` | Dispatches this skill as part of the coordinated review pass |

## Content Object Integration

Simplified proofs live within **content object triples** (`.ts` + `.md` +
`.lean`). After simplifying a `.lean` file, ensure the content object
stays consistent.

**Post-simplification validation.** Run content object validation
(`content_validate`) after changes to verify:
- The `.ts` manifest's `lean.ref` (URI form `pkg:Decl`, parsed via
  `parseLeanRef()` from `folio-assistant/schemas/lean-packages.ts`) still
  matches the (possibly renamed) Lean declaration.
- The `uses[]` dependencies are still correct — if a shared lemma was
  extracted or a dependency removed, update `uses[]` accordingly.

**Kind determines scope.** Only blocks with `kind` requiring Lean
(`definition`, `theorem`, `lemma`, `proposition`, `corollary`) are
candidates for proof simplification. The `uses[]` graph identifies the
cluster boundary — simplify within a connected subgraph of content
objects, not across unrelated blocks.

## Common anti-patterns (mechanically fixable)

These patterns should be flagged and fixed automatically during any
simplification pass:

| Anti-pattern | Fix |
|-------------|-----|
| `by exact X` | `X` (drop tactic wrapper) |
| `by rfl` | `rfl` (term-mode) |
| `unfold f; simp [...]` | `simp [f, ...]` |
| `unfold f; rw [h₁, h₂, ...]` | `simp [f, h₁, h₂, ...]` |
| `have h := foo; linarith` | `linarith [foo]` |
| `have h := foo; exact h` | `exact foo` |
| `apply f; apply g x` | `exact f (g x)` |
| `rw [h]; simp [sub_self]` | `simp [h, sub_self]` |
| `@Zero.zero T inst.toZero` | `(0 : T)` |
| Theorem restating a structure field | Delete it; use `s.field` directly |
| `rw [retraction]; rfl` | `congr_fun (congr_arg DFunLike.coe retraction) x` |
| Duplicate docstrings on a field | Keep only the latest version |

## Constraints

- Never merge or delete declarations without author approval
- Keep all label/ref identifiers stable (or update all cross-references)
- Prefer fewer, simpler lemmas over clever one-liners
- Document the simplification in a `% Simplified from ...` comment
{% endraw %}
