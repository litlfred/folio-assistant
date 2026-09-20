---
# folio-assistant-lr7h
title: 'CI HEALTH: the window is 6.1 hours, so the weekly watchdog cannot appear in its own report'
status: in-progress
type: task
priority: normal
created_at: 2026-09-20T14:28:52Z
updated_at: 2026-09-20T14:29:26Z
parent: folio-assistant-1xhc
---

`check:ci-health` exists because `docs-site.yml` failed 30 consecutive runs
over two months with nothing in the repository saying so (bean `xom7`). It
reproduced that defect inside itself.

## Measured 2026-09-20

    GET /repos/litlfred/folio-assistant/actions/runs?branch=main&per_page=100
      runs: 100      total_count: 1096
      window: 2026-09-20T08:14:57Z -> 2026-09-20T14:19:14Z   =  6.1 hours
      distinct workflow paths in window: 3

    $ ls .github/workflows/*.yml | wc -l
      38

    $ bun run check:ci-health
      CI health on `main` (100 recent runs)
        ✓ JSON-LD generated-file drift    green
        ✓ Code-quality gates              green
        ✓ Docs site (GitHub Pages)        green

Three ticks. Thirty-eight files. No statement of what was not looked at.

## Two independent defects, and the second is the sharp one

**1. A workflow with no runs was not a row — it was absent.** Every row came
from grouping the runs, and a group is never empty, so `Health`'s `"no-runs"`
state (set in `classifyRuns` at `runs.length === 0`) was **unreachable dead
code**. The report was a function of the runs alone, in which "did not run" and
"does not exist" are the same observation.

**2. `?per_page=100` is a page of RUNS, not a period.** How far back it reaches
is a function of how busy the repository is. At 1096 runs on the branch it
reached 6.1 hours. So:

| workflow | schedule | can it appear? |
|---|---|---|
| `ci-health.yml` | weekly, Mon 09:17 | **no** — never, at this rate |
| `upstream-pins.yml` | weekly, Tue 09:43 | **no** |
| `health-check.yml` | daily 06:41 | only if the repo is quiet |

`ci-health.yml` is the workflow whose entire purpose is catching failures where
nobody looks. It could not appear in the report it generates.

This also explains a discrepancy in bean `52dz`, which recorded that
`check:ci-health`'s **first finding** was *"Repository health watchdog — 1
consecutive failure(s)"*. That finding later vanished. It was not fixed; the
repository got busy and the window shrank past it. **A report whose scope
silently varies with unrelated activity is worse than a fixed-scope one**,
because a finding disappearing looks like a finding resolved.

## What was done

- `assess` takes `knownWorkflows` (the file list) as a SECOND source of truth,
  so a file with no run becomes a `no-runs` row. Omitting it keeps the old
  behaviour exactly — `undefined` (did not look) and `[]` (there are none) are
  different answers.
- The window's **span** is reported, not just its run count.
- A workflow carrying `schedule:` that the window missed is **asked about
  directly**, one request each, capped at 8. The module header rejects fanning
  out to all 38 on rate-limit grounds and is right; this fans out to three.
- Three probe states kept apart: topped-up, `never-ran` (asked, answered zero
  — a real finding, `5rfy`'s shape), `unknown` (request failed, claims
  nothing). The first draft collapsed the last two and reported a clean
  measurement as a failed one.
- The `✓ every workflow … is green` tick is **withheld** when a scheduled
  workflow is unjudged.

## The report now, same repository, same minute

    CI health on `main` (100 recent run(s) spanning 6.1h)
      ❔ Repository health watchdog   last failed 0d ago; file changed since — stale, not green
      ✓ JSON-LD generated-file drift  green
      ✓ Code-quality gates            green
      ✓ Docs site (GitHub Pages)      green
      ✓ CI health watchdog            green
      ⚠ Upstream pin watchdog         UNJUDGED — scheduled, and has NEVER run on this branch (asked directly). Not green.

      32 further workflow file(s) produced no run in the window — unjudged, not green.

Two of those six were invisible before, one of them is a finding, and the
denominator is finally stated. `Upstream pin watchdog` having **never run on
this branch** is new information that no run-reading report could ever produce.

Exit code is unchanged: none of this is a failure, and a false fire is what
this module documents as costing a report its credibility.

## Done when

- [x] a workflow file with no runs is a row rather than an absence
- [x] the window's span is stated, so "green" carries its scope
- [x] scheduled workflows the window missed are asked about directly
- [x] never-ran, could-not-ask and topped-up stay three different answers
- [x] ratchet falsified in both directions (11 tests; removing the file list
      fails 5, collapsing the probe states fails 1)
- [ ] **owner:** `upstream-pins.yml` has never run on `main`. Its cron is
      `43 9 * * 2`. Is it expected to run, or is it another `5rfy` neutering?
