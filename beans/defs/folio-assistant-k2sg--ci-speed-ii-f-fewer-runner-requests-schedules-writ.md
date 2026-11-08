---
# folio-assistant-k2sg
$schema: bean/1.0.0
title: 'CI speed II (f): fewer runner requests (schedules, writer-records, watchdog churn)'
status: in-progress
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:26:16Z
updated_at: 2026-11-08T07:03:00Z
parent: folio-assistant-k3vv
---

## Evidence
- scheduled workflows are about 50 % of all runs;
- writer-records takes about 80 minutes;
- watchdog runs churn.

Sibling "CI speed 4" of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

## Done when
- [x] each schedule's interval is justified or widened (three 15-min schedules folded into sweeps.yml; pr-checks-present hourly by owner decision)
- [ ] writer-records cost measured before and after
- [ ] runner requests per day measured before and after (before: ≈360/day measured 2026-11-04/05; after: due once #2950 has run a day on main)

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk from the CI-speed analysis of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

_2026-11-05T08:33:33Z_ — Claimed by claude/ci-runner-request-cuts — pushed to cat/cat-harness/beans so sibling sessions see it before this branch has a PR (bean 35nj).

_2026-11-05T11:11:24Z_ — Landed in #2950 (merged 2026-11-05 11:11Z): sweeps.yml 15-min dispatcher replaces 3 schedules; repin verdict workflow_run filtered to repin-train/**; feature-staging push trigger dropped (sweep dispatches conflicted PRs); ci-health job-level concurrency; writer-records QA records carried forward (full re-trace ≤ daily). Est. ≈360 → ≈120 runs/day; re-measure after a day on main. jsonld-gen-check left unfolded (CQG overlap).

_2026-11-05T12:47:48Z_ — Early measurement (read-only, gh api run list) by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk. BEFORE 2026-11-04 11:00Z→11-05 11:00Z (24 h, 784 runs); AFTER 11-05 11:15Z→12:47Z (1.5 h, 117 runs). Runs/hour; cancelled counted in totals but listed apart.

| event | before /h | after /h |
|---|---|---|
| schedule | 14.0 | 6.6 |
| push | 2.5 | 4.0 |
| pull_request | 4.7 | 33.9 |
| pull_request_target | 0.5 | 5.3 |
| workflow_run | 5.8 | 6.0 |
| workflow_dispatch | 1.4 | 4.0 |
| other (dynamic: Copilot/pages) | 3.7 | 17.9 |
| TOTAL | 32.7 | 77.8 |
| of which cancelled | 1.4 | 8.6 |

The triggers #2950 targeted, /h before → after: Preview verify sweep [schedule] 3.88 → 0; Re-pin train verdict [schedule] 3.83 → 0; Staging publish [schedule] 3.75 → 0; Re-pin train verdict [workflow_run] 4.50 → 0; Feature Staging [push] 1.29 → 0; added: Scheduled sweeps 3.32 (5 ticks, one 15-min tick skipped by GitHub) + dispatched Re-pin verdict 0.66 + Feature Staging dispatch 0.66. Net ≈17.3 → ≈4.6 runner requests/h (−73 %, ≈ −300/day). Scheduled jobs: 15.0 → 7.9 jobs/h; runner-minutes 4.5 → 4.1/h (one 2.7-min Re-pin train run dominates the short window), per-job minutes rounded up 15.5 → 7.9/h. Billable timing API returns 0 ms (public repo), so minutes are from job start/end. The total went UP because PR traffic spiked after the merge (Code-quality gates [pull_request] 1.67 → 21.3/h; PR runs cancelled 0.6 → 7.3/h), not because of #2950. Sweeps logs show the dispatcher deciding correctly: 42018601119, 42020558167 (no work; #2948 conflict already previewed), 42028937014 (dispatched repin-train-verdict → 42029070188). Unmeasured yet: writer-records (before 82–133 min: 41915032726, 41920888208, 41938207169, 41995294681; after only 42022389370, skipped) and watchdog churn (CI health watchdog [workflow_run] 0.54 → 2.66/h, too few to judge). Verdict: HOLDS for the targeted triggers (−73 % of those requests); TOO EARLY for whole-repo runs/day, writer-records and watchdog — re-measure after 24 h on main.

_2026-11-08T07:03:00Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: inactive > 3h, completing verification/close-out in Round 4 drain.
