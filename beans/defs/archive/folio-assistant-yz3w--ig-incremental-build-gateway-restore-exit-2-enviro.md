---
# folio-assistant-yz3w
title: 'ig-incremental-build Gateway_Restore: exit 2 (environment error) has no route'
status: completed
type: bug
priority: normal
created_at: 2026-09-23T16:26:05Z
updated_at: 2026-09-23T16:45:19Z
parent: folio-assistant-1swy
---

processes/ig-incremental-build.bpmn: Gateway_Restore ('Cache usable?') routes `ig-cache restore` exit 0 → yes (F03, Task_Cone) and exits 1/3 → no (F04, Task_FullBuild). Its own documentation says: 'Exit 2 (an environment error) is not routed by either branch in this diagram.' So the diagram has no path for a real exit code, and an engine following it has nowhere to go.

Found by the gateway documentation criteria (#1051, bean 6hq4), left open when issue #1044 closed.

## Done when
- [x] check what the implementing workflow/script really does on exit 2 — **nothing implements it yet**: `ig-cache` is named in the diagram's header as a tool the proposal asks for and no skill wraps, and no file in this repo defines its exit codes beyond Task_Restore's documentation
- [x] add a branch — `environment error` → Task_LogEnvError (work-plan lane, bean note) → EndEvent_EnvError. Chosen over falling back to the full build: an unreadable cache says nothing about whether it is usable, and a silent fallback hides a broken store behind a slow green run; matches the lane rule that every failure branch leaves a record
- [x] regenerate render:bpmn / processes:viz / kg:audit; gates green

## Summary of Changes

Fixed in PR #1116 — see the checked items above for what changed and why.
