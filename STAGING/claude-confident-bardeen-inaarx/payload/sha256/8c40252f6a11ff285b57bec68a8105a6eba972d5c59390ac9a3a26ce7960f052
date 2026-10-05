---
# folio-assistant-wmk0
title: 'PROCESS INDEX COVERAGE: bootstrap''s 5 diagrams and bootstrap-tools'' 1 are not in the workflow index — bootstrap''s graph publishes no subgraph files or documentation'
status: todo
type: task
created_at: 2026-10-03T12:50:07Z
updated_at: 2026-10-03T12:50:07Z
parent: folio-assistant-whlc
---

Found 2026-10-03 when ax6r moved the workflow index onto the published subgraph JSON-LD (owner ruling: 'Move to JSON-LD'). `check:process-index` now reports 78 of 84; the 6 not covered are listed on every run (e.g. `bootstrap/processes/log-message.bpmn`). The rule #432 / bean `pve3` keeps bootstrap's process out of the root's graph, and bootstrap's own graph (built by bootstrap-tools' `export-graph.ts` at deploy) has neither subgraph files nor `bpmn:documentation`. The plain-JSON index this replaced did list all 84.

This is an UPSTREAM change (bootstrap-tools is a submodule): it needs its own PR there.

## Done when
- [ ] bootstrap-tools' export publishes `subgraph/<instance>/…` index + hydrated files per the c1m4 contract (kg-export.md §Named subgraphs), with process documentation
- [ ] the repo-level `subgraph/index.jsonld` lists bootstrap's roots, without re-carrying bootstrap's process into the root graph (#432 / pve3 still holds)
- [ ] `check:process-index` reports 84 of 84
