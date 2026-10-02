---
# folio-assistant-hcpz
title: seed:ready — per-layer seeding readiness gateway for kg-separation (Source settled?)
status: in-progress
type: task
priority: normal
created_at: 2026-10-02T17:22:19Z
updated_at: 2026-10-02T17:22:27Z
parent: folio-assistant-7x5n
---

Owner approved 2026-10-02: 'seed:ready: check skills/process to harness / KG separation and align.' The steward applied stability criteria by hand before a seeding review (heavy-mover PRs landed; no open PR touches the next layer; at most 5 touch the layer; none moves files in it). This bean makes that a DMN-backed gateway in kg-separation.bpmn, evaluated by bun run seed:ready --layer <name>, reading the layer map from the instance declarations. Serves S7 mgxw and S3 ga6u.

## Done when
- [ ] survey of existing readiness definitions recorded in the PR
- [ ] decisions/seed-readiness-gate.dmn + gateway in kg-separation.bpmn
- [ ] cat-harness/scripts/seed-ready.ts reports pass/fail/could-not-determine per criterion; never seeds
- [ ] unit tests with fixtures
- [ ] kg-separation skill text updated; skill:register, render:bpmn, kg:audit:check, gates green
