---
name: proof-editor
roles: [collaborator, owner]
description: >
  Coordinator skill for proof review and repair. Runs the full proof
  skill suite (gap audit, lean review, completeness, simplifier,
  triage), deduplicates findings across reviewers, ranks by severity
  and dependency order, and delivers a single author-ready action
  plan with concrete suggested edits (never applying them without
  author approval).
allowed-tools: Read Grep Glob Bash Agent
---

# Proof Editor (Coordinator)

## Overview

`proof-editor` is the top-level orchestrator for proof quality. It
does **not** do original analysis — it dispatches to specialist
skills, synthesizes their reports, and produces a single prioritized
action plan for the author.

Specialists it coordinates:

| Specialist | Contribution |
|-----------|--------------|
| `proof-gap-audit` | Intra- and inter-proof gaps (existence, uniqueness, bridges) |
| `lean-proof-review` | Lean correctness, style, axiom soundness |
| `lean-completeness-audit` | LaTeX→Lean coverage (what's stated but not formalized) |
| `proof-simplifier` | Overlong/brittle Lean proofs, tactic cleanup |
| `proof-conciseness` | Tighten narrative (human) proofs — cut verbosity without cutting reasoning |
| `proof-exposition-review` | Retrospective integration — does this proof use content added since it was written? |
| `proof-narrative-lean-equivalence` | Does the Lean sibling prove the same thing the narrative claims? |
| `proof-triage` | `sorry` inventory and priority ordering |
| `remark-audit` | Dangling remarks whose formalization is owed |
| `content-block-review` | Structural integrity of the block graph |
| `category-theory` | Diagrammatic / universal-property checks |

## When to Use This Skill

- Author asks: "review my proofs", "audit this chapter", "what needs
  fixing before merge", "help me finish this proof"
- Before opening a PR that touches proof blocks
- Post-merge sweep after a large formalization effort
- When a reviewer flags multiple concerns and the author wants a
  consolidated response plan
- **Not** for a single narrow task (e.g. "fix this sorry") — use the
  specialist directly

## Principle: suggestions, not edits

The editor coordinates — it **does not apply changes**. Every
recommendation goes back to the author with:

1. A clear description of the gap / issue
2. The proposed fix (diff, new block, new lemma, etc.)
3. The specialist skill responsible for implementing it
4. Dependency ordering (what must be done first)

The author then decides which suggestions to accept and invokes the
relevant specialist (or asks the editor to dispatch).

## Workflow

### Phase 1 — Scope & intake

Determine the scope and check the user's role:

```
1. What is the target? (block | chapter | paper | branch-diff)
2. What is the user's role? (reader | collaborator | owner)
3. Which specialists are allowed for that role?
4. Is there prior review data in proof-objects.json or from the
   agent-review pipeline? (avoid re-running expensive analyses)
```

### Phase 2 — Dispatch specialists in parallel

Launch specialist agents **in parallel** (single message, multiple
`Agent` tool calls). Each agent runs its own skill on the scoped
target.

Default dispatch fan-out:

| Target scope | Agents launched |
|-------------|-----------------|
| Single proof block | `proof-gap-audit`, `lean-proof-review`, `proof-narrative-lean-equivalence` |
| Chapter | above + `lean-completeness-audit`, `proof-simplifier`, `proof-conciseness`, `remark-audit` |
| Paper / branch-diff | above + `proof-triage`, `proof-exposition-review`, `lean-witness-audit`, `content-block-review` |

Notes:
- `proof-narrative-lean-equivalence` runs at every tier — it is the
  only skill that catches Class A "stub weakening" (`theorem foo : True
  := trivial` while the narrative claims something substantial).
- `proof-conciseness` operates on `.md` proof bodies; chapter scope is
  the natural dispatch point for paper-wide tone consistency.
- `proof-exposition-review` and `lean-witness-audit` are paper-scope
  retrospective audits; they are cheap to run on a branch diff because
  they self-scope to changed blocks.

Ask each agent to produce its report in the standard format with
severity levels and concrete remediation suggestions.

### Phase 3 — Synthesize

Merge specialist reports into a single finding set:

1. **Deduplicate**: the same issue flagged by two skills counts once.
   Example: a `sorry` without `-- Ref:` is flagged by both
   `proof-triage` and `lean-proof-review` — keep the more specific.
2. **Cluster**: group findings by affected block so the author can
   address each block in one pass.
3. **Order by dependency**: if fixing block $A$ invalidates a fix to
   block $B$ downstream, schedule $A$ first.
4. **Rank by severity**:
   - `critical`: proof invalid as written, circular dep, conjectural
     propagation violation
   - `major`: missing lemma, uniqueness/existence gap, broken chain
   - `minor`: style, verbosity, hand-wave that's defensible
5. **Attach ownership**: which specialist skill should the author
   invoke to apply the fix?

### Phase 4 — Produce action plan

Deliver a single markdown document with the structure shown under
[Output format](#output-format). Include:

- Executive summary (counts, blockers)
- Per-block findings in dependency order
- Concrete suggested edits (diffs, new lemma statements, etc.)
- Dispatch table: which skill to invoke for each fix
- Links to affected files (GitHub blob URLs on the current branch, per
  AGENTS.md)

### Phase 5 — Handoff

Present the plan to the author. Offer a numbered list of next
actions so the author can reply with "1" or "1,3,5". Do **not**
begin applying fixes without explicit approval.

If the author says "apply all" or "go ahead":
1. Dispatch each fix to its owner skill, in dependency order
2. After each batch, re-run the relevant specialists to confirm the
   gap is closed
3. Produce a delivery summary per `.claude/skills/local/delivery-summary.md`

## Output format

```markdown
## Proof Editor Report: <scope>

### Executive Summary
- Blocks reviewed: N
- Critical findings: N (blockers)
- Major findings: N
- Minor findings: N
- Estimated fix order: <dependency-ordered list of block labels>

### Findings (in dependency order)

#### 1. `prop:harmonic-decomp` — 2 critical, 1 major
**GitHub**: <repo-url>/blob/<branch>/content/.../harmonic-decomp.md

- [critical, proof-gap-audit] Existence of harmonic representative
  asserted but not constructed. Proof says "choose $h \in \ker \Delta$"
  with no argument for non-emptiness.
  - **Fix**: add lemma `lem:harmonic-nonempty` showing
    `ker Δ ≠ ∅` via spectral decomposition, or cite [author2004].
  - **Owner skill**: `formalizer` (+ `lean-generation` for the stub)

- [critical, lean-proof-review] `sorry` at line 83 missing `-- Ref:`.
  - **Fix**: add `-- Ref: [author2004] https://doi.org/...` or replace
    with a proof.
  - **Owner skill**: `proof-triage`

- [major, proof-simplifier] 40-line proof uses `simp only` with 12
  lemmas; `aesop` closes the goal.
  - **Fix**: replace with `aesop` + comment noting the specific
    lemmas for readers.
  - **Owner skill**: `proof-simplifier`

#### 2. `thm:lifting-exists` — 1 major
...

### Dispatch Table

| Fix # | Block | Owner skill | Blocked by |
|-------|-------|------------|-----------|
| 1.1 | prop:harmonic-decomp | formalizer | — |
| 1.2 | prop:harmonic-decomp | proof-triage | 1.1 |
| 1.3 | prop:harmonic-decomp | proof-simplifier | 1.2 |
| 2.1 | thm:lifting-exists | formalizer | 1.1 |

### Next Actions (pick a number)
1. Apply all critical fixes in order (dispatches 1.1, 1.2, 2.1)
2. Apply all fixes (critical + major + minor)
3. Apply only fix 1.1 (the blocking existence gap)
4. Show me the suggested diff for fix 1.3 before deciding
5. Skip the report — I'll handle it manually
```

## Coordination rules

- **Role gating**: route findings only to skills the user's role can
  invoke. A `reader` gets a report but cannot dispatch
  `collaborator`-only fixers.
- **Idempotence**: running the editor twice on an unchanged branch
  should produce the same report. Cache specialist outputs via
  `proof-objects.json` review entries when possible.
- **No silent edits**: the editor never writes to `.ts`, `.md`, or
  `.lean` files. Dispatch skills do that, under author approval.
- **Honest confidence**: if a specialist reports low confidence
  (< 0.7), surface that to the author — don't smooth it over.
- **Link every finding** to a GitHub blob URL per the AGENTS.md
  "always provide GitHub links" rule. Default to `.md` for block
  citations; include `.lean` sibling when the finding is Lean-specific.
- **Downstream-consumer sync.** When a finding touches a proposition
  consumed by a derived chain (e.g. an algorithm or appendix block
  whose `uses[]` cites the proposition), include in the action plan a
  check that the consuming block still cites the (possibly-modified)
  proposition correctly. If the proof edit changes the proposition
  statement or its name, every consumer's `uses[]` and any
  *Correctness conditions* section must update in the same PR.

## Integration

- **Invoked by**: `editor` skill (top-level router) when the user
  asks for proof review / audit at chapter or paper scope
- **Dispatches**: all skills listed under [Overview](#overview)
- **Produces**: single action plan; no file edits
- **Follows up**: `delivery-summary` after approved fixes are applied

## Checklist

- [ ] Scope and user role identified
- [ ] Specialists dispatched in parallel (not sequentially)
- [ ] Findings deduplicated across specialists
- [ ] Clustered by block, ordered by dependency
- [ ] Severity levels assigned (critical / major / minor)
- [ ] Each finding has a concrete suggested fix and owner skill
- [ ] GitHub blob URLs included (`.md` default, `.lean` for formal gaps)
- [ ] Author presented with numbered next-action choices
- [ ] No edits made without explicit author approval
- [ ] Glossary-term findings (defterm/refterm violations) routed to the
      authoring skill (`md-authoring` or `scientific-accuracy`) plus
      `local/glossary-build` for the codemod/build pass
