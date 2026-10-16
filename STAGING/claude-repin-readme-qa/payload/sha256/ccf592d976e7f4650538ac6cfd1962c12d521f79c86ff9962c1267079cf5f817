---
# folio-assistant-6gme
$schema: bean/1.0.0
title: 'Remaining single-instance kinds have no viewer: scenarios, policies, UML, test plan, tool releases, vocab mapping, voice vendors, waivers, substrate snapshots, basic CDN site, Lean packages, bootstrap-tools skills'
status: todo
type: feature
priority: normal
created_at: 2026-10-15T16:53:28Z
updated_at: 2026-10-15T16:53:28Z
parent: folio-assistant-46ob
---

## Parent

folio-assistant-46ob

Measured live: Scenarios ×3, and one row each for Policies, UML, Test plan, Tool releases, Vocab mapping, Voice vendors, Waivers, Substrate snapshots, Basic CDN site (C@T Harness), Lean packages (folio-assistant-sci; a doc-gen4 viewer exists as the `lean-html-docs` skill), Skills (Bootstrap tools only — other harnesses' skills link).

Triage each: link an existing page (UML has rendered diagrams; Lean has doc-gen4), build, or exempt.
## How the row is decided (read before fixing)

A navbar row says **no viewer yet** when no harness declares a visualiser over that kind (`visualisers` in a harness declaration, resolved by `cat-harness-tools/scripts/viewer-declarations.ts` → `harness-tiles.ts` `inertNote`). The other notes are not gaps: **no viewer by design** (`renderExemption.of: ["visualiser"]`), **staging only**, **viewer not published**.

Each kind therefore closes one of three ways — pick per kind, with the owner:
1. **Declare a viewer** that already exists elsewhere (cheapest; often a scope fix).
2. **Build a viewer** (a Tool + page writer + `builtAtPublish` entry).
3. **Exempt it**: `renderExemption.of: ["visualiser"]` on the instance, when the kind is internal plumbing a reader never browses — the row then reads "no viewer by design".
