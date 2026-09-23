---
# folio-assistant-yz3w
title: 'ig-incremental-build Gateway_Restore: exit 2 (environment error) has no route'
status: todo
type: bug
created_at: 2026-09-23T16:26:05Z
updated_at: 2026-09-23T16:26:05Z
---

processes/ig-incremental-build.bpmn: Gateway_Restore ('Cache usable?') routes `ig-cache restore` exit 0 → yes (F03, Task_Cone) and exits 1/3 → no (F04, Task_FullBuild). Its own documentation says: 'Exit 2 (an environment error) is not routed by either branch in this diagram.' So the diagram has no path for a real exit code, and an engine following it has nowhere to go.

Found by the gateway documentation criteria (#1051, bean 6hq4), left open when issue #1044 closed.

## Done when
- [ ] check what the implementing workflow/script really does on exit 2 (read the code, don't assume)
- [ ] add a branch that matches that behaviour (likely a failure end event), with a name and documentation
- [ ] regenerate render:bpmn / processes:viz / kg:audit; gates green
