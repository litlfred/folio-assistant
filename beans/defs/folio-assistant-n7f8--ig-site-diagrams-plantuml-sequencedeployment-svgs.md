---
# folio-assistant-n7f8
title: IG site diagrams (PlantUML sequence/deployment SVGs) get the same pan/zoom/resize viewer as BPMN diagrams
status: in-progress
type: task
priority: normal
created_at: 2026-10-06T10:28:18Z
updated_at: 2026-10-06T11:55:13Z
---

Owner, 2026-10-06: "the diagrams on https://litlfred.github.io/smart-trust/sequence-diagrams.html are now resiable/scrollable like the bpmn diagrams are. tehy should be" (read as: are NOT, and should be). Screenshot: wide PlantUML SVGs on the IG narrative page overflow and are clipped at the right edge.

## Done when
- [ ] Inline/IMG diagram SVGs on IG site pages get the BPMN viewer's pan, zoom and resize (reuse the existing BPMN diagram viewer, do not write a second one)
- [ ] Applies to every IG site page (smart-trust, smart-base, smart-immunizations), not one page
- [ ] Keyboard-operable (low-dexterity profile: no drag-only control)
- [ ] e2e test over a fixture IG page with a wide SVG
- [ ] Before/after screenshot of smart-trust sequence-diagrams.html


## Collision review (2026-10-06, before the first edit)

Scope: a shared asset (`docs-ui.js`, `docs-ui.css`), so steps 1 and 2 were run in full.

- **Open PRs (step 1).** Listed 9 open PRs with the GitHub tools: #2274, #2272, #2261, #2260, #2189, #2091, #2088, #2072, #1829. Every page of each PR's file list was intersected with `docs-ui.js`, `docs-ui.css`, `build-ig-site.ts`, `stage-ig-sites.ts`, `board-windows`, `bpmn-processes`, `graph-rendering`, `ig-site-links` and `cat-harness/test/*.e2e.ts`. **No overlap.** The nearest is #2189, which moves docs pages and rebases links; it does not touch the files above.
- **Beans (step 2).** Searched `in-progress` for diagram, zoom, figure, plantuml, docs-ui, build-ig-site and viewer. `ky3r` (foreign-site rail, #2265) has merged, and this work only reads its files. `0r7u` is #2272, with no shared files. `6lb8` is the folio board's glass zoom: a different mechanism (`board-windows` keeps semantic zoom apart from figure zoom), with no shared code path. **No overlap found.**
- Steps 3 and 4 did not run, because nothing overlaps.

## Diagnosis (local staged build of smart-trust, main 84df26ee)

The viewer already exists and is generic, not BPMN-specific: `mountFigure` / `mountFigures` / `inlineDiagrams` in `cat-harness/docs/assets/js/docs-ui.js`. On smart-trust `sequence-diagrams.html` the two PlantUML diagrams included inline (`{% include x.svg %}`) **do** get it. The three diagrams embedded as `<object data="x.svg" type="image/svg+xml">` (aggregation, verification, business_rule_validation) **do not**: `inlineDiagrams` and `mountFigures` look only for `img[src$=.svg]` and `svg`. The widest of the three (1318px) runs past `.main-content`'s right edge, 1406 > 1368 at a 1400px viewport, and is clipped.
