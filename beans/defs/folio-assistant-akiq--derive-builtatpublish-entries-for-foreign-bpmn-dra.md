---
# folio-assistant-akiq
$schema: bean/1.0.0
title: Each layer draws its own BPMN diagrams; cat-harness stops drawing and hand-listing other layers' (plan, awaiting owner approval)
status: completed
type: task
priority: high
tags:
    - ci-speed-ii
created_at: 2026-11-05T11:35:43Z
updated_at: 2026-11-06T04:50:12Z
parent: folio-assistant-k3vv
---

Follows bean folio-assistant-3v2t (a layer commits only what it derives from itself) and bean folio-assistant-tsh9 (red-main cycle). Owner, 2026-11-05: "i want this cleanup properly. may need to move diagrams to correct layers"; "why would source drawings be in another layer? (only exception is if drawing in bootstrap)". Owner chose "Plan first", then said "then implement" and chose option 1 ("Both"): each layer commits its own drawing; the host composes its linked copies at publish.

## Evidence (measured 2026-11-05, cat-harness 20af115)
- Every SVG is rendered from its `.bpmn` by bpmn-js (bootstrap-tools `scripts/render-bpmn.ts`); none is hand-drawn.
- The **sources are already in the right layers.** Each of the 53 foreign diagrams has exactly one `.bpmn`, in its own layer: core 26, smart-base 8, fhir-harness 6, bootstrap 5, who-iris 4, sci 3, bootstrap-tools 1.
- The **drawings are misplaced.** Since bean `oqdr` (2026-09-26), cat-harness-tools `scripts/render-bpmn.ts` walks every instance and draws them all into `cat-harness/docs/assets/img/workflows/`. So cat-harness, a lower layer, hand-lists 53 `builtAtPublish` lines for higher layers' files. A new upstream diagram turns folio-assistant main red until cat-harness adds a line (render:bpmn:check, run 42012108138; stopgap cat-harness#1041).
- smart-base (8), bootstrap (5), bootstrap-tools (1) and part of who-iris already keep SVGs beside their `.bpmn`. folio-assistant-core (29) and folio-assistant-sci (3) keep none.
- Correction: `folio-review-publish` and `guideline-updates` are NOT dead. They are core's diagrams, committed by mistake inside cat-harness's workflows folder. Their `.pot` files stay.
- The same hand-list drift pattern exists for state:visualizer (53 entries) and glossary:page (36). That is out of scope here, but the same principle applies.

## Target
Each layer draws its own diagrams. cat-harness draws only its own 82. No layer lists another layer's files.
- **Bootstrap exception (owner):** bootstrap runs nothing, so bootstrap-tools' renderer draws its diagrams and they are committed beside the source, as today.

## Plan (PR order, so main never goes red)
1. **Layers draw their own.** folio-assistant-core and folio-assistant-sci render their diagrams beside each `.bpmn` (or into their own site) and commit them. Each layer's own CI runs the render check, so a new diagram is checked in the layer that added it. Check fhir-harness and who-iris cover all of theirs (fhir-harness has none beside source today).
2. **cat-harness-tools stops drawing other layers.** `render-bpmn.ts` renders only the instance it runs for (undo the oqdr walk for drawing; keep the walk for the clash/consistency checks). Process pages (`gen-processes-viz.ts`, `gen-docs-pages.ts`, `kg-export.ts`, `site-dead-links.ts`, `governing-process.ts`) link to the owning layer's drawing at its pin, reusing the cross-layer figure URLs (`scripts/tests/cross-instance-figure-urls.test.ts`).
3. **cat-harness deletes** the 53 `docs/assets/img/workflows/*.svg` builtAtPublish lines and the 2 dead SVGs. Its README's two foreign images (`l2-dak-authoring`, `l3-fhir-pipeline`, already broken on GitHub) link into their own layers.
4. **core deletes** the stale `.pot` files for the 2 dead diagrams.
5. **folio-assistant re-pins** each layer in that order (train or small PRs) and confirms `render:bpmn:check` stays green.

## Open questions for the owner
- Where should a layer's drawing live: beside the `.bpmn` (as smart-base and bootstrap do) or in the layer's `docs/assets/`? Recommended: beside the source, which is one convention everywhere and works on GitHub.
- Should a layer with no site of its own still commit drawings? Recommended: yes, beside the source.

## Done when
- No `builtAtPublish` line in any layer names another layer's drawing.
- A new `.bpmn` in any layer, re-pinned into folio-assistant, needs no edit in any other layer, and every check stays green.
- A test covers it: a fixture layer adds a diagram, its own check requires the drawing, and cat-harness's check is unaffected.

## Progress (2026-11-05)
- Design as built: no new schema field. `docs/assets/img/workflows/` becomes ONE `builtAtPublish` directory entry (the host's linked copies), and every layer commits its plain drawing beside each `.bpmn`.
- [x] folio-assistant-core#644: 28 drawings
- [x] folio-assistant-sci#179: 3 drawings
- [x] cat-harness#1047: one folder entry replaces 53 lines; 84 committed host SVGs untracked; 45 own drawings beside their sources. Safe before or after the tools change (both verified).
- [x] cat-harness-tools#1504: `render-bpmn.ts` draws beside the source for every instance; a test pins it. Lands LAST.
- [x] fhir-harness#288 (6) and who-iris#180 (4)
- [ ] folio-assistant re-pin: core, sci and cat-harness first; tools last (it requires every layer's drawings).
- Later: smart-base's own `render-processes.ts` becomes redundant (same bytes).

## Done (2026-11-06)
All landed:
- drawings: core#644, sci#179, fhir-harness#288, who-iris#180, cat-harness#1047 and #1067; redraws cat-harness#1074 and core#650
- tools: #1504 (render:bpmn draws beside source), #1538 (regen-writers fixture), #1548 (drawing presence beside source)
- the six-layer re-pin: folio-assistant#2981

Remaining: the folio-assistant re-pin of cat-harness-tools past #1504 (steward's train). Follow-ups not done here: smart-base's own render-processes.ts is now redundant (same bytes); the per-file builtAtPublish lists for state:visualizer (53) and glossary:page (36) drift in the same way.
