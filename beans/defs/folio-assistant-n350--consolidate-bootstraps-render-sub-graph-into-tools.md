---
# folio-assistant-n350
title: Consolidate bootstrap's render/ sub-graph into tools/
status: todo
type: task
created_at: 2026-09-23T06:25:14Z
updated_at: 2026-09-23T06:25:14Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-23: 'render/ should be consolidated to tools/'. Today bootstrap declares bootstrap-render at bootstrap/tools/ with graph kind skills, and cat-harness re-declares the same directory (by decision, so skill_fetch can reach it — see the entry's _comment). The UML overview shows it as a separate section. Merge it into the tools sub-graph; keep skill_fetch reaching the two rendering-exemption skills.
