---
# folio-assistant-k7ro
$schema: bean/1.0.0
title: 'Harness registry kinds have no viewer: typologies, validators, QA checkers, block kinds, content adapters, pipeline plugins, editor checkers, code lists'
status: todo
type: feature
priority: normal
created_at: 2026-10-15T16:53:28Z
updated_at: 2026-10-15T16:53:28Z
parent: folio-assistant-46ob
---

## Parent

folio-assistant-46ob

Rows (measured live): Graph typologies ×5, Validators ×5, QA checkers ×3, Block kinds ×3, Content adapters ×3, Code lists ×3, Pipeline plugins ×2, Editor checkers ×1. These are the harness's own registries — each node already has a schema and is in the KG export.

Likely one generic registry viewer (a table per kind: id, summary, declaring instance, schema) rather than eight bespoke ones; `node-kind:pages` already writes per-node pages for the declaration and may extend.
## How the row is decided (read before fixing)

A navbar row says **no viewer yet** when no harness declares a visualiser over that kind (`visualisers` in a harness declaration, resolved by `cat-harness-tools/scripts/viewer-declarations.ts` → `harness-tiles.ts` `inertNote`). The other notes are not gaps: **no viewer by design** (`renderExemption.of: ["visualiser"]`), **staging only**, **viewer not published**.

Each kind therefore closes one of three ways — pick per kind, with the owner:
1. **Declare a viewer** that already exists elsewhere (cheapest; often a scope fix).
2. **Build a viewer** (a Tool + page writer + `builtAtPublish` entry).
3. **Exempt it**: `renderExemption.of: ["visualiser"]` on the instance, when the kind is internal plumbing a reader never browses — the row then reads "no viewer by design".
