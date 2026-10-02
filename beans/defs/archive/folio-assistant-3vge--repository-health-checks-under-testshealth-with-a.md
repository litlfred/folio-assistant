---
# folio-assistant-3vge
title: Repository health checks under tests/health, with a deletion-confirmation skill and a 24h trigger
status: completed
type: feature
priority: high
created_at: 2026-09-19T10:10:02Z
updated_at: 2026-09-19T10:42:33Z
---


## Opening brief

**What, and why it is worth doing.** Three artefacts the owner asked for on
2026-09-19, in one branch because they are one mechanism: (1) a skill saying an
agent never deletes a durable artefact on its own initiative; (2) a registry of
repository health checks under `tests/health/`, writing committed results to
`tests/health/results/`; (3) a daily trigger that maintains one tracking issue,
modelled on `ci-health.yml`. The link between (1) and (2) is the live defect
`plj1`: `docs-site.yml` had been deleting every open PR's staging preview on
every deploy — an *accidental* deletion nobody decided, which overrode
`feature-staging.yml`'s written retention policy. #377 stopped it, which turns
staging growth into a real curve that now needs watching. Hence the owner's
100 MB threshold.

**What I already know, measured 2026-09-19 on `origin/main` / `origin/gh-pages`
in this worktree.**

| fact | value | command |
|---|---|---|
| staging previews | 6, 222.5 MB total, 36.7–37.6 MB each | `git ls-tree -r -l origin/gh-pages:STAGING/<dir>` summed |
| `.git` | 349 MB (`size-pack` 308.73 MiB, 42 packs) | `du -sh .git`, `git count-objects -vH` |
| beans | 263 files; 176 completed, 52 todo, 29 in-progress, 6 scrapped | `ls beans/defs \| wc -l`, `grep -h '^status:'` |
| duplicate bean titles | 0 | front-matter `title:` counted |
| stale `in-progress` beans (>14d) | 0 | `updated_at` vs 2026-09-19 |
| todos | 3 | `find todos -name '*.md'` |

So on this repo today the staging check fires (222 MB > 100 MB) and the repo-size
check fires; the bean and todo checks are clean-but-determined.

**Route, and what would falsify it.** An extensible registry
(`tests/health/checks.ts`), each check returning a three-state verdict —
`ok` / `finding` / `unknown` — never two. `unknown` gets its own exit code (2)
and the workflow leaves the tracking issue untouched and fails, exactly as
`ci-health.yml` does, because a watchdog going blind must not read as good news.
Results are a committed `health-report/v1` document that declares itself with a
`$schema` tag rather than being duck-typed by path. `tests/health/results/` is
declared in `harness.json` as a new `health` graph kind.

**Falsification.** If a check cannot be shown *firing on a fixture* — as opposed
to returning clean on the live repo — it is not a check, because a function that
returns `[]` for everything passes a corpus test. Each check ships with a
fixture test that makes it fire. Second falsifier: if the results document
cannot be read back and its findings named without consulting the path it was
found at, the `$schema` contract is not doing its job.

**Not doing.** Not relocating the existing `test/results/` tree — the repo has
BOTH `test/` and `tests/`, the owner asked for `tests/health`, and moving a
declared directory as a side effect of an unrelated change is how `dh4f`
happens. The inconsistency is flagged in the PR, not silently resolved. Not
opening a GitHub issue to exercise the tracking-issue path — that is forbidden
without the owner's permission, so the path is exercised with a fixture.

_2026-09-19T10:33:21Z_ — All four deliverables landed on claude/health-checks (PR #395), main merged in at b10aca59e.

Skill: skills/folio-core/deletion-requires-confirmation.md, registered in folio-core's package-manifest, mirror regenerated into docs/folio-assistant/reference/skill-instructions/. AGENTS.md's bean rule now points at it as the general case rather than restating it.

Checks: five in tests/health/checks.ts, results at tests/health/results/repository.health-report.json ($schema health-report/v1). Measured at the merge commit 2026-09-19: 9 staging previews totalling 311.4 MB (major), 4 of them matching no open PR, .git 365.5 MB against 33.6 MB tracked (10.9x, 46 packs), 184 resolved beans still inline. Todo store clean at 3 open.

Harness: new 'health' graph kind at tests/health/results/, touching BASE_GRAPH_KINDS, both enumerating assertions in cat-harness.test.ts, and the documented-kinds table.

Trigger: .github/workflows/health-check.yml, daily 06:41 UTC plus workflow_dispatch plus 'bun run health'.

Open question for the owner, stated in the PR: this repo has both test/ and tests/. My recommendation is consolidating on test/ in a separate PR, because it is the side with a harness declaration pointing at it. Not done here.

_2026-09-19T10:42:33Z_ — Closing: merged as PR #395, merge commit b96bc1244 on main, after the owner said 'merge' on 2026-09-19. All four deliverables landed and verified on main, not taken on report: skills/folio-core/deletion-requires-confirmation.md exists and is registered; tests/health/ carries checks.ts, probes.ts, run.ts and three test files with results at tests/health/results/repository.health-report.json; harness.json declares the health graph kind at tests/health/results/; and .github/workflows/health-check.yml runs daily at 41 6 * * * plus workflow_dispatch. Smoke-tested on main after the merge: 'bun run health:list' lists all five checks. Also checked independently rather than relayed — the green was on the real head e6775e956 (run 35437880188, not a stale run on an older commit), and a grep of the whole sweep and its workflow for rm / unlinkSync / rmSync / git rm / beans delete / DELETE / branch deletion found nothing destructive, only a test cleaning up its own mkdtempSync fixtures and two finding STRINGS saying 'Never beans delete'. That mattered because the PR's own subject is a rule against agents deleting things. Left open deliberately and NOT folded in here: the test/ vs tests/ inconsistency, which the agent flagged in directory-conventions.md with its recommendation (keep test/, since it is the side harness.json declares and the health entry has no downstream consumers yet, so the move is cheap today and gets dearer); and the four findings the sweep now reports on this repo — 9 staging previews at 311.4 MB, 4 of them orphaned, .git at 10.9x the tracked tree, 184 resolved beans still inline — every one of which is a person's decision by this PR's own rule.
