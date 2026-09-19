---
# folio-assistant-3vge
title: Repository health checks under tests/health, with a deletion-confirmation skill and a 24h trigger
status: in-progress
type: feature
priority: high
created_at: 2026-09-19T10:10:02Z
updated_at: 2026-09-19T10:10:02Z
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
