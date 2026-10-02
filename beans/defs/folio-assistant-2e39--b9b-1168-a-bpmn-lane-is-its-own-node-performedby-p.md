---
# folio-assistant-2e39
title: 'B9b (#1168): a BPMN lane is its own node; performedBy points at the registry role'
status: completed
type: task
priority: normal
created_at: 2026-09-30T10:54:25Z
updated_at: 2026-09-30T12:36:35Z
parent: folio-assistant-tr05
---

Owner, 2026-09-30: Lane node. kg-export mints role/<lane name> per lane, so one role can get two nodes or merge by accident. Emit process/<p>/lane/<id> (type Lane) with bindsRole; performedBy goes to role/<roleRef>.

## Done when
- [ ] lanes exported as Lane nodes, not Role nodes
- [ ] performedBy resolves to registry Role nodes, 0 dangling



## Done — #1587
Lane nodes (process/<p>/lane/<id>, partOf, bindsRole); ProcessNode.performedBy → registry role via roleRef, inLane → Lane. Every Role is a registry role; kg-export.test pins it.
