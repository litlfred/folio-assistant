---
# folio-assistant-lvlv
title: 'MERGE GATE (d): per-content-block adversarial QA for tools, schemas, skills and processes, and the backfill'
status: todo
type: feature
priority: normal
created_at: 2026-10-02T16:29:16Z
updated_at: 2026-10-02T22:27:13Z
parent: folio-assistant-9v5a
---

Child (d) of the merge-gate epic. Design: `cat-harness/docs/proposals/merge-gate-2026-10-02.md` §7.

Run the same adversarial review per **content block** (not per diff) so the existing corpus can be backfilled: Tool nodes, schema modules, skills/guidance, and BPMN/DMN processes. It uses the same verdict shape as the merge gate, keyed to the subject's `source_hash`, so a merge review and a backfill review are one kind of record.

## Done when
- [ ] a per-kind adversarial checklist exists for tool, schema, skill and process, extending `code-node-review` and `devils-advocate-watcher` rather than forking them
- [ ] `audit:coverage` reports adversarial review as a column per kind (reviewed / stale / never)
- [ ] the backfill order is risk-ranked (fan-in, gate-adjacency, last-changed), not file order
- [ ] one batch has been run and its sidecars are committed, with the cost per node measured
- [ ] the backfill does not create a bean per finding (beans are not sidecars)
