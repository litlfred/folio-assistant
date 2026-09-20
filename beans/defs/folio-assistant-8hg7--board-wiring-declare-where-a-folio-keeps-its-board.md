---
# folio-assistant-8hg7
title: 'BOARD WIRING: declare where a folio keeps its board, its positions and its zoom document (OMG DI split)'
status: todo
type: task
priority: high
created_at: 2026-09-20T21:46:04Z
updated_at: 2026-09-20T21:46:04Z
parent: folio-assistant-6lb8
---

Issue: https://github.com/litlfred/folio-assistant/issues/602 — CRDM Phase 5, unit 1 of 10.

The schemas landed in `A_Declare` (`schemas/board.ts`, `schemas/semantic-zoom.ts`,
the reshaped `schemas/board-positions.ts`). Nothing declares WHERE a folio keeps
them, so today they are types nothing reads.

## The framing, which is the owner's and is load-bearing

> treat it like OMG specs and BPMN layout. **relationship first, visualiztion alter.**

BPMN separates the semantic model (`bpmn:process`) from **Diagram Interchange**
(`BPMNDiagram`/`BPMNShape`/`BPMNEdge`). The two are different documents about one
subject, and the layout one points AT the semantic one, never the other way.

    semantic model        notes, anchors, content nodes     what is true
    diagram interchange   board-positions.json              where it was drawn

So `board-positions` IS DI, and the reason it may not put `x`/`y` on a note is the
same reason BPMN does not put coordinates on a task. **A board is a DIAGRAM of a
folio, not a container of one**: a folio is complete with no board, and deleting
every board loses layout and no content.

## Done when

- [ ] `harness.json` declares where boards and the zoom document live (`todos/boards/`, `holds: content` for the board, `state` for positions)
- [ ] `folio_init` scaffolds an empty board rather than leaving the directory implicit
- [ ] the DI framing is written into a skill, not only into a module comment
- [ ] a folio with no board still builds, asserted
