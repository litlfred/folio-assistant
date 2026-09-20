---
# folio-assistant-fgnw
title: 'IN-PROGRESS CARRIES NO ACTIVITY: 43 of 60 claims untouched in 4h and no rule says what that means'
status: todo
type: task
priority: normal
tags:
    - instruction-gap
created_at: 2026-09-20T18:05:19Z
updated_at: 2026-09-20T18:05:19Z
parent: folio-assistant-ahvw
---

Found by the goal-review sweep of 2026-09-20 13:45–17:45 UTC (session_017PqeiS4JYySSWGAYLedmus, bean `mgta`, issue #578). An instruction gap: something the instructions said that the sweep could not do as written, said two ways, or did not say.

## Measured
60 beans were `in-progress`; 43 had no change in the window, and 38 of those were last touched by one bulk move at 09:37. Eight sessions were active. So at most 17 claims corresponded to a session working them, and the status field cannot tell which.

## The gap
bean-coordination §"A claim is branch-local" says a claim announces rather than reserves; bean-blocking gives a *blocked* bean an expiry. An in-progress claim has none, so "in-progress" carries no information about activity, and a reviewer cannot tell a stalled agent from an abandoned claim.

## Done when
- [ ] A rule states what an in-progress claim with no activity for N hours means, and who may act on it
- [ ] `bun run health` (or the goal-review sweep) reports claims without activity in the window, as a finding a person acts on — it never changes a status itself
