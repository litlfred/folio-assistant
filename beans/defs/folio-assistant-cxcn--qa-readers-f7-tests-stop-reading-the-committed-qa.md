---
# folio-assistant-cxcn
title: 'QA READERS F7: tests stop reading the committed QA corpus (15 tests in 6 files fail when it is absent)'
status: todo
type: task
priority: normal
created_at: 2026-10-01T08:47:14Z
updated_at: 2026-10-01T08:47:14Z
parent: folio-assistant-3fva
blocked_by:
    - folio-assistant-16ei
---

Arc `3fva`, from reader audit `gxvk` (`cat-harness/docs/proposals/qa-readers-audit-2026-10-01.md`, §5.5 family F7). Blocked on `16ei`. Do it last: the fixtures follow the APIs that the other reader beans settle.

Measured on the same 21 test files: with the corpus present, 8 tests fail, none of them about a missing file. With it moved aside, 20 fail. **15 tests fail only when the corpus is absent, in 6 files** (`comm -13` over the sorted `(fail)` lines). One test, `kg-qa.test.ts` "no critical criterion is failing on main", fails with the corpus present and passes vacuously with it absent.

## Readers (tests that read the COMMITTED corpus)
- `cat-harness/scripts/tests/qa-results.test.ts:40,119,269,298,369`: the `qa` dir, `witnesses/**`, `qa-index.json`, the badge tree. 5 fail. (`:60` fails at baseline too.)
- `cat-harness/schemas/kg-qa.test.ts:128,328`: `kg-qa/**`, the hosted bootstrap manifest. 2 fail, and "no critical criterion" goes vacuously green. **It never walks the hosted homes** (`test/results/bootstrap/`, `bootstrap-tools/`, `cat-harness-tools/`), which is why the 3 conflict-marked sidecars on `main` went unseen.
- `cat-harness/schemas/kind-validator.test.ts:224`. 1 fails.
- `cat-harness/scripts/tests/tool-qa-subjects.test.ts:53`. 4 fail.
- `cat-harness/scripts/tests/gen-lsi-viz.test.ts:33`. 2 fail; a third fails at baseline too.
- `cat-harness/schemas/test-run.test.ts:232`. 1 fails.
- `cat-harness/scripts/tests/subgraphs.test.ts` (entanglement, the `../` count) and `audit-coverage.test.ts` (fixpoint) read the declared directories and the sidecar, but they already fail at baseline, so the run does not discriminate. Re-check them once `main` is green (`gurh`).
- `cat-harness/test/qa-badge.e2e.ts:49`, `cat-harness/test/qa-panel.e2e.ts:46,181`: read corpus witnesses at load. Not run here (Playwright).
- `cat-harness/test/health/workflow.test.ts:122`: asserts the health upload path only `toContain`s the file name, and passes over the wrong path. The live-defects bean fixes the assertion.

## Migration action
- A test asserts on a FRESH run or a fixture, never on the committed corpus (memory: *never assert on a QA verdict from the published corpus*; guard `e2e-corpus-coupling.test.ts`).
- Corpus-validation tests (e.g. "every committed kg-qa validates") move to a gate over the fetched tree, and walk every hosted home.

## Done when
- [ ] `bun test` passes with `test/results/` absent from the checkout
- [ ] a validation gate over the fetched tree covers the hosted homes, and fails on a planted conflict marker
