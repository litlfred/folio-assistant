---
# folio-assistant-auap
title: Consolidate test/ and tests/ onto test/ — one test tree, one declaration
status: completed
type: task
priority: normal
created_at: 2026-09-19T10:48:26Z
updated_at: 2026-09-19T11:16:54Z
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

_2026-09-19T11:16:53Z_ — Closing: merged as PR #400, merge commit 9c2b6a8aa on main, after the owner said to proceed on 2026-09-19. Verified on main rather than taken on the implementing agent's report: zero paths remain under tests/ in the tree; all four composed-path constants now read 'test' (schemas/health-report.ts HEALTH_RESULTS_DIR, scripts/repo-partition.ts SCAN_ROOTS and its test-material prefixes, scripts/tests/site-dir-single-answer.test.ts TREES), with scripts/tests/ — a different directory that stays — correctly untouched. Verified POSITIVELY rather than on a green suite, because the failure mode of a path move is a tool that scans nothing and reports clean: 'bun run harness:dirs:check' reports 11 declared / 0 missing with test/health/results listed ok, and 'bun run health:list' names all five checks rather than zero.

THE OPEN RISK IS NOW CLOSED, and closed negatively, which is the strongest form. The PR's ## Not verified said it could not rule out an instance outside this repository resolving against tests/, since its access was scoped to folio-assistant. litlfred/qou was added to the session and cloned at c98c47345. It has NO directory declaration at all — no harness.json, no cat-harness.json, and no file anywhere in it containing a "graphs" key — so there is nothing that could override or resolve against this repository's tests/ path. That is exactly the case AGENTS.md calls fine: 'Absent declaration is fine (an unmigrated instance falls back to today's conventions).' Three supporting checks, all clean: folio.config.json names exactly three platform paths (folio-assistant/feedback, folio-assistant/viewer, folio-assistant/simulators) and none is a test directory; 'grep -rn folio-assistant/tests' across every config, workflow and script in qou returns zero matches; and there is no .gitmodules, so the platform is not attached as a submodule whose paths would bind. Every tests/ hit in qou is its own — tools/pyhecke/tests/, tools/qou-substrate/tests/, tests/simulators.spec.ts — its own Python and Playwright layout, untouched by anything here.

Left open deliberately, per the PR: tests/test_pypdf_compat.py was moved for consistency but NOT relocated into scripts/tests/, because nothing references it and no workflow runs it, and moving it there would make it execute for the first time — a behaviour change dressed as a path fix.
