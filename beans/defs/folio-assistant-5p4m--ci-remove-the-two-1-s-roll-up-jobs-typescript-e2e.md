---
# folio-assistant-5p4m
title: 'CI: remove the two 1-s roll-up jobs (typescript, e2e) — 7fu5 leftover, owner swaps required checks'
status: in-progress
type: task
priority: normal
created_at: 2026-10-07T19:39:28Z
updated_at: 2026-10-07T20:51:45Z
parent: folio-assistant-hfag
---

Issue #2456. Owner approved 2026-10-07 ~19:40Z ("1y, 2y, 3y, 4y"). Measurements in the issue body.

_2026-10-07T19:39:38Z_ — Claimed by claude/ci-runner-budget (session https://claude.ai/code/session_013WbQekVypi9A6YQbLDXMmJ).

## Done on claude/ci-runner-budget (PR #2457), 2026-10-07

- Removed jobs `typescript` and `e2e` (commit 35a8229de93). Nothing outside the workflow read the names except the ui-accessibility skill sentence (updated) and workflow-yaml.test.ts (now asserts the two real jobs, both shard matrices, and that the roll-ups stay gone). BPMN Task_TypeScript / Task_E2E documentation updated.
- **Owner action, branch protection (403 for agents):** remove `TypeScript — tests, lint, types (hard)` and `End-to-end + accessibility (hard)`; add `TypeScript — lint and types (hard)`, `TypeScript — bun test, shard 1/4`..`4/4`, `End-to-end + accessibility, shard 1/3`..`3/3`.
- Not ready to close until the owner has swapped the required checks.
