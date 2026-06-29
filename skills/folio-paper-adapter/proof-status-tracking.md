---
name: proof-status-tracking
roles: [reader, collaborator, owner]
description: >
  Maintain the proof-objects.json manifest tracking formalization status,
  review records, and LaTeX-to-Lean linkages.  Generate status dashboards
  and enforce review policies.
allowed-tools: Read Write Edit Bash Grep Glob
---

# Proof Status Tracking

## Overview

This skill manages the `proof-objects.json` manifest — the single source of
truth for which mathematical objects have been formalized, reviewed, and
approved.  Lean declarations are referenced by URL (doc-gen4 pages), not
duplicated in JSON.

## Lean MCP Tools (paper-assistant)

When the MCP server is available, **prefer MCP tools for live status**:

| Old workflow | MCP tool | Why better |
|-------------|----------|-----------|
| `lake build` + `update_proof_status.py` | `lean_diagnostic_messages` | Per-file sorry/error counts without full build |
| Manual declaration inventory | `lean_file_outline` | All declarations with type sigs in one call |
| Checking if a decl is sorry-free | `lean_verify` | Axiom audit per theorem |
| Cross-checking `\lean{}` refs | `lean_hover_info` | Verify declaration exists and get its type |

### MCP-enhanced status update

Instead of the full `extract → build → update` pipeline:

1. **`lean_file_outline`** on each `lean/<paper>/*.lean` → inventory all declarations
2. **`lean_diagnostic_messages`** on each file → sorry warnings = `has_sorry`, no warnings = `proved`
3. **`lean_verify`** on key theorems → axiom audit for publication readiness
4. Update `proof-objects.json` with the results

## When to Use This Skill

- After extracting proof objects from LaTeX
- After updating Lean proofs
- When generating status reports
- When checking review coverage before publication
- When linking proof objects to mathlib4 declarations

## Proof-Objects Manifest

**File:** `proof-objects.json`
**Types:** `folio-assistant/schemas/formalization-types.ts` (ProofObjectsManifest)

### Formalization Status Flow

```
not_started ──► stated ──► has_sorry ──► proved ──► mathlib_ok
    │              │           │            │
    │              │           │            └── Merged into mathlib4
    │              │           └── Lean decl exists, some sorry remaining
    │              └── Lean decl exists, fully sorry
    └── No Lean declaration yet
```

### Review Consensus

Multiple reviewers (human + agentic) contribute reviews.  Consensus rules:

1. **Any critical issue** → `REQUEST_CHANGES` regardless of other reviews
2. **All APPROVE with confidence ≥ 0.7** → consensus APPROVE
3. **Mixed verdicts** → `NEEDS_DISCUSSION`
4. **Human APPROVE overrides** agentic NEEDS_DISCUSSION

### Scripts

| Script | Purpose |
|--------|---------|
| `extract_proof_objects.py` | Parse LaTeX → proof-objects.json |
| `generate_lean_stubs.py` | proof-objects.json → lean stub files |
| `update_proof_status.py` | Lean build log → update statuses |

### GitHub Actions Integration (CI-only)

The `lean-build.yml` workflow runs the full pipeline automatically:
1. Runs `extract_proof_objects.py`
2. Runs `generate_lean_stubs.py`
3. Runs `lake build`
4. Runs `update_proof_status.py`
5. Commits updated `proof-objects.json` (automated commit by `github-actions[bot]`)

**This pipeline is CI-only.** Locally, agents must not replicate it.
Local `lake build` is compile-only — no generation scripts before it.
Generation scripts are proof-writing tools invoked only by the
`formalizer`, `lean-generation`, and `proof-triage` skills when the
author requests new formalization work.

## Status Dashboard

The proof status is published to GitHub Pages alongside the paper.
Key metrics:

- Total objects / formalized / proved / reviewed
- Objects with critical review issues
- Dependency graph (which proofs are blocked)
- Coverage by review type

## Review Policy

| Criterion | Requirement |
|-----------|-------------|
| Minimum reviewers per object | 2 (at least 1 human for theorems) |
| Required review types | scientific-accuracy, lean-proof-check |
| Maximum sorry for publication | 0 in core theorems |
| Confidence threshold | ≥ 0.7 average across agentic reviewers |

## Snapshot policy

Do **not** maintain a static metrics snapshot (total files, declarations,
active sorry count, sorry distribution) in this skill file. Such tables drift
within weeks and mislead fresh agents. Derive the current snapshot at the
start of each pass:

| Metric | Source |
|--------|--------|
| Total `.lean` files / declarations | `lean_file_outline` per file, or `find content -name '*.lean'` |
| Active sorry stubs + distribution | `lean_diagnostic_messages` per file, or `grep -rc 'sorry' content/<paper>/` |
| Axiom / admit usage | `lean_verify` on key theorems |

### Consistency invariants (check every pass)

- All sorry stubs carry bibliographic citations — no orphaned stubs
- No `axiom` or `admit` hacks masquerading as proofs
- Files that defer proofs by design document the policy in a file header

## Content Object Integration

Formalization status is tracked through **content object triples**: each
block has a `.ts` manifest, `.md` narrative, and (when required) `.lean`
formalization. The `.ts` manifest is the **single source of truth** for
status — `proof-objects.json` is a derived artifact generated from content
objects, not the other way around.

**Completeness by kind:**
- `definition`: `.ts` + `.md` + `.lean` required; `lean.ref` URI must be
  set; label prefix `def:`.
- `theorem` / `lemma` / `proposition` / `corollary`: `.ts` + `.md` + `.lean`
  expected; label prefixes `thm:` / `lem:` / `prop:` / `cor:`.
- `example` / `remark` / `conjecture`: `.ts` + `.md` required; `.lean`
  optional.
- `prose` / `equation` / `diagram`: `.ts` + `.md` only; no Lean.

**Status field.** Formalization status is **not stored** in `.ts`
manifests. It is derived at build time by CI scripts from `.lean` file
content (sorry detection, build output) and written to `proof-objects.json`.
Do not add `status` fields to content block `.ts` files.

**Dependency tracking.** The `uses[]` array in `.ts` manifests forms the
dependency DAG. Use it to populate the dependency edges in
`proof-objects.json` and to scope impact analysis when a block changes.

## Checklist

- [ ] `proof-objects.json` conforms to `folio-assistant/schemas/formalization-types.ts` ProofObjectsManifest
- [ ] All theorem/lemma/proposition objects have at least one review
- [ ] No critical issues in any review
- [ ] Formalization status matches actual Lean build output
- [ ] Sorry count matches current inventory
- [ ] Dependency edges are complete (all `\uses{}` captured)
- [ ] All Lean witnesses include commitSha (from `lean-witness.ts stamp`)
- [ ] No stale Lean witnesses (check with `witness-audit.ts`)
- [ ] Python computation witnesses use structured format (`witness_base.py`)
- [ ] No stale Python witnesses (check with `witness_base.py check-all`)

## Witness Tracking

### Lean witnesses

Each `.lean` file can have a witness file recording a successful build:
```
<block>.lean.<hash>.witness
```

The witness includes:
- `hash`: SHA-256 content hash of the `.lean` file
- `commitSha`: Git HEAD at stamp time
- `fileCommitSha`: Last commit that modified this specific file
- `stampedAt`: ISO 8601 timestamp

**Scripts:**
- `bun run scripts/lean-witness.ts stamp <file>` — after successful build
- `bun run scripts/lean-witness.ts status` — show all witness statuses
- `bun run scripts/lean-audit.ts` — deep chapter-by-chapter audit

### Python computation witnesses

Each `.py` computation script produces a `.witness.json` sibling.
Use `witness_base.py` for new computations:

```python
from witness_base import WitnessBuilder

w = WitnessBuilder("computation-name", engine="sympy")
w.set_content_block("prop:my-block")
w.add_assertion("result", computed=val, expected=ref, tolerance=1e-6)
w.save()
```

**Staleness detection:**
- `python3 witness_base.py check-all` — check all Python witnesses
- `bun run scripts/witness-audit.ts` — unified Lean + Python audit
