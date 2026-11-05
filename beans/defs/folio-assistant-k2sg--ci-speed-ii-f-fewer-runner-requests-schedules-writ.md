---
# folio-assistant-k2sg
$schema: bean/1.0.0
title: 'CI speed II (f): fewer runner requests (schedules, writer-records, watchdog churn)'
status: todo
type: task
priority: normal
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:26:16Z
updated_at: 2026-11-05T08:26:16Z
parent: folio-assistant-k3vv
---

## Evidence
- scheduled workflows are about 50 % of all runs;
- writer-records takes about 80 minutes;
- watchdog runs churn.

Sibling "CI speed 4" of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.

## Done when
- [ ] each schedule's interval is justified or widened
- [ ] writer-records cost measured before and after
- [ ] runner requests per day measured before and after

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk from the CI-speed analysis of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.
