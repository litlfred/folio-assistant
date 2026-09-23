---
# folio-assistant-6hq4
title: 'QA: gateway documentation-completeness criteria (decisions and their branches)'
status: completed
type: task
created_at: 2026-09-23T09:56:25Z
updated_at: 2026-09-23T10:40:00Z
parent: folio-assistant-1swy
---

Extend the documentation-completeness QA control (issue #1007, bean `ooq3`)
past activities, to the decision points of a diagram. Issue #1044, PR #1051,
branch `claude/magical-archimedes-4qkfxp-gateways`.

## Measurement (2026-09-23, all 62 diagrams `kg-audit` loads, 0 load failures)

- Gateways: 123 — 111 exclusive (102 diverging, 9 converging), 12 parallel
  (6 fork, 6 join), 0 inclusive (the model refuses them). 104 of 123 carry no
  `<bpmn:documentation>`; of the 102 DECISIONS (diverging exclusive) 83 do not.
- Branches out of a diverging exclusive gateway: 220, **0** unnamed, 0
  duplicate labels on one gateway.
- Start/end events: 174, **0** unnamed — no event criterion added.
- Lanes: `check:lane-documentation` reports 0 undocumented — already gated.

## Done when

- [x] `gateway-documented` (minor) in `kg-qa.ts`, wired into `auditProcess`
- [x] `gateway-branches-named` (minor) in `kg-qa.ts`, wired into `auditProcess`
- [x] per-process pages show a "Decisions" table
- [x] the worst processes' decisions documented from a source; the rest counted here
- [x] generated artefacts regenerated; `bun run gates` green
- [x] PR open against `main`, issue commented after each push

## Summary of Changes

- `process-model.ts`: `isDecision`, `branchesOf`, `indistinctBranches`. Only a
  diverging exclusive gateway is a decision; merges, forks and joins are not asked.
- `kg-qa.ts` / `kg-audit.ts`: `gateway-documented` and `gateway-branches-named`,
  both `minor`, not gated, `n/a` on a diagram with no decision.
- `gen-processes-viz.ts`: a "Decisions" table (decision, what decides it, labelled
  branches → target) on each per-process page that has one.
- `scripts/tests/gateway-documentation.test.ts`: the boundaries.
- 18 decisions documented, each from a source: the CI watch diagrams from their
  workflow's `verdict` outputs and `if:` guards (`ci-health-watch`,
  `pr-checks-present`, `repository-health-watch`, `upstream-pin-watch` — 8);
  `graph-detanglement` from its three DMN tables (3); `ig-incremental-build` from
  its own step, lane and start-event documentation (4); `bean-lifecycle` from
  `todo-manager` and `bean-coordination` (3).

## Remaining backlog — `gateway-documented` 65 findings in 43 diagrams (2026-09-23)

content-change-review (3), crdm-deliver (3), human-translation-workflow (3),
translation-workflow (3), voice-review (3), activity-log (2),
authoring-a-document (2), authoring-a-paper (2), code-change-review (2),
docs-site-publish (2), draft-to-publication (2), editing-hci-validation (2),
evidence-retrieval (2), l3-fhir-pipeline (2), refresh-materialized (2),
staging-render-log (2), upstream-version-adoption (2), and one each in
atomic-mass-drift-check, board-open-close, board-place-note, board-relocate,
code-quality-gates, content-acquisition, content-lifecycle, crdm-data-model,
crdm-issue-linking, crdm-needs, crdm-requirements, crdm-requirements-definition,
document-ingestion, ingest-extract-structure, ingest-l1-completeness-gate,
ingest-theme, jsonld-drift-check, kg-to-portal, l2-dak-authoring,
materialize-remote, qa-report-signing, review-code, review-narrative,
review-task, session-state-machine, theme-ui-review.

Re-derive rather than trust this list: `bun run kg:audit`, then read
`gateway-documented` in `cat-harness/test/results/kg-qa/processes/*.kg-qa.json`.

## Noticed, not acted on

- `ig-incremental-build` `Gateway_Restore`: `ig-cache restore` has four exit codes
  (0 usable, 1 miss, 2 environment error, 3 toolchain moved), and the diagram only
  routes 0 (`yes`) and 1/3 (`no`, per Task_FullBuild's documentation). Where exit 2
  goes is not drawn. The documentation says so and does not guess.
- `human-translation-workflow` `Gateway_Drift`: both branches (`Drift found`,
  `Clean`) lead to the same step, "Review translation for accuracy", so the
  decision routes nothing. Either the diagram is missing a step on one branch or
  the gateway is redundant. That is the owner's call.
