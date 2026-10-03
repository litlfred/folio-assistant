---
# folio-assistant-vsv7
title: merge-base take-base can DELETE a generated file and still report proved
status: todo
type: bug
priority: high
created_at: 2026-10-03T20:05:45Z
updated_at: 2026-10-03T20:05:45Z
parent: folio-assistant-hfag
---

Measured 2026-10-03 on PR #1955 (bun run merge:main, merging origin/main at af91a5a). Two paths classified [qa-results: take-base] — cat-harness/test/results/kg-export.bootstrap.qa-results.json and kg-export.folio-assistant.qa-results.json — logged 'fatal: path ... is in the index, but not at stage 2' and '... not at stage 3', and were ABSENT from the merge commit, although both exist on main and on the branch. The run still ended 'merged origin/main; 24 conflict(s) resolved by declared pattern, regenerated and proved'. CI caught it (check:published-instance-exports: QA sidecar absent). Same 'not at stage' error was logged for audit-coverage.qa-results.json, which survived only because regen rewrote it.

Suspected cause: the resolver checks out stage 3 (or 2) for a path the earlier pattern step already resolved to stage 0, the checkout fails, and the failure is not treated as a refusal. kg-export sidecars are not rewritten by regen, so nothing restored them.

## Done when
- a failed take-base/take-head checkout aborts the merge (tree restored), never leaves the path deleted
- the proof step fails when a path present on BOTH sides is absent from the result
- a test reproduces the stage-0 case
