---
# folio-assistant-auap
title: Consolidate test/ and tests/ onto test/ — one test tree, one declaration
status: in-progress
type: task
priority: normal
created_at: 2026-09-19T10:48:26Z
updated_at: 2026-09-19T11:02:43Z
---


## Brief (2026-09-19, branch `claude/consolidate-test-dir`)

**What and why.** This repository has two top-level test directories. `test/`
holds `test/results/`, which `harness.json` declares as the `qa` graph. `tests/`
holds the Playwright `*.e2e.ts` specs and, since PR #395 (merged `b96bc1244`,
hours ago), `tests/health/` with the declared `health` graph at
`tests/health/results/`. There is no principle behind the `s`; the two trees
grew separately. `skills/folio-core/directory-conventions.md` §"`test/` and
`tests/` are both real, and that is an inconsistency" recorded it deliberately
rather than resolving it inside an unrelated PR. The owner has now settled it:
consolidate on `test/`.

**What I already know, and how.** Measured on this branch, 2026-09-19:

- `find tests -type f` → 18 files: 10 `*.e2e.ts`, 2 `support/*.ts` fixtures,
  `tests/health/` (6 files incl. `results/repository.health-report.json`), and
  one stray `tests/test_pypdf_compat.py`.
- `harness.json` declares 11 directories; the `health` entry's `path` is
  `tests/health/results/` and its `description` argues the inconsistency at
  length, so it goes stale the moment the directory moves.
- Overrides in `schemas/folio-config.ts` match on the entry's **`id`**, not its
  `path` (`declarationChain` / `resolveDirectories`). The id `health` does not
  change here, so an inheriting instance's override still binds.
- `GRAPH_KIND_ALIASES` in `schemas/cat-harness.ts` carries exactly one entry,
  `kg → cat-harness`. No graph-kind name changes in this work, so no alias is
  needed.

**Route, and the gate.** `git mv` every file so history follows, then repoint
every reference found by grepping the whole tree for `tests/` (not from a
hand-written list). Verify positively rather than on a green `bun test`: the
failure mode of a path move is a tool that now scans **nothing** and reports a
clean run over it — the `dh4f` shape. So `bun run check:harness-dirs` must still
report 11 declared / 0 missing with the health results directory `ok`,
`bun run health:list` must still name all five checks, and `CI=1 bunx playwright
test` must still collect and run the e2e specs rather than reporting zero.

**What would falsify the approach.** A declaration outside this repository
resolving against `tests/`. Checked from in here: override-by-id above,
`GRAPH_KIND_ALIASES`, and `docs/folio-assistant/folio-assistant-migration.md`
(names `litlfred/qou` as the downstream instance; contains no `tests/` path).
Access is scoped to `litlfred/folio-assistant`, so this cannot be ruled out
absolutely — recorded as an open risk rather than assumed away.

**Not doing.** Not renaming any graph kind or any declaration `id`. Not adding
`test/**` to `tsconfig.json` beyond the `test/health/**` that replaces
`tests/health/**` — Playwright owns the e2e specs and two typecheckers over one
file is a disagreement with no owner. Not editing bean bodies that mention a
never-created `tests/fixtures/`: those are a historical record.

_2026-09-19T11:02:43Z_ — Done on `claude/consolidate-test-dir`, PR #400 — NOT merged, owner decides.

**Moved (18 files, all `git mv` so history follows):** 10 `*.e2e.ts`, `support/qa-fixture.ts`, `support/qa-badge-fixture.ts`, `health/{run,checks,probes}.ts`, `health/{checks,probes,workflow}.test.ts`, `health/results/repository.health-report.json`, and the orphan `test_pypdf_compat.py`. Empty `tests/` removed.

**The four that a grep could not find, because each composes its path from segments — and each fails SILENTLY when stale:** `join("tests", "health", "results")` in `schemas/health-report.ts`; `SCAN_ROOTS` and the test-material prefix rule in `scripts/repo-partition.ts`; `TREES` in `scripts/tests/site-dir-single-answer.test.ts`. The partition one is measured: leaving it stale moved 14 modules from `(test material)` to `unassigned` (179/19 against the correct 193/5) while still printing a total, because the fallback rule keys on `.test.ts`/`.spec.ts` and an `.e2e.ts` matches neither.

**Verified positively, not on a green `bun test`:** `harness:dirs:check` 11 declared / 0 missing with `test/health/results` ok; `health:list` all five checks; Playwright 140 passed from `test/`.

**Open risk I could not close:** whether any instance outside this repository resolves against `tests/`. Override-by-id, `GRAPH_KIND_ALIASES` and the migration doc all say no, but my access is scoped to `litlfred/folio-assistant`, so this is unverified rather than ruled out.
