---
# folio-assistant-pdsq
$schema: bean/1.0.0
title: 'Re-pin trains: fix the 3 standing blockers (owner 2026-11-06)'
status: in-progress
type: task
priority: high
created_at: 2026-11-06T05:55:05Z
updated_at: 2026-11-06T08:36:09Z
parent: folio-assistant-k3vv
---

Owner litlfred 2026-11-06 chose 'One new session': fix the 3 causes failing re-pin trains fa#2975…#2986.

## Done when
- [x] Cause 1: cat-harness#1097 merged 43d7648 — (re-pin bootstrap 12fa6d5 / tools 9f478d4 + 2 checklists) merged
- [x] Cause 3: cat-harness#1088 merged — (CI speed 14, Process_Cache skills + summary) merged
- [ ] Cause 2: fa#2985 (integrator, caches:viz:check gate) merged
- [ ] Train session (session_01XueePufkpx8fwJxavyDS5h) told; next train green on these 3

- Owner litlfred, 2026-11-06 (card in session_01VQDpPfgkavzcfGinEE2Yzi): "1. Yes, on green" — this session merges cat-harness#1097 then cat-harness-tools#1570 (the cascade of work item pqlh) when green, or when every red also fails on main (proven).

- 2026-11-06 07:45Z: cat-harness-tools#1570 (cascade, work item pqlh) merged df04aaa. Finding: cat-harness PR CI mounts layers in an fa composition at FA MAIN's pins, so its bpmn:checklist:check judges the checklists against fa's bootstrap (c90ef45), not cat-harness's own lock; red on cat-harness main and PRs until fa#2985 moves fa's bootstrap to 12fa6d5. #1097 merged with that red proven main's own (identical checklist blobs ecb5f81d9e / c0d15492f2).

_2026-11-06T08:36:09Z_ — Claimed by agy (92bff8c9-777d-458a-a380-8dd5bf5cc0f3) with bean-claim-check: no other agent's commit in the window, no open PR naming it.
- Owner litlfred, 2026-11-06 ~08:35Z, typed in this session: "repin as needed. merge when green and ready for all your PRs within 6hr window" (until ~14:35Z). At that time this session had no open PRs (cat-harness#1097, cat-harness-tools#1570 both merged).
