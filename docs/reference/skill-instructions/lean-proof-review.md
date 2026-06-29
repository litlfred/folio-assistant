---
layout: default
title: Lean Proof Review
parent: Skill instructions
---

{: .note }
> Generated from [`skills/folio-paper-adapter/lean-proof-review.md`](https://github.com/litlfred/folio-assistant/blob/main/skills/folio-paper-adapter/lean-proof-review.md) — do not edit here.

{% raw %}
# Lean Proof Review

## Overview

This skill defines how Lean proofs are reviewed by human and agentic reviewers.
Reviews are stored as structured records in `proof-objects.json`, attached to
individual proof objects.  The skill integrates with the existing agent-review
workflow.

## When to Use This Skill

- When reviewing a PR that modifies `lean/<Paper>/*.lean` files
- When reviewing LaTeX changes that affect theorem statements
- When running the agent-review pipeline with Lean content
- When a code review touches files linked to proof objects

## Lean MCP Tools (paper-assistant)

When the MCP server is available, **use MCP tools for all review checks**:

| Review check | MCP tool | What it replaces |
|-------------|----------|-----------------|
| Type-checks (`lake build`) | `lean_diagnostic_messages` | Structured errors, no build needed |
| Sorry audit | `lean_diagnostic_messages` | Filter warnings for sorry count |
| Axiom dependencies | `lean_verify` | Returns axioms used + optional source scan |
| Tactic quality | `lean_profile_proof` | Identifies slow tactics in a theorem |
| Statement correctness | `lean_hover_info` | Check types of all symbols in statement |
| Cross-references | `lean_references` | Find all uses of a declaration |
| Declaration source | `lean_declaration_file` | Jump to where a symbol is defined |

### MCP-enhanced review workflow

1. **`lean_diagnostic_messages`** on the file under review → all errors/warnings
2. **`lean_verify`** on each theorem → axiom audit (no `sorry`, no `Decidable.em` surprises)
3. **`lean_profile_proof`** on complex theorems → flag tactics taking >1s
4. **`lean_hover_info`** on key terms → verify types match LaTeX intent
5. **`lean_references`** on modified declarations → check downstream impact
6. **`git diff` + `lean_verify`** → statement integrity: no provable-kind
   signature was weakened to pass, no axiom injection (see Review Type 4)

## Review Types

### 1. Lean Proof Check (`lean-proof-check`)

Verifies:
- Declaration type-checks (`lake build` passes)
- No unexpected `sorry` usage
- Correct use of mathlib tactics and lemmas
- Style conformance (naming, documentation)

### 2. Mathematical Rigor (`mathematical-rigor`)

Verifies:
- The Lean statement faithfully captures the LaTeX theorem
- Proof strategy is sound (not just type-correct but mathematically meaningful)
- Dependencies are correctly modeled

### 3. Scientific Accuracy (`scientific-accuracy`)

Existing review type — extended to cover Lean formalization:
- Does the formal statement match the mathematical intent?
- Are the modelling assumptions correctly encoded?

### 4. Statement integrity (`statement-integrity`)

Guards against the *most dangerous* way a "proof" can pass: silently
weakening or altering the **statement** until the compiler is satisfied.

Verifies:
- **Signature unchanged.** For every provable-kind block touched on the
  branch — content kinds `proposition`/`corollary`/`theorem`/`lemma` all
  render to a Lean `theorem` or `lemma` declaration — the *signature* (name,
  binders, hypotheses, conclusion type) is identical to its prior-commit
  form — only the proof body changed. A signature change is permitted
  **only** as an explicit, author-approved restatement, reflected in the
  `.md` statement and `.ts` manifest in the same diff.
- **No axiom injection.** `lean_verify` on the (sorry-free) declaration
  shows no `sorryAx` and no axioms beyond the declared set — no laundering a
  hole through a `Classical`-shaped placeholder or an axiomatised helper
  that is not a registered conjecture class (the project authoring conventions-cond).
- **No degenerate conditional-class projection.** A §3b-cond block must
  *derive* its conclusion from class-axiomatised **hypotheses** — it must not
  carry the conclusion itself as a class field and project it
  (`theorem foo [Ctx] : claim := ctx.claim_foo`). That self-assuming
  projection passes the conjectural-propagation audit (cone is
  class-axiomatised) but **fails integrity** — the Lean asserts the `.md`
  claim, it does not prove it. Fix: the class carries the genuine
  sub-hypotheses / proof-chain steps; the theorem composes them (AGENTS.md
  §3b-cond condition 5; an exemplar carries the two iff directions and
  derives the iff by `Iff.intro`). See `lean-proof-vacuity-audit.md`.
- **Base ring (§7c).** A statement-integrity fix stays over a generic
  `{R : Type*} [CommRing R]`; reach for `ℝ` only when an archimedean
  construct is genuinely required, *post-wall* — never via a chapter
  `Shared` import that transitively pulls in `Mathlib.Data.Real.Basic`.
  Verify the fixed declaration with `lake build -R <Module>` (a whole-lib
  `lake build <Paper>` may be red on pre-existing failures and is **not**
  the gate).

Recipe:

```bash
# 1. signatures changed on this branch (provable kinds only)
git diff origin/main...HEAD -- '*.lean' \
  | grep -E '^[-+][[:space:]]*(theorem|lemma) '   # Lean keywords (content prop/cor render to these); heuristic — confirm multi-line signatures by hand
# 2. for each decl now claimed proved, axiom audit (expect no sorryAx)
#    lean_verify MyPaper.<Namespace>.<decl>
```

A weakened-statement or injected-axiom finding is **critical** →
`REQUEST_CHANGES`. CI option: vendor a verifier such as
[`GasStationManager/SafeVerify`](https://github.com/GasStationManager/SafeVerify)
(Apache-2.0) into your Lean CI to mechanise both checks.

## Review Record Schema

Each review is stored in `proof-objects.json` under the object's `reviews` array:

```json
{
  "reviewer_id": "claude-opus-4",
  "reviewer_type": "agentic",
  "review_type": "lean-proof-check",
  "timestamp": "2026-03-19T12:00:00Z",
  "verdict": "APPROVE",
  "confidence": 0.85,
  "severity_counts": { "critical": 0, "major": 0, "minor": 1 },
  "issues": [],
  "lean_status": {
    "sorry_count": 0,
    "type_checks": true
  },
  "commit_sha": "abc1234"
}
```

### Verdicts

| Verdict | Meaning |
|---------|---------|
| `APPROVE` | Proof is correct and complete |
| `REQUEST_CHANGES` | Issues found that must be fixed |
| `NEEDS_DISCUSSION` | Reviewer is uncertain; human input needed |

### Confidence Scores

For agentic reviewers:
- **0.9–1.0**: High confidence (straightforward proof, well-known techniques)
- **0.7–0.9**: Moderate confidence (complex proof, reviewer can follow the logic)
- **0.5–0.7**: Low confidence (advanced techniques, reviewer may miss subtleties)
- **< 0.5**: Very low confidence (flag for human review)

## Integration with Agent Review Pipeline

The agent-review pipeline includes a Lean-review system prompt for
reviewing Lean proofs.  When a commit touches `lean/<Paper>/*.lean` files:

1. The diff is sent to all configured LLMs with the Lean review prompt
2. Each LLM produces a structured review
3. Reviews are stored in `proof-objects.json`
4. The coordinator synthesizes results

## Integration with Code Review

Automated code review triggers on PRs.  To make it proof-aware:

1. `proof-objects.json` is in the repo — the reviewer sees it in diffs
2. When `chapters/*.tex` changes, the JSON shows which Lean files are linked
3. Reviewer instructions direct it to check linked Lean declarations when
   reviewing LaTeX changes

## Current Codebase State

Live state — derived, not maintained in this skill file:

- Sorry / admit / axiom counts: query `proof-objects.json` (built from
  Lean diagnostics by CI) or run `lean_diagnostic_messages` per file via
  the MCP server.
- Per-file declaration inventory: `lean_file_outline`.
- Axiom dependencies for any theorem: `lean_verify`.

Do not rely on dated snapshots in this file — they go stale and mislead
fresh agents. Always pull live counts before reporting.

## Content Object Integration

Each Lean file under review is part of a **content object triple**: the
`.lean` sibling has a corresponding `.ts` manifest and `.md` narrative.
Reviews must cross-check all three.

**Manifest–Lean consistency.** Verify that:
- The `lean.ref` URI in the `.ts` manifest (form `"<pkg>:<Decl>"`) names
  the actual Lean declaration in the `.lean` file. Parse with
  `parseLeanRef()` from `folio-assistant/schemas/lean-packages.ts`.
- The block `kind` matches the Lean content: `definition` blocks should
  contain `def` or `structure`; `theorem`/`lemma` blocks should contain
  `theorem` or `lemma`.
- The `label` prefix is correct for the kind (`def:`, `thm:`, `lem:`,
  `prop:`, `cor:`).

**Dependency satisfaction.** The `uses[]` array in the `.ts` manifest
lists content object labels this block depends on. Verify that the `.lean`
file imports or references the Lean declarations corresponding to those
dependencies. Missing imports suggest incomplete formalization.

**Status accuracy.** Formalization status is derived at build time from
`.lean` file content — agents do not need to update any status field.

## Checklist

- [ ] All modified Lean files compile (`lake build`)
- [ ] Review records include `reviewer_id`, `verdict`, `confidence`
- [ ] Critical issues block merge
- [ ] `sorry` count is accurately tracked
- [ ] Linked LaTeX content is consistent with Lean statements
- [ ] All sorry stubs have bibliographic citations or blocking-reason comments
- [ ] Provable-kind signatures unchanged vs prior commit (or author-approved restatement)
- [ ] `lean_verify` shows no `sorryAx` / unexpected axioms on declarations claimed proved
{% endraw %}
