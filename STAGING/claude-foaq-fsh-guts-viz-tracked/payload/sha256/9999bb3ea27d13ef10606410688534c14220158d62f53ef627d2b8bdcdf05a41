---
# folio-assistant-n7f8
title: IG site diagrams (PlantUML sequence/deployment SVGs) get the same pan/zoom/resize viewer as BPMN diagrams
status: in-progress
type: task
priority: normal
created_at: 2026-10-06T10:28:18Z
updated_at: 2026-10-06T12:16:59Z
parent: folio-assistant-uhkv
---

Owner, 2026-10-06: "the diagrams on https://litlfred.github.io/smart-trust/sequence-diagrams.html are now resiable/scrollable like the bpmn diagrams are. tehy should be" (read as: are NOT, and should be). Screenshot: wide PlantUML SVGs on the IG narrative page overflow and are clipped at the right edge.

## Done when
- [x] Inline/IMG diagram SVGs on IG site pages get the BPMN viewer's pan, zoom and resize (reuse the existing BPMN diagram viewer, do not write a second one)
- [x] Applies to every IG site page (smart-trust, smart-base, smart-immunizations), not one page
- [x] Keyboard-operable (low-dexterity profile: no drag-only control)
- [x] e2e test over a fixture IG page with a wide SVG
- [x] Before/after screenshot of smart-trust sequence-diagrams.html


## Collision review (2026-10-06, before the first edit)

Scope: a shared asset (`docs-ui.js`, `docs-ui.css`), so steps 1 and 2 were run in full.

- **Open PRs (step 1).** Listed 9 open PRs with the GitHub tools: #2274, #2272, #2261, #2260, #2189, #2091, #2088, #2072, #1829. Every page of each PR's file list was intersected with `docs-ui.js`, `docs-ui.css`, `build-ig-site.ts`, `stage-ig-sites.ts`, `board-windows`, `bpmn-processes`, `graph-rendering`, `ig-site-links` and `cat-harness/test/*.e2e.ts`. **No overlap.** The nearest is #2189, which moves docs pages and rebases links; it does not touch the files above.
- **Beans (step 2).** Searched `in-progress` for diagram, zoom, figure, plantuml, docs-ui, build-ig-site and viewer. `ky3r` (foreign-site rail, #2265) has merged, and this work only reads its files. `0r7u` is #2272, with no shared files. `6lb8` is the folio board's glass zoom: a different mechanism (`board-windows` keeps semantic zoom apart from figure zoom), with no shared code path. **No overlap found.**
- Steps 3 and 4 did not run, because nothing overlaps.

## Diagnosis (local staged build of smart-trust, main 84df26ee)

The viewer already exists and is generic, not BPMN-specific: `mountFigure` / `mountFigures` / `inlineDiagrams` in `cat-harness/docs/assets/js/docs-ui.js`. On smart-trust `sequence-diagrams.html` the two PlantUML diagrams included inline (`{% include x.svg %}`) **do** get it. The three diagrams embedded as `<object data="x.svg" type="image/svg+xml">` (aggregation, verification, business_rule_validation) **do not**: `inlineDiagrams` and `mountFigures` look only for `img[src$=.svg]` and `svg`. The widest of the three (1318px) runs past `.main-content`'s right edge, 1406 > 1368 at a 1400px viewport, and is clipped.

## Summary of Changes

**Root cause.** The viewer already existed and is generic, not BPMN-specific: `mountFigure` / `mountFigures` / `inlineDiagrams` in `cat-harness/docs/assets/js/docs-ui.js`. It recognised `<img src=*.svg>` and inline `<svg>`. It did not recognise `<object data=*.svg>`, which is the IG Publisher's embed for a pre-rendered diagram. smart-trust's `sequence-diagrams.html` uses three of these, and the widest (1318px) was clipped at the column's right edge.

**What changed.** The same viewer is reused; this is not a second one.
- `docs-ui.js`
  - `inlineDiagrams` now inlines `<object data=*.svg>` too. The object's fallback text becomes the accessible name.
  - `mountFigures` takes `<object>` as a figure if the inline fetch fails. It takes raster `<img>` only on a page that opts in with `data-fa-figure-images`, and only when the column has shrunk the image.
  - `mountFigure` is keyboard-operable: the figure is focusable, the arrow keys pan (only when the figure can scroll that way), `+` and `-` zoom, and `0` resets.
  - A plain figure's 100% is now its own width, capped at the column.
- `docs-ui.css`
  - `object` is added to the zoom rules, and the natural-width cap is applied.
  - A focus ring is shown on the figure.
  - A full-width figure is now `border-box`. It used to run 18px past the viewport and be clipped. The new e2e spec found this.
- `fhir-harness/scripts/build-ig-site.ts`: `IG_FIGURE_IMAGES_STAMP` is stamped by both the standalone layout and the composed pages' top include, so every IG page (smart-trust, smart-base, smart-immunizations) opts in.
- Tests:
  - New e2e spec `cat-harness/test/ig-diagram-viewer.e2e.ts`, 6 tests.
  - The `build-ig-site` unit tests assert the stamp, and that `docs-ui.js` reads the stamp's attribute.
- Skills: `graph-rendering` rule 9 (one viewer, the embed table, the opt-in, the keyboard) and `ig-site-links` (a pointer to rule 9).

**Evidence.** Local staged build of smart-trust, following the `ig-repo-site/folio-site.yml` steps with PlantUML. Before: 2 of 5 diagrams had the viewer, and one was clipped (right edge 1406 > column 1368). After: 5 of 5 have it, none overflows, and `+ + +` then `→ → →` zooms to 200% and pans the diagram (scrollLeft 384 of 2540).

