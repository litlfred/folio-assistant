---
# folio-assistant-k2sg
$schema: bean/1.0.0
title: 'CI speed II (f): fewer runner requests (schedules, writer-records, watchdog churn)'
status: completed
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:26:16Z
updated_at: 2026-11-08T07:12:00Z
parent: folio-assistant-k3vv
---

## Evidence
- scheduled workflows are about 50 % of all runs;
- writer-records takes about 80 minutes;
- watchdog runs churn.

Sibling "CI speed 4" of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

## Done when
- [x] each schedule's interval is justified or widened (three 15-min schedules folded into sweeps.yml; pr-checks-present hourly by owner decision)
- [x] writer-records cost measured before and after
- [x] runner requests per day measured before and after (before: ≈360/day measured 2026-11-04/05; after: due once #2950 has run a day on main)

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

_2026-11-08T07:12:00Z_ — **Post-48h measurement and close-out** (`gh api` against `repos/litlfred/folio-assistant/actions/runs` over the full 48h window `2026-11-06T00:00:00Z..2026-11-07T23:59:59Z`: `616` runs on `2026-11-06` + `604` runs on `2026-11-07` = `1220` runs total, compared against the 24h before baseline `2026-11-04T11:00Z..2026-11-05T11:00Z` of `784` runs):

### 1. Runner requests per day and per hour (before vs 48h after `#2950`)

| event | before /h | before /day | after 48h /h | after 48h /day | delta /day |
|---|---:|---:|---:|---:|---:|
| `schedule` | 14.00 | 336.0 | **6.46** | **155.0** | **−181.0 (−53.9 %)** |
| `workflow_run` | 5.79 | 139.0 | **1.88** | **45.0** | **−94.0 (−67.6 %)** |
| `push` | 2.50 | 60.0 | **1.81** | **43.5** | **−16.5 (−27.5 %)** |
| `pull_request` | 4.71 | 113.0 | 7.08 | 170.0 | +57.0 (+50.4 %) |
| `pull_request_target` | 0.54 | 13.0 | 1.19 | 28.5 | +15.5 (+119.2 %) |
| `workflow_dispatch` | 1.42 | 34.0 | 2.79 | 67.0 | +33.0 (+97.1 %) |
| `dynamic` (Copilot/pages) | 3.71 | 89.0 | 4.21 | 101.0 | +12.0 (+13.5 %) |
| **TOTAL** | **32.67** | **784.0** | **25.42** | **610.0** | **−174.0 (−22.2 %)** |
| of which `cancelled` | 1.42 | 34.0 | 3.17 | 76.0 | +42.0 |

- **Targeted scheduled & cascading triggers:** `Preview verify sweep [schedule]` (`93/day` → `0`), `Re-pin train verdict [schedule]` (`92/day` → `0`), `Staging publish [schedule]` (`90/day` → `0`), and `Feature Staging [push]` (`31/day` → `0`) are all **0** in the 48h window, replaced by `Scheduled sweeps (one dispatcher) [schedule]` (`186` in 48h = `93.0/day`, `3.88/h`), which selectively dispatched `Re-pin train verdict [workflow_dispatch]` (`61` in 48h = `30.5/day`), `Feature Staging [workflow_dispatch]` (`22` = `11.0/day`), and `Staging publish [workflow_dispatch]` (`7` = `3.5/day`). `Re-pin train verdict [workflow_run]` dropped from `108.0/day` (`4.50/h`) to **`1.0/day`** (`2` in 48h, `0.04/h`, `−99.1 %`). `CI health watchdog [workflow_run]` stabilized at `19.5/day` (`39` in 48h, `0.81/h`) with job-level concurrency preventing overlapping churn.

### 2. `writer-records` cost before vs after `#2950`

- **Before `#2950`** (full QA working-copy trace on every run): **82.5–133.4 min** (mean **104.4 min** across 5 completed runs: `41915032726` `92.6m`, `41920888208` `133.4m`, `41938207169` `100.0m`, `41995294681` `82.5m`, `42014603452` `113.4m`).
- **After `#2950`** (QA records carried forward across same-day runs; full QA re-trace ≤ once daily):
  - **Carried-forward runs** (6 completed runs): **27.6–38.6 min job duration** (`34.4–48.8 min` wall time), mean **33.5 min job duration (−67.9 % vs 104.4 min)**, with `Produce the QA working copy, every step traced` dropping from `63.7–92.8 min` to **6.7–8.3 min**:
    - `42143024986` (`2026-11-06T01:19Z`): `38.6m` job (`48.8m` wall; QA step `7.7m`, `derive:publish` `21.7m`)
    - `42150005341` (`2026-11-06T02:23Z`): `34.3m` job (`34.4m` wall; QA step `6.7m`, `derive:publish` `26.3m`)
    - `42169165910` (`2026-11-06T05:33Z`): `36.1m` job (`37.4m` wall; QA step `8.3m`, `derive:publish` `26.2m`)
    - `42174164069` (`2026-11-06T06:23Z`): `31.1m` job (`41.5m` wall; QA step `7.9m`, `derive:publish` `21.6m`)
    - `42184640956` (`2026-11-06T08:00Z`): `33.1m` job (`38.1m` wall; QA step `7.6m`, `derive:publish` `24.0m`)
    - `42414413811` (`2026-11-07T21:08Z`): `27.6m` job (`43.9m` wall; QA step `6.8m`, `derive:publish` `19.4m`)
  - **Daily full re-trace runs** (≤ 1/day): `42129572139` (`2026-11-05T23:28Z`, first full trace on `main`, `120.9m` job, QA step `92.8m`) and `42408803798` (`2026-11-07T19:59Z`, daily full re-trace, `84.8m` job, QA step `63.7m`). (Also `42022389370` skipped `0.0m`, `42137676011` superseded/cancelled at `45.8m`). Across all 8 completed runs since `#2950`, mean job duration dropped from **104.4 min → 50.8 min (−51.3 %)**, and on carried-forward runs to **33.5 min (−67.9 %)**. All Done-when criteria verified; closing bean.
