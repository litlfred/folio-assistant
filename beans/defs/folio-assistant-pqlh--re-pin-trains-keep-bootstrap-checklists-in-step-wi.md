---
# folio-assistant-pqlh
$schema: bean/1.0.0
title: 'Re-pin trains: keep bootstrap checklists in step with the train''s bootstrap pin'
status: todo
type: task
priority: normal
created_at: 2026-11-06T05:55:06Z
updated_at: 2026-11-06T05:55:06Z
parent: folio-assistant-k3vv
---

Structural fix for cause 1 of the 2026-11-06 train failures: cat-harness commits bootstrap's checklists built from its own bootstrap pin, so any train that moves folio-assistant's bootstrap past cat-harness's lock fails bpmn:checklist:check. Options: (a) the train never moves bootstrap/-tools past cat-harness's lock (re-pin cat-harness first, as a cascade), or (b) build below-harness checklists at publish time from the mounted bootstrap instead of committing them. Owner's call.

## Done when
- [x] Owner picks (a) or (b): owner litlfred, 2026-11-06, card in session_01VQDpPfgkavzcfGinEE2Yzi: "1. Cascade (Recommended)" = (a). The train re-pins cat-harness first and never moves bootstrap/-tools past cat-harness's lock. Relayed to session_01VQDpPffYARDQ8juksAZScf (CI pipeline performance analysis), which created repin-train.yml.
- [ ] Implemented; a train moving bootstrap alone no longer fails bpmn:checklist:check
