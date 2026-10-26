---
# folio-assistant-v3zw
$schema: bean/1.0.0
title: 'DEPLOYMENT DESCRIPTIONS (resolver): who may run a task here, which Tool works for them, which route a gateway takes (report only)'
status: in-progress
type: task
priority: normal
created_at: 2026-10-24T08:45:00Z
updated_at: 2026-10-26T13:20:00Z
parent: folio-assistant-o1by
---

Proposal §3.2. One gate: a declared process with a task that no placement can run. Its strength at first (fail or report) is the proposal's open question 3.

_2026-10-24T08:42:41Z_ — Owner answers on the proposal: descriptions live in a `deployments/` subgraph, several per instance (Q1 A); the jurisdiction block is in now, as optional fields (Q2 A); a task that no placement can run is REPORTED and never fails CI (Q3 C).

_2026-10-24T12:00:00Z_ — Claimed and in review by the Claude drain thread (session https://claude.ai/code/session_01CLVaA6b8XQ5xhvqNZCqc4R): litlfred/cat-harness#549, stacked on #546. It is a pure resolver that reports only. Reading BPMN and Tools into it is command code for cat-harness-tools, and it is still to do.

_2026-10-26T13:20:00Z_ — Progress update: pure resolver `litlfred/cat-harness#549` (`d0fc133e`, `2026-10-26T11:47:08Z`) merged on `main`; corpus command `deployments:report` is in review in `litlfred/cat-harness-tools#780`.
