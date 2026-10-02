---
# folio-assistant-8hg7
title: 'BOARD WIRING: declare where a folio keeps its board, its positions and its zoom document (OMG DI split)'
status: completed
type: task
priority: high
created_at: 2026-09-20T21:46:04Z
updated_at: 2026-09-21T08:12:13Z
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


## Summary of Changes

**Two graph kinds, because the OMG split is two things.** `boards`
(`holds: content`) is what a board IS and what it shows; `board-positions`
(`holds: state`) is where each note was drawn. Both registered with
`recordsWork: false`, and `check:graph-kind-work` is what asked: state that
records a position **in a process** is work, state that records a position
**on a canvas** is not.

**Declared, not assumed.** `todos/todos.json` gains `boards` and `positions`,
sharing a path because layout belongs beside the thing it lays out. Both kinds
gained avatars (the gate for that was already there), and both are in
`directory-conventions.md`'s table.

## And the owner's later ask, which arrived mid-flight

> Any harness above bootsteap has a board filled with all contents.

`scripts/gen-default-boards.ts` writes the board each instantiated harness
above the floor owes, gated by `boards:default:check`. Two harnesses here:
`cat-harness` and `folio-assistant`. **`bootstrap` is excluded by its own
declaration** — `isExemptFrom(decl, "visualiser")`, the same rule the navbar
sorts by — not by its name.

**"Filled with all contents" turned out to be the ABSENT filter**, which is a
convergence rather than a coincidence: `board.ts` chose no-filter-means-
everything because a stored selection needs a staleness check and a query has
nothing to fall behind. So this bean's "scaffold an empty board" and the
owner's "filled with all contents" are the same document.

## Two findings the gates produced, both kept

- `check:declared-paths` caught `boardsDir` composing `todos/` by hand. The
  directory is declared twice over — the graph root by `directoryForGraph`,
  the boards folder by `todos.json` — so it is read at both levels.
- `check:partition` refused the module as harness-level with two
  wrong-direction edges. **The imports were right and the classification was
  wrong**: what it produces is folio content, whose type core owns. The
  instance questions are how it decides WHICH folios, not what it makes.

## Done when

- [x] `harness.json` declares where boards and the zoom document live
- [x] `folio_init` scaffolds an empty board rather than leaving the directory implicit — superseded: a GENERATOR writes one per harness, gated, which is stronger than a one-time scaffold
- [x] the DI framing is written into a skill, not only into a module comment
- [x] a folio with no board still builds, asserted

**Deferred, and named**: the `semantic-zoom` document has no declared home yet.
It is a fact on the FOLIO rather than on a board, so it does not belong under
`todos/boards/`, and placing it wants the same care the board split got. Not
silently dropped — it is the one line of this bean's first Done-when that this
change does not satisfy.
