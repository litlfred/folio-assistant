---
# folio-assistant-pdsq
$schema: bean/1.0.0
title: 'Re-pin trains: fix the 3 standing blockers (owner 2026-11-06)'
status: in-progress
type: task
priority: high
created_at: 2026-11-06T05:55:05Z
updated_at: 2026-11-06T05:55:05Z
parent: folio-assistant-k3vv
---

Owner litlfred 2026-11-06 chose 'One new session': fix the 3 causes failing re-pin trains fa#2975…#2986.

## Done when
- [ ] Cause 1: cat-harness#1097 (re-pin bootstrap 12fa6d5 / tools 9f478d4 + 2 checklists) merged
- [ ] Cause 3: cat-harness#1088 (CI speed 14, Process_Cache skills + summary) merged
- [ ] Cause 2: fa#2985 (integrator, caches:viz:check gate) merged
- [ ] Train session (session_01XueePufkpx8fwJxavyDS5h) told; next train green on these 3

- Owner litlfred, 2026-11-06 (card in session_01VQDpPfgkavzcfGinEE2Yzi): "1. Yes, on green" — this session merges cat-harness#1097 then cat-harness-tools#1570 (the cascade of work item pqlh) when green, or when every red also fails on main (proven).
