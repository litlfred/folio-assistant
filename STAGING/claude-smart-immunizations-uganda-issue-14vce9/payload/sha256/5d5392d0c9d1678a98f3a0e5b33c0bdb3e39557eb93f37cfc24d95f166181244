---
# folio-assistant-qnob
$schema: bean/1.0.0
title: 'merge-main bot: modify/delete crash and cancelled runs reported as errors'
status: completed
type: bug
priority: normal
created_at: 2026-10-02T11:35:12Z
updated_at: 2026-10-09T19:20:00Z
parent: folio-assistant-hfag
---

Issue #1854. (1) modify/delete conflicts on generated-pattern paths: take main's side (rm or main's copy), authored stays refused. (2) cancelled/superseded merge-main runs rewrite the PR comment to 'Error (exit )': leave it untouched; comment composition moved to a tested TS function.

## Done when

- [x] tests fail on origin/main and pass with the fix
- [x] bun run cat gates green, PR CI green, PR marked ready

## Closed 2026-10-09

Work verified landed on `main` via PR #1854 across commits:
- `26249104e6aa`: `qa:resolve-conflicts: a modify/delete sidecar takes the base's side instead of throwing (#1854)`
- `9b4a71c9e678`: `merge-base test: modify/delete on real pattern paths — docs-auto resolves, a bean refuses (#1854)`
- `e1022c6e5f40`: `merge-main.yml: a cancelled or unfinished run leaves the comment alone (#1854)`
- `9fe661129bb2`: `skill merge-conflict-patterns: modify/delete takes the base's side; a cancelled run leaves the comment (#1854)`

Verification:
- `scripts/tests/merge-base.test.ts` ("modify/delete on DECLARED paths: generated resolves, authored refuses (#1854)") passes (1/1 tests).
- `scripts/tests/qa-resolve-conflicts.test.ts` ("a modify/delete sidecar takes the base's side, never a side that is not there (#1854)") passes (6/6 tests).
- `scripts/tests/merge-main-workflow.test.ts` ("a cancelled or unfinished run is not an error (#1854)") passes (5/5 tests).

