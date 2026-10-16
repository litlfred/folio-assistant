---
# folio-assistant-96y4
title: 'smart-immunizations has no BPMN: IMMZ.A-I exist only as SVG images, and its personas only as HTML'
status: todo
type: task
priority: normal
created_at: 2026-10-10T14:06:52Z
updated_at: 2026-10-10T14:06:52Z
---

Measured 2026-10-10 on litlfred/smart-immunizations main (86898e6): its nine processes IMMZ.A–I exist only as SVG images (`input/images/immz-*-business-process.svg`) and a pagecontent table. `input/business-processes/` is empty and there are no `.bpmn` files. The personas are HTML tables only; `input/fsh/actors/` is empty.

So the recommendation-scenario extraction can reference a process only by its id and title, not by a BPMN task or lane.

## Done when
- [ ] IMMZ.A–I as BPMN, with lanes matching the personas, from the DAK document (WHO IRIS 9789240099456) and the SVGs
- [ ] personas as ActorDefinition FSH (smart-base `SGPersona`)
