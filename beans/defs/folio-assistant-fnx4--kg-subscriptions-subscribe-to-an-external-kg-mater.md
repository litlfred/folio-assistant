---
# folio-assistant-fnx4
title: 'KG SUBSCRIPTIONS: subscribe to an external KG, materialise chosen subgraphs, assets and harnesses; known substrates; visualizer'
status: in-progress
type: epic
priority: normal
created_at: 2026-09-30T22:54:31Z
updated_at: 2026-09-30T23:04:05Z
parent: folio-assistant-vuip
---

Issue #1719. Proposal: `cat-harness/docs/proposals/kg-subscriptions.md`.

Owner, 2026-09-30: subscribe to external KGs (bootstrap-conformant, with at least one harness); materialise some or all subgraphs and assets; instantiate harnesses so they reach the navbar; list known substrates in cat-harness; a visualizer; an MVP inside the folio separation.

## Done when
- [ ] 1 schema: `subscriptions` on the declaration, with QA
- [ ] 2 known-substrates registry (derived rows plus hand rows with `status`), with a `:check`
- [ ] 3 visualizer page, generated and read-only
- [ ] 4 subscribe tool: validate a substrate's declaration at a pin
- [ ] 5 materialise a subgraph through `Process_MaterializeRemote`
- [ ] 6 materialise an asset on demand
- [ ] 7 instantiate a harness from a subscription, so it appears in the navbar
- [ ] 8 process, skill and scenarios registered
- [ ] first real subscription: `litlfred/ihris`
