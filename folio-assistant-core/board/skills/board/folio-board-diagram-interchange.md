---
name: folio-board-diagram-interchange
description: >-
  The content-folio half of the harness's board-diagram-interchange skill:
  binds processes/ui/board-place-note.bpmn and board-relocate.bpmn, folio board
  filters over pages and block kinds, and note-to-board arrow direction.
adapters: [document, paper, dak]
profiles: [document, paper]
---

# Folio board diagram interchange

The harness skill [`board-diagram-interchange`](../../../../cat-harness/skills/ui/ui-core/board-diagram-interchange.md)
establishes the OMG Diagram Interchange split between semantic nodes (`boards`
and notes) and canvas layout (`board-positions`). In a content folio, apply
these rules alongside it.

Processes:
- [`processes/ui/board-place-note.bpmn`](../../../processes/ui/board-place-note.bpmn)
- [`processes/ui/board-relocate.bpmn`](../../../processes/ui/board-relocate.bpmn)

## 1. A folio is complete with no board

Deleting every board in a folio loses layout and **zero** content. Any fact
whose loss would drop information from the folio belongs on the content block or
note (`todo`, `carried-note`, `landing-sticky`, `note-anchor`), never in
`board-positions.json`.

## 2. Board filters over folio `pages` and `kinds`

In `schemas/ui/board.ts`, a folio board declares an optional `filter` over
folio `pages` and block `kinds` (OR within an axis, AND across axes). An absent
filter means the **entire folio** — a live query over the folio's content nodes
rather than a stored list that could drift when blocks are added or renamed.
