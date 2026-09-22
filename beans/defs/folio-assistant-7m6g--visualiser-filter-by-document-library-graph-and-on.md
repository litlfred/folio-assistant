---
# folio-assistant-7m6g
title: 'VISUALISER FILTER: by document, library, graph — and one per thing in the folio working space'
status: todo
type: feature
priority: normal
created_at: 2026-09-21T21:02:31Z
updated_at: 2026-09-21T21:02:31Z
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

- **waits on:** O2 on issue #764 — where the visualiser axis is declared
- **since:** 2026-09-21
- **expires:** 2026-09-29 — a REVIEW date, not a takeover date; see the handoff
- **handoff:** on expiry, re-ask on #764. Do not pick the axis unilaterally: a filter over visualisers needs the declaration to exist first, and guessing it here would mint a second answer to where it lives.


O2 on issue #764 — where the visualiser axis is declared — because a filter
over visualisers needs to know what a visualiser is declared against.
