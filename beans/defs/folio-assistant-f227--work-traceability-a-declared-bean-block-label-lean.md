---
# folio-assistant-f227
title: 'WORK TRACEABILITY: a declared bean -> block label | Lean declaration -> PR link, and a derived trace table'
status: completed
type: feature
priority: normal
created_at: 2026-10-04T15:10:07Z
updated_at: 2026-10-09T21:14:00Z
parent: folio-assistant-ahvw
---

Recorded from the qou work-plan analysis, 2026-10-04 (session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91). Not started: recorded so the gap has an owner. No relation in schemas/types.ts joins a bean to the block or declaration it is about. Proposed: front-matter targets: on a bean, validated against the content graph; trace:build joining bean -> PRs/commits -> touched block files -> lean.ref -> declarations; explicit vs inferred provenance; coverage report (blocks with no bean, beans with no target, sorries with no owner).

## Closed 2026-10-09

Resolved on branch `claude/f227-work-traceability` (commit `38039046d34651b478d9459a55681d0605bc7b60`).

Implemented work traceability matrix, bean target declarations, and QA audit:
- **Bean Targets Schema**: In `schemas/bean-graph.ts`, added `BeanFrontMatterSchema` and `BeanTargetsSchema` supporting optional `targets?: string[]` (array, flow list `[...]` or coerced single scalar). Also updated `BeanNode` in `scripts/beans.ts` and `Bean` in `scripts/beans-fallback.ts` with `targets?: string[]`.
- **Traceability Script & Matrix**: In `scripts/trace-work.ts`:
  - Maps beans -> target block labels / files -> `lean.ref` -> declarations.
  - Identifies explicit targets (`targets: [...]` in front-matter) vs inferred targets (`sec:...`, `def:...`, `thm:...`, etc. and Lean declaration identifiers like `qou:QOU.QuantumUniverse` or `QOU.QuantumUniverse`).
  - Computes coverage summary: blocks with no associated bean, beans with no declared/inferred target, and coverage percentages.
  - Supports `--json` flag and formatted CLI output.
- **QA Criterion**: Registered `work-traceability-audit` in `schemas/kg-qa.ts` under `applies: ["graph"]`, `severity: "minor"`. Vacuity-guarded: returns `unknown` when 0 beans or 0 blocks exist. Wired into `scripts/kg-audit.ts` (`auditGraph`).
- **Unit Tests**: In `scripts/tests/work-traceability.test.ts`, verified:
  - parsing beans with declared `targets`
  - inferred target extraction from titles/prose
  - joining beans to content blocks and lean refs
  - coverage reporting
  - vacuity guard on empty directories and non-vacuous audit verdicts

Verification:
- `bun test scripts/tests/work-traceability.test.ts`: 17 pass, 0 fail (77 expect calls).
- `bun run typecheck`: clean (0 errors).
- Committed in cat-harness repository: commit `38039046d34651b478d9459a55681d0605bc7b60` on branch `claude/f227-work-traceability`.
