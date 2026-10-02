---
# folio-assistant-7m6g
title: 'VISUALISER FILTER: by document, library, graph — and one per thing in the folio working space'
status: completed
type: feature
priority: normal
created_at: 2026-09-21T21:02:31Z
updated_at: 2026-09-23T12:26:57Z
parent: folio-assistant-6lb8
---

Owner, 2026-09-21: "visualizer filter by document, library, graph, and one each thing in folio (working space. see beans/siblings)"

## What is asked

The visualiser gains a filter with at least these axes:

- **document** — the authored content object
- **library** — the STATIC graph (issue #764 section 3 F2: a folio's subjects are
  the library and the working documents/assets/artefacts)
- **graph** — the KG itself
- **one each thing in the folio** — the working space, i.e. a filter entry per
  thing currently in it

## READ BEFORE DESIGNING — the owner says "see beans/siblings"

- `le8b` BOARD FILTER MOVEMENT: a reader's filter that commits — the filter
  already has a bean and a stated discipline. Start there, not from scratch.
- `6lb8` FOLIO BOARD (parent): the board's own model.
- Issue #764 section 3: the folio's two graphs, and the rule that WHICH of the
  two a node came from must be VISIBLE — the same "local vs remote must SHOW"
  rule 603s carries.
- `docs-ui.js` `.fa-board-filter`: two selects already exist, built from
  `propertyValues` so the options come from the CORPUS and cannot offer a
  filter matching nothing. That property is the thing to preserve.

## The question to settle first

"document, library, graph" are not one axis. Document is a content OBJECT,
library is a GRAPH the object may come from, and graph is the KG. Whether
these are three selects, one faceted control, or a kind axis plus a source
axis is a design decision — and #764's whole finding was that three axes were
being conflated into one. Do not repeat it one level down.

## Blocked on

O2 on issue #764 — where the visualiser axis is declared — because a filter
over visualisers needs to know what a visualiser is declared against.

## Unblocked, and the shape decided — 2026-09-23

- **O2 is settled and built.** The owner ruled on 2026-09-22 that the visualiser axis is declared PER GRAPH; it lives as `visualisedAs` on each directory in `schemas/cat-harness.ts`. "Blocked on O2" is no longer true.
- **The folio working space is now the GLASS.** It holds library books (from `zrvt`), todos, and pinned stickies (from `pv6g`). So the filter belongs to the glass.
- **Owner's choice, 2026-09-23:** from three shapes (two axes plus an item list / three literal selects / one grouped checklist), they chose **"Kind + From + items"**:

> A Filter tile: a Kind dropdown (book/todo/sticky), a From dropdown (which library or document), and a checkbox per item. Keeps 'what it is' and 'where it came from' separate.

That is this bean's own "kind axis plus a source axis", and it avoids repeating #764's conflation one level down.

## Done when

- [x] a Filter tile on the glass's strip opens a panel with Kind, From and one checkbox per item
- [x] options come from what is ON the glass, so no option can match nothing
- [x] OR within an axis and AND across axes, the same logic as `reader-filter.ts`, and it commits nothing (session state)
- [x] a determined empty: "nothing on the glass matches this filter", distinct from an empty glass
- [x] one-press Clear
- [x] e2e specs

## Summary of Changes

- **A Filter tile on the glass** (`buildFilter` in `mountGlass`) with Kind, From, and one checkbox per item.
- **Every item is described by two axes** in `glassItems()`:
  - a shelf asset is a book (From: "<instance> library") or a todo (From: "Todo board")
  - a floating card is a sticky (From: the pin's page label) or a todo
  - a board-floated todo card now carries `data-fa-pin` so its source is readable
- **Options come from what is on the glass.** The filter is session state only; hiding uses a `data-fa-filtered-out` attribute, never `hidden`. There is a determined-empty note and a one-press Clear.
- **Tests:** `glass-filter.e2e.ts` has 8 specs. With hiding disabled, the 5 filtering specs fail.
