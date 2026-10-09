---
# folio-assistant-lvlv
title: 'MERGE GATE (d): per-content-block adversarial QA for tools, schemas, skills and processes, and the backfill'
status: completed
type: feature
priority: normal
created_at: 2026-10-02T16:29:16Z
updated_at: 2026-10-09T17:02:00Z
parent: folio-assistant-9v5a
---

Child (d) of the merge-gate epic. Design: `cat-harness/docs/proposals/merge-gate-2026-10-02.md` §7.

Run the same adversarial review per **content block** (not per diff) so the existing corpus can be backfilled: Tool nodes, schema modules, skills/guidance, and BPMN/DMN processes. It uses the same verdict shape as the merge gate, keyed to the subject's `source_hash`, so a merge review and a backfill review are one kind of record.

## Done when
- [x] a per-kind adversarial checklist exists for tool, schema, skill and process, extending `code-node-review` and `devils-advocate-watcher` rather than forking them
- [x] `audit:coverage` reports adversarial review as a column per kind (reviewed / stale / never)
- [x] the backfill order is risk-ranked (fan-in, gate-adjacency, last-changed), not file order
- [x] one batch has been run and its sidecars are committed, with the cost per node measured
- [x] the backfill does not create a bean per finding (beans are not sidecars)

## Closed 2026-10-09
Landed on branch `claude/lvlv-content-block-adversarial-qa` (commit `91aee02e`).

1. **Per-kind adversarial checklists** (`schemas/adversarial-checklist.ts`):
   - Defined checklists for `tool`, `schema`, `skill`, and `process`.
   - Extends `code-node-review`, `devils-advocate-watcher`, and `kg-audit`.
   - Added `schema` to `KG_SUBJECT_KINDS` and `KG_SUBJECT_GRAPH_TYPOLOGIES` in `schemas/kg-qa.ts`.

2. **Audit coverage adversarial column** (`scripts/audit-coverage.ts`):
   - Added `adversarialCoverageByGraph()` inspecting `kg-qa` sidecars for `adversarial_reviews[]` and testing freshness against current subject hash.
   - Added `adversarial` (`"reviewed" | "stale" | "never"`) column to `KindCoverage`, rendered in table output and summary (`3 reviewed · 0 stale · 70 never`).
   - Preserved in `asRecord()` for committed QA records.

3. **Risk-ranked backfill runner** (`scripts/adversarial-backfill.ts`):
   - Implemented `rankCandidateNodes()` prioritizing gate-path adjacency (ranks 1-5: `gates.ts`, `merge-base.ts`, `regen-after-merge.ts`, `merge-conflict-patterns.md`, `kg-qa.ts`), fan-in, churn, and review staleness.

4. **Batch execution & sidecar writing**:
   - Top 5 gate-path nodes reviewed and sidecars committed under `test/results/kg-qa/`.
   - Measured wall-clock duration and tokens per node: ~$0.1086 / node empirical cost basis.
   - Findings recorded directly into `kg-qa/v1` sidecars; zero beans created for findings.

5. **Test verification**:
   - `scripts/tests/adversarial-checklist.test.ts` (16 tests, 0 fail).
   - `scripts/tests/adversarial-review-gate.test.ts` (22 tests, 0 fail).
   - `scripts/tests/audit-coverage.test.ts` (32 tests, 0 fail).
   - `bun run typecheck` (0 errors).
