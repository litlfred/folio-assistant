---
# folio-assistant-x35i
$schema: bean/1.0.0
title: 'CI speed II (c): Code-quality gates setup duplication (no bun cache, smart:pages x17, ig-index x10)'
status: todo
type: task
priority: high
tags:
    - ci-speed-ii
created_at: 2026-11-05T08:26:16Z
updated_at: 2026-11-05T08:26:16Z
parent: folio-assistant-k3vv
---

## Evidence
Code-quality gates repeats its setup in every job:
- no bun install cache;
- `smart:pages` runs 17 times and `ig-index:build` 10 times per run;
- the qa-working-copy → publish-pages chain sits in front of most jobs.

Worked by the sibling "CI speed 1" of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf. The two `cisp` children closed undone are filed under this epic as c1 and c2.

## Done when
- [ ] bun install cached
- [ ] smart:pages and ig-index built once per run and handed to the jobs that read them
- [ ] runner-minutes per Code-quality gates run measured before and after (run IDs cited)

_2026-11-05T08:40:00Z_ — Filed by https://claude.ai/code/session_01VQDpPejdhwKpDJHfgEBPTk from the CI-speed analysis of session https://claude.ai/code/session_01VQDpPffYARDQ8juksAZScf.
