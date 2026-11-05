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
updated_at: 2026-11-05T11:11:25Z
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
