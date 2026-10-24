---
# folio-assistant-bssi
$schema: bean/1.0.0
title: 'BEAN DRAIN as a BPMN process: Process_BeanDrain calls the shared OPEN and CLOSE'
status: todo
type: feature
priority: normal
created_at: 2026-10-24T08:30:00Z
updated_at: 2026-10-24T08:30:00Z
parent: folio-assistant-ahvw
blocked_by:
    - folio-assistant-m8gz
---

Owner choice A, 2026-10-24 08:20Z: model the drain as a BPMN process, after m8gz lands.

m8gz's option A ruling (08:15Z) splits `Process_BeanLifecycle` into a reusable OPEN
(check, create, whose, claim or leave alone) and CLOSE (complete and archive, scrap
with reasons, or record a blocker), called by every bean-touching process. The drain
is one such process: OPEN is where the `bean-claim-check` Tool runs (n7x7), and
CLOSE is where a drained bean ends.

## Done when

- [ ] `processes/sdlc/bean-drain.bpmn`: build queue, then per bean call OPEN, work, call CLOSE, then refill
- [ ] OPEN's check activity names the `bean-claim-check` Tool; the queue step names `drain-queue`
- [ ] the `bean-drain` skill links the process
- [ ] the m8gz check (a diagram touching a bean calls both OPEN and CLOSE) passes on it

Waits on m8gz (BPMN thread). Do not start before OPEN and CLOSE have process ids on main.
