---
# folio-assistant-evtx
$schema: bean/1.0.0
title: 'Re-pin train 20261106-0425 has five new failures: Process_Cache skills and summary, stale checklists, cache kind unjudged'
status: todo
type: bug
priority: normal
created_at: 2026-11-06T05:06:13Z
updated_at: 2026-11-06T05:20:00Z
parent: folio-assistant-4j43
---

folio-assistant#2986 (cat-harness 7321322, cat-harness-tools 925882a, bootstrap 12fa6d5) fails 5 checks that pass on main ae0fe43 (run 42152541993): activity-skill-coverage and process-index chatter (cat-harness sdlc/processes/cache.bpmn: 8 tasks name no skill; Process_Cache summary carries a dated owner quote), bpmn:checklist:check (2 cat-harness checklists stale vs bootstrap 12fa6d5), audit:coverage:strict and :require-all (kind cache typed-only: its one gate caches:viz:check runs only in the layer's own CI, a covered-by script exemption the audit did not count). translate-kg-viewer:check fails on main too.

## Done when
- [x] cat-harness: cache.bpmn skills + summary — owned by cat-harness#1088 (CI speed 14); my #1090 closed as its later duplicate
- [x] cache kind unjudged — fixed by the caches:viz:check gate line in folio-assistant#2985 (integrator); my tools#1560 closed (counting exemptions would weaken the audit)
- [ ] both merged; a re-pin of folio-assistant at or after both goes without new failures

- Remaining for the train #2986: bpmn:checklist:check (2 cat-harness checklists stale vs bootstrap 12fa6d5). Not fixable alone: regenerated, they go stale on main (bootstrap c90ef45). Belongs with the bootstrap re-pin; that choice is the owner's pending question in Stalled pickup D (bean rpc6).
