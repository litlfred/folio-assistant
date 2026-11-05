---
# folio-assistant-gzgh
$schema: bean/1.0.0
title: 'Phase 4: watch owned harness PRs land and close paired issues'
status: in-progress
type: task
priority: normal
created_at: 2026-11-02T06:50:00Z
updated_at: 2026-11-05T13:34:35Z
parent: folio-assistant-4j43
tags:
    - harness-drain-2026-11-02
---

Owner threads merge these; the drain thread watches and takes over after 2 h idle:
cat-harness #951 (#950), #949 (#948), #953, #954, #885 (#884), #934 (6fez), #896 (#894, after tools re-pin); tools #1376 (#1375), #1357 (#1356), #1354.
When each merges, check its paired issue closed. Never merge a PR whose files touch subscriptions/*/.

_2026-11-02T06:50:00Z_ — Filed by the harness drain thread (owner card Q-HDR-1 A, 2026-11-02 06:44Z), session https://claude.ai/code/session_01Qmmkt5upL17RB2jgQPi8Mx

_2026-11-05T13:34:35Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: no other agent's commit in the window, no open PR naming it.
