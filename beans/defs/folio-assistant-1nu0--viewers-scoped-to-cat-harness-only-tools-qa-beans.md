---
# folio-assistant-1nu0
$schema: bean/1.0.0
title: 'Viewers scoped to cat-harness only: Tools, QA, Beans, Health, Folio, Glossary, Attestations, Schemas'
status: completed
type: feature
priority: normal
created_at: 2026-10-15T16:53:28Z
updated_at: 2026-10-15T18:59:39Z
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

## Landed 2026-10-15 (session 01QHu5Up)

- QA: cat-harness-tools#329 + cat-harness#281 — `qa` viewer per instance (state-viewer). `lsi` left cat-harness-only (it renders cat-harness's own indexes).
- Tools: cat-harness-tools#325 + cat-harness#279 — tools viewer reads every instance via `discoverTools`; 221 tools, 7 instance pages.
- Schemas (who-iris, sci): cat-harness-tools#327 + cat-harness#280 — the registry admits `folio-source-descriptor/v1` under `schemas` on purpose, so no relabel; the viewer now lists source descriptors.
- Index re-pinned: folio-assistant#2569. Fresh-checkout `docs:harness`: processes/tools/qa/schemas "no viewer yet" = 0.

Still open in this bean: Health ×3, Beans ×2, Folio ×2, Glossary ×1 (who-iris), Attestations ×1 (sci) — same pattern (viewer reads one instance's directory).

## Landed 2026-10-15 (second round)

- Health ×3, Attestations ×1: cat-harness-tools#332, cat-harness#283 (per-instance pages via `PER_INSTANCE_KINDS`).
- Beans ×2, Folio ×2, Glossary ×1: cat-harness-tools#333, cat-harness#284, folio-assistant-core#118. #333 conflicted with #332; merged keeping #332's shared renderer, beans routed to `beansSubjectPage`.
- Index re-pin folio-assistant#2572 (bda5c38). `docs:harness` in the index: 0 "no viewer yet" rows for processes, tools, qa, schemas, health, attestations, beans, folio, glossary (glossary needs the built-at-publish `glossary:page`).
- Open follow-up: per-instance glossary pages would collide with `glossary/<asset-type>/` routes; not done.
- Still to verify: the live gh-pages rail after the docs-site deploy.

## Live 2026-10-15 (gh-pages c0ea5af2f6, site from 4e05308)

Published and verified on gh-pages: tools/<instance>/, qa/<instance>/,
health/<instance>/, attestations/<instance>/, beans/<instance>/,
folio/<instance>/, processes/, and folio-assistant-core/glossary/. The live
rail on en/cat-harness/library/ has 11 "no viewer yet" rows, none of them for
the nine kinds this bean covered: bean-defs, bean-notes, block-kinds, code,
code-list, content-adapters, memory, qa-checkers, typologies, validators,
workflow-state. The rail format changed in #2573 the same hour, so the 100
measured earlier is not a strict like-for-like baseline. Those 11 are the
remaining 46ob children (svgx Code, k7ro registries, 750a work-state, 6gme).

Two publishes failed on the way, both fixed: an empty-mount state:push
(bean sp0e, cat-harness-tools#340) and Liquid in a committed tools page
(cat-harness-tools 9b38b26, pinned by folio-assistant#2575).
