---
# folio-assistant-6hq4
title: 'QA: gateway documentation-completeness criteria (decisions and their branches)'
status: in-progress
type: task
created_at: 2026-09-23T09:56:25Z
updated_at: 2026-09-23T09:56:25Z
parent: folio-assistant-1swy
---

Extend the documentation-completeness QA control (issue #1007, bean `ooq3`)
past activities, to the decision points of a diagram.

## Measurement (2026-09-23, all 62 diagrams `kg-audit` loads, 0 load failures)

- Gateways: 123 — 111 exclusive (102 diverging, 9 converging), 12 parallel
  (6 fork, 6 join), 0 inclusive (the model refuses them). 104 of 123 carry no
  `<bpmn:documentation>`; of the 102 DECISIONS (diverging exclusive) 83 do not.
- Branches out of a diverging exclusive gateway: 220, **0** unnamed, 0
  duplicate labels on one gateway.
- Start/end events: 174, **0** unnamed — no event criterion added.
- Lanes: `check:lane-documentation` reports 0 undocumented — already gated.

## Done when

- [ ] `gateway-documented` (minor) in `kg-qa.ts`, wired into `auditProcess`
- [ ] `gateway-branches-named` (minor) in `kg-qa.ts`, wired into `auditProcess`
- [ ] per-process pages show a "Decisions" table
- [ ] the worst processes' decisions documented from a source; the rest counted here
- [ ] generated artefacts regenerated; `bun run gates` green
- [ ] PR open against `main`, issue commented after each push
