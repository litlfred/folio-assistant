---
# folio-assistant-vugr
$schema: bean/1.0.0
title: 'Memory: fa feature-staging Jekyll >45 min since 11-11 — who-iris#226 per-document references (~7.5k) rendered in main + every IG bibliography'
status: completed
type: task
priority: low
created_at: 2026-11-11T23:55:17Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `stage-timeout-who-iris-references.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: fa feature-staging Jekyll >45 min since 11-11 — who-iris#226 per-document references (~7.5k) rendered in main + every IG bibliography

2026-11-11 23:55Z (thread …PbWitDFoMA8PsoXrCfeqpx, fa#3075 gate thread): fa `stage` job ("Build Jekyll site") times out at 45 min on re-pin trains #3082/#3083. Last green: run 42917867602 (11-10 23:10, Jekyll 4 min).

Cause: who-iris#226 (owner: "all who-iris docs that have references put into their own biblio") added who-iris/references/ (~7.2k folio-reference nodes). `bibliography:page` renders them on the main site AND in each IG site of the staging cone: bibliography files ~3.6k → ~41.5k, jekyll-source 114 MB → 279 MB.

Card answered 11-12 06:07Z: A (IGs list own refs only). Fix: core#760 (issue #759, branch claude/ig-bib-own-refs-only): forInstance drops a lower layer's provenance:extracted refs; each IG ~8.2k -> ~1k files; platform unchanged 8,621.

Same thread also holds: cat-harness-tools branch claude/todo-e2e-singular-path (local, not pushed; todo e2e on todo/<id> after dbc369d4 + who-iris-search "Show more"), awaiting user card. Re-pins with workflow-ref edits must go through the bot's repin-train (threads can't push .github/workflows).
