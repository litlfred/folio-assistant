---
# folio-assistant-qnvy
title: 'smart-base: the digital-transformation processes as executable BPMN'
status: todo
type: task
priority: normal
created_at: 2026-09-22T08:35:28Z
updated_at: 2026-09-22T08:35:28Z
parent: folio-assistant-2yyh
---

Issue #877. The owner asked for *"methodlolgies subgraphs for project management, digital trasnform processes"* — the prose half is the methodology node, this is the executable half.

Per `bpmn-processes`: every activity carries `<folio:skill ref>` and `<folio:bean>`, both required. Bean `u4hs` carries the open design question for the methodology subprocess generally — **what triggers it** — and its proposed answer is opening-brief's own trigger, irreversibility and surprise rather than size. This work should not settle that question unilaterally.

`smart-base` already holds `input/bpmn/SGAuthoring.DAKLifecycle.bpmn` upstream; reference it, never vendor it (`smart-base-tools`).

## Done when
- [ ] each process renders through `bun run render:bpmn`
- [ ] `render:bpmn:check` is not stale
