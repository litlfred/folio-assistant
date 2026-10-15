---
# folio-assistant-1nu0
$schema: bean/1.0.0
title: 'Viewers scoped to cat-harness only: Tools, QA, Beans, Health, Folio, Glossary, Attestations, Schemas'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-15T16:53:28Z
updated_at: 2026-10-15T17:30:00Z
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

## Measured 2026-10-15 (session 01QHu5Up): NOT mostly declaration — each viewer reads cat-harness only

The bean's first framing ("mostly a declaration change") was wrong. Read per viewer:

| viewer | what its page reads | other harnesses hold |
|---|---|---|
| `tools` (`gen-tools-viz.ts`) | imports `@litlfred/cat-harness/tools/index.js` only | own `tools/` in core, fhir, sci, smart-base, who-iris, tools |
| `lsi` / `qa` (state-viewer) | cat-harness `test/results/` | each instance's own `test/results/` (6) |
| `health` (state-viewer) | cat-harness `test/health/results/` | tools `health/`, core, who-iris |
| `beans` (state-viewer) | the repository-scoped `beans/` | core and tools also declare `beans/` — check whether that is the same store before widening |
| `folio` | cat-harness `folio/` | core `folios/`, who-iris `folio/` |
| `attestations` | cat-harness `test/attestations/` | sci |
| `glossary` (core's viewer, by id) | core `glossary/` | who-iris `glossary/` |
| `schemas` (per-instance pages) | drawn for 5 instances | who-iris and sci declare `sources/` as kind `schemas`, but it holds `folio-source-descriptor/v1` DATA, not JSON Schemas — likely a mislabel, not a missing page |

So widening `covers` to the kind would link those rows to pages that do not show their content. Each viewer needs its generator to read every instance's directory of the kind (per-instance sub-graph pages, the way `schemas` already does), or the row is exempted.

## Owner ruling 2026-10-15

"1 Per-instance pages (Rec.), 2 Fix schemas mislabel": each viewer draws one page per instance (QA and Tools first); who-iris and sci `sources/` relabelled off `schemas`. Claimed by session 01QHu5Up.
