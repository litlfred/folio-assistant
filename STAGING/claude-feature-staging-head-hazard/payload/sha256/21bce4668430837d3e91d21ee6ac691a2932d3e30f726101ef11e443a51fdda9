---
# folio-assistant-svgx
$schema: bean/1.0.0
title: "Code viewer: 'Code' reads no viewer yet on 8 harnesses"
status: completed
type: feature
priority: normal
created_at: 2026-10-15T16:53:28Z
updated_at: 2026-10-15T19:33:06Z
parent: folio-assistant-46ob
---

## Parent

folio-assistant-46ob

Rows: Bootstrap tools, C@T Harness, C@T Harness Tools, FHIR IG Harness, Folio Assistant Core, SMART Base, WHO IRIS, folio-assistant-sci — the `code` kind. No harness declares a visualiser for it.

Options: a source browser over each instance's declared code directories (file tree + rendered source, linking to GitHub at the pinned sha), or link straight to the repository on GitHub, or exempt it by design.
## How the row is decided (read before fixing)

A navbar row says **no viewer yet** when no harness declares a visualiser over that kind (`visualisers` in a harness declaration, resolved by `cat-harness-tools/scripts/viewer-declarations.ts` → `harness-tiles.ts` `inertNote`). The other notes are not gaps: **no viewer by design** (`renderExemption.of: ["visualiser"]`), **staging only**, **viewer not published**.

Each kind therefore closes one of three ways — pick per kind, with the owner:
1. **Declare a viewer** that already exists elsewhere (cheapest; often a scope fix).
2. **Build a viewer** (a Tool + page writer + `builtAtPublish` entry).
3. **Exempt it**: `renderExemption.of: ["visualiser"]` on the instance, when the kind is internal plumbing a reader never browses — the row then reads "no viewer by design".

## Landed 2026-10-15

cat-harness-tools#347 + cat-harness#293; index re-pinned folio-assistant#2579. Per-instance code pages at /en/cat-harness/code/<instance>/, files linked to GitHub at the pinned commit. docs:harness in the index: code 11 -> 0. Live check pending the docs-site deploy.
