---
# folio-assistant-n7f8
title: IG site diagrams (PlantUML sequence/deployment SVGs) get the same pan/zoom/resize viewer as BPMN diagrams
status: todo
type: task
created_at: 2026-10-06T10:28:18Z
updated_at: 2026-10-06T10:28:18Z
---

Owner, 2026-10-06: "the diagrams on https://litlfred.github.io/smart-trust/sequence-diagrams.html are now resiable/scrollable like the bpmn diagrams are. tehy should be" (read as: are NOT, and should be). Screenshot: wide PlantUML SVGs on the IG narrative page overflow and are clipped at the right edge.

## Done when
- [ ] Inline/IMG diagram SVGs on IG site pages get the BPMN viewer's pan, zoom and resize (reuse the existing BPMN diagram viewer, do not write a second one)
- [ ] Applies to every IG site page (smart-trust, smart-base, smart-immunizations), not one page
- [ ] Keyboard-operable (low-dexterity profile: no drag-only control)
- [ ] e2e test over a fixture IG page with a wide SVG
- [ ] Before/after screenshot of smart-trust sequence-diagrams.html
