---
# folio-assistant-8jur
$schema: bean/1.0.0
title: 'FHIR / IG kinds have no viewer: IG AST, OpenAPI, external schemas, L1 extraction, themes'
status: todo
type: feature
priority: normal
created_at: 2026-10-15T16:53:28Z
updated_at: 2026-10-15T16:53:28Z
parent: folio-assistant-46ob
---

## Parent

folio-assistant-46ob

Measured live: IG AST ×1 (WHO SMART Trust), Openapi ×1 (WHO SMART Trust), External schemas ×1 (SMART Base), L1 extraction ×1 (SMART Base), Themes ×2 (SMART Base, WHO IRIS).

The fhir-harness `ig-ast-delta` skill already renders IG ASTs; cat-harness has an `external-schemas` visualiser (check why SMART Base's directory is not covered). Coordinate with the fhir-harness / smart-base owners.
## How the row is decided (read before fixing)

A navbar row says **no viewer yet** when no harness declares a visualiser over that kind (`visualisers` in a harness declaration, resolved by `cat-harness-tools/scripts/viewer-declarations.ts` → `harness-tiles.ts` `inertNote`). The other notes are not gaps: **no viewer by design** (`renderExemption.of: ["visualiser"]`), **staging only**, **viewer not published**.

Each kind therefore closes one of three ways — pick per kind, with the owner:
1. **Declare a viewer** that already exists elsewhere (cheapest; often a scope fix).
2. **Build a viewer** (a Tool + page writer + `builtAtPublish` entry).
3. **Exempt it**: `renderExemption.of: ["visualiser"]` on the instance, when the kind is internal plumbing a reader never browses — the row then reads "no viewer by design".
