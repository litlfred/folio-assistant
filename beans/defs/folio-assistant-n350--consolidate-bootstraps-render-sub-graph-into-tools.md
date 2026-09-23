---
# folio-assistant-n350
title: Consolidate bootstrap's render/ sub-graph into tools/
status: completed
type: task
priority: normal
created_at: 2026-09-23T06:25:14Z
updated_at: 2026-09-23T07:37:59Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-23: 'render/ should be consolidated to tools/'. Today bootstrap declares bootstrap-render at bootstrap/tools/ with graph kind skills, and cat-harness re-declares the same directory (by decision, so skill_fetch can reach it — see the entry's _comment). The UML overview shows it as a separate section. Merge it into the tools sub-graph; keep skill_fetch reaching the two rendering-exemption skills.

## Summary of Changes

Owner chose the three-way split (2026-09-23), after reading what the two Markdown files contain:

- **Skills**: bootstrap-graph-emission and bootstrap-graph-publication moved from bootstrap/tools/ into bootstrap/skills/ and its manifest. The bootstrap-render entry is gone from bootstrap.json and from cat-harness.json, so the root now declares NEITHER half of bootstrap, as the pve3 ruling says. Cost, stated: the root's skill_fetch no longer serves these two; bootstrap's own declaration does.
- **Tool**: cat-harness's kg-graph-export (the one publisher since dyd3) now satisfies both skills. check-tools resolves them across instances. No duplicate Tool.
- **Schema**: new BootstrapGraphDocumentSchema in bootstrap-tools/schemas/bootstrap-graph.ts. Tests parse both the published document and the generator's.
- Witness tests retargeted rather than deleted: kg-export's "manifest over basename" trio now uses kg-navigation; render-exemption checks the owed FILES sit in a declared skills directory; skill-fetch uses kg-navigation and asserts bootstrap is absent from the root table.
- Stale render/ and tools/ references fixed (emission skill, README, harness-instances page, known-skills, gen-skill-docs label).
- Finding recorded, not settled: the published graph carries a timestamp and commit SHA that the emission skill forbids — bean folio-assistant-hwzu.
