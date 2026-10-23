---
# folio-assistant-8jur
$schema: bean/1.0.0
title: 'FHIR / IG kinds have no viewer: IG AST, OpenAPI, external schemas, L1 extraction, themes'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-15T16:53:28Z
updated_at: 2026-10-22T16:50:00Z
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

## 2026-10-22 — claimed by lane B2 (session https://claude.ai/code/session_01Kymnx79TxWvxVoLzcAjBRr): themes portion

Themes viewer: litlfred/cat-harness-tools#554 (`theme:viz` / `theme:viz:check`, covering the platform's themes plus each instance's declared themes) and a cat-harness PR (the theme-viewer Tool, the `themes` visualiser and the builtAtPublish entry; it needs #554 first). The l1-extraction listing is NOT part of this claim. Under the owner ruling of 2026-10-16 it is smart-base's own Tool `l1-extraction-pages` (draft cat-harness#323), which lane S holds.

_2026-10-22T16:50:00Z_ — l1-extraction portion claimed by lane S (session https://claude.ai/code/session_016heucWhrncLm4uy52csBcz). smart-base#102 (Tool `l1-extraction-pages`: generator, check, builtAtPublish, 11 tests) has been taken over and is out of draft. Its wireframe now lives at smart-base/findings/wireframes/l1-extraction (e2a8fc28), so cat-harness#323 is no longer needed for it. The themes portion stays with lane B2. Recorded by the coordinator, session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6.
