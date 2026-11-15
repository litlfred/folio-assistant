---
# folio-assistant-v3zw
$schema: bean/1.0.0
title: 'DEPLOYMENT DESCRIPTIONS (resolver): who may run a task here, which Tool works for them, which route a gateway takes (report only)'
status: completed
type: task
priority: normal
created_at: 2026-10-24T08:45:00Z
updated_at: 2026-10-30T12:34:00Z
parent: folio-assistant-o1by
---

Proposal §3.2. One gate: a declared process with a task that no placement can run. Its strength at first (fail or report) is the proposal's open question 3.

_2026-10-24T08:42:41Z_ — Owner answers on the proposal: descriptions live in a `deployments/` subgraph, several per instance (Q1 A); the jurisdiction block is in now, as optional fields (Q2 A); a task that no placement can run is REPORTED and never fails CI (Q3 C).

_2026-10-24T12:00:00Z_ — Claimed and in review by the Claude drain thread (session https://claude.ai/code/session_01CLVaA6b8XQ5xhvqNZCqc4R): litlfred/cat-harness#549, stacked on #546. It is a pure resolver that reports only. Reading BPMN and Tools into it is command code for cat-harness-tools, and it is still to do.

_2026-10-26T13:20:00Z_ — Progress update: pure resolver `litlfred/cat-harness#549` (`d0fc133e`, `2026-10-26T11:47:08Z`) merged on `main`; corpus command `deployments:report` is in review in `litlfred/cat-harness-tools#780`.

_2026-10-30T12:34:00Z_ — `litlfred/cat-harness-tools#780` merged on `main` (`02605686c24ea32505204cc7e5bf79301919dddd`, `2026-10-30T11:39:42Z`) and is pinned on `folio-assistant` `main` via `cat-harness-tools@eeacfdc828c8`. Verified in the composed index: `bun run cat deployments:report` exits 0 (`912 task(s) in 113 process(es), 37 actor(s), 253 Tool(s)` across `developer`, `private-github`, `self-sovereign`, `sovereign-cloud`, `test-swarm`, `today`) and all 42 tests across `deployment-description.test.ts`, `deployment-resolver.test.ts`, `deployment-examples.test.ts`, and `deployment-report.test.ts` pass. Completed.
