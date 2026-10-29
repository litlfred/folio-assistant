---
# folio-assistant-bssi
$schema: bean/1.0.0
title: 'BEAN DRAIN as a BPMN process: Process_BeanDrain calls the shared OPEN and CLOSE'
status: completed
type: feature
priority: normal
created_at: 2026-10-24T08:30:00Z
updated_at: 2026-10-29T07:40:00Z
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

- [x] `processes/sdlc/bean-drain.bpmn`: build queue, then per bean call OPEN, work, call CLOSE, then refill
- [x] OPEN's check activity names the `bean-claim-check` Tool; the queue step names `drain-queue`
- [x] the `bean-drain` skill links the process
- [x] the m8gz check (a diagram touching a bean calls both OPEN and CLOSE) passes on it

Precedent: epic ml9h, the 2026-10-10 three-lane drain, which the BPMN thread's unlinked-beans
report (cat-harness-tools#703) found with no process. When the diagram lands, link ml9h and its
children (yex5 among them) to `Process_BeanDrain` so they stop showing as unlinked.

Waits on m8gz (BPMN thread). Do not start before OPEN and CLOSE have process ids on main.

_2026-10-24T08:52:00Z_ — **Held by the BPMN thread** (coordinator handoff). Status stays `todo` while blocked on m8gz; it starts stacked on the m8gz cat-harness branch as soon as OPEN and CLOSE have process ids there. Session https://claude.ai/code/session_01UbCbH19GrhqDNakmbgQTF3.

_2026-10-24T10:20:00Z_ — **In progress.** `processes/sdlc/bean-drain.bpmn` (Process_BeanDrain): cat-harness#539 (stacks on #528), walk test cat-harness-tools#731 (stacks on #723), issue cat-harness#538. Open: the `drain-queue` and `bean-claim-check` Tools and the `bean-drain` skill exist only in cat-harness#520 / tools#706, so steps bind to skills for now; name the Tools and link the skill once those land. After #539 merges, link ml9h children (yex5; fz79, g3h7, kpci, mm4u, ndp0, np6o, t1vl, zckw) to Process_BeanDrain. Session https://claude.ai/code/session_01UbCbH19GrhqDNakmbgQTF3.

_2026-10-29T07:25:00Z_ — cat-harness#539 (Process_BeanDrain) merged as 1482690 by the owner. tools#731 (walk test) waits on tools#723, which waits on the index pinning sci 3ee9d5b (folio-assistant#2681).

## Closed 2026-10-29

All done-when boxes met. cat-harness#539 (bean-drain.bpmn), cat-harness-tools#731 (engine walk) and cat-harness#657 (skill links the process) merged 2026-10-29. (Lane B drain thread.)
