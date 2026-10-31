---
# folio-assistant-46ob
$schema: bean/1.0.0
title: "Missing viewers: 100 navbar rows read 'no viewer yet' across 47 kinds on the live site"
status: completed
type: epic
priority: normal
created_at: 2026-10-15T16:53:28Z
updated_at: 2026-10-29T15:50:18Z
parent: folio-assistant-rwmf
---

## The ask, owner 2026-10-15 (verbatim)

> bean up for missing viewers

Context: the owner's screenshot of `/en/cat-harness/library/` showed "no viewer yet" on Processes and other declared sub-graphs.

## Measured

From the deployed `gh-pages` (folio-assistant `ac9cba167`, 2026-10-15T16:46Z), page `en/cat-harness/library/index.html`, parsing the rendered rail: **210 rows, 100 of them "no viewer yet", over 47 kinds**. The children of this bean group them by the fix each needs.

**Already fixed, not yet deployed:** Processes (6 rows) — the page is built at publish and was never seen on a fresh checkout; cat-harness-tools#313 (merged) derives the writer from the harness's `builtAtPublish`. Clears at the next index re-pin + publish; tracked as the verify child.

## How the row is decided (read before fixing)

A navbar row says **no viewer yet** when no harness declares a visualiser over that kind (`visualisers` in a harness declaration, resolved by `cat-harness-tools/scripts/viewer-declarations.ts` → `harness-tiles.ts` `inertNote`). The other notes are not gaps: **no viewer by design** (`renderExemption.of: ["visualiser"]`), **staging only**, **viewer not published**.

Each kind therefore closes one of three ways — pick per kind, with the owner:
1. **Declare a viewer** that already exists elsewhere (cheapest; often a scope fix).
2. **Build a viewer** (a Tool + page writer + `builtAtPublish` entry).
3. **Exempt it**: `renderExemption.of: ["visualiser"]` on the instance, when the kind is internal plumbing a reader never browses — the row then reads "no viewer by design".

## Done when

Every child is closed: each kind either links to a viewer, or reads "no viewer by design" by a recorded owner decision. Re-measure the live rail and record the count here.

_2026-10-16T10:30:00Z_ — Parented to GOAL 4 (`rwmf`): it had no parent, so its open beans sat under no goal (owner choice, https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP).

_2026-10-20T09:50:00Z_: Re-measured on gh-pages 3944997 (deployed 2026-10-20 09:14Z), from the eight `assets/navbar/rail-*.js`: **29** distinct rows read "no viewer yet", 0 read "by design". C@T Harness: Basic CDN site, Board positions, Boards, Interaction, Memory, Merge queue, Policies, Scenarios, Session surveys, Substrate snapshots, Test plan, Todo feedback, Todo items, Tool releases, UML, Vocab mapping, Voice vendors, Waivers. Folio Assistant Core: Memory. C@T Harness Tools: Sweep marks. SMART Base: External schemas, L1 extraction, Scenarios, Themes. WHO IRIS: Themes. WHO SMART Trust: Docs, IG AST, IG pages, Openapi. Owner, 2026-10-20 09:43Z: every kind gets a viewer (no "by design" exemptions); memory needs a viewer. (https://claude.ai/code/session_01LM4btvYuBEuq57QqgwCrtu)

_2026-10-22T14:30:00Z_: Re-measured on `gh-pages` `ec00fd2438` across all 8 `assets/navbar/rail-*.js`: down from 100 (2026-10-15) → 29 (2026-10-20) → **8** distinct rows reading `"no viewer yet"`:
- **Folio Assistant Core:** **0** of 23
- **C@T Harness Tools:** **0** of 4
- **C@T Harness:** **1** of 39 (`Merge reviews`, added 2026-10-20 under `w8jq`; all 18 rows from the 2026-10-20 C@T Harness list now link to viewers)
- **WHO IRIS:** **1** of 15 (`Themes`)
- **SMART Base:** **3** of 22 (`External schemas`, `L1 extraction`, `Themes` — `Scenarios` now links)
- **WHO SMART Trust:** **4** of 5 (`Docs`, `IG AST`, `IG pages`, `Openapi`)
And on the landing page (`index.html`), `folio-assistant-sci` (`lean`) and `bootstrap-tools` (`skills`) remain in `6gme`.

---

*2026-10-29T12:20Z* — Live re-measure (publish of 10:36Z): only the outside-libraries rows (software-library kind) still said "no viewer yet", on cat-harness, cat-harness-tools, fhir-harness and folio-assistant-sci. The owner chose "no viewer by design" on the Lane D card. PRs declare `coverage.exempt.visualiser` on each layer's libraries directory: cat-harness#692, cat-harness-tools#841, fhir-harness#185, folio-assistant-sci#107 (issue cat-harness#691). Once merged and re-pinned, no row says "no viewer yet". Session https://claude.ai/code/session_01Qmmkt62KVMxDU9gjVV1mm2.

_2026-10-29T15:50:18Z_ — 2026-10-29T15:50Z — Live on gh-pages 643d3f6: no row says "no viewer yet"; the outside-libraries rows say "no viewer by design" (owner card, cat-harness#691; fa#2710). Session https://claude.ai/code/session_01Qmmkt62KVMxDU9gjVV1mm2.
