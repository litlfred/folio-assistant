---
# folio-assistant-1nu0
$schema: bean/1.0.0
title: 'Viewers scoped to cat-harness only: Tools, QA, Beans, Health, Folio, Glossary, Attestations, Schemas'
status: todo
type: feature
priority: normal
created_at: 2026-10-15T16:53:28Z
updated_at: 2026-10-15T16:53:28Z
parent: folio-assistant-46ob
---

## Parent

folio-assistant-46ob

A viewer exists, but it is declared with `covers: [<directory id>]` (cat-harness's own directory) or per-instance sub-graphs that were never drawn, so other harnesses' rows read "no viewer yet".

Measured live: Tools ×6 (cat-harness `tools` visualiser, covers id `tools`; page lists cat-harness's tools only), QA ×5 (`lsi`, covers id `qa`), Health ×3, Beans ×2, Folio ×2, Schemas ×2 (WHO IRIS, sci — `schemas` covers by kind with `subgraphs: instance`, so their pages were not drawn), Glossary ×1 (WHO IRIS), Attestations ×1 (sci).

The fix is mostly declaration: cover by kind (`coversKinds`) and draw per-instance sub-graphs, then check each viewer actually reads the other instances' directories.
## How the row is decided (read before fixing)

A navbar row says **no viewer yet** when no harness declares a visualiser over that kind (`visualisers` in a harness declaration, resolved by `cat-harness-tools/scripts/viewer-declarations.ts` → `harness-tiles.ts` `inertNote`). The other notes are not gaps: **no viewer by design** (`renderExemption.of: ["visualiser"]`), **staging only**, **viewer not published**.

Each kind therefore closes one of three ways — pick per kind, with the owner:
1. **Declare a viewer** that already exists elsewhere (cheapest; often a scope fix).
2. **Build a viewer** (a Tool + page writer + `builtAtPublish` entry).
3. **Exempt it**: `renderExemption.of: ["visualiser"]` on the instance, when the kind is internal plumbing a reader never browses — the row then reads "no viewer by design".
