---
layout: default
generated: scripts/gen-skill-docs.ts — do not hand-edit; edit the skill
title: 'Relationship first, visualisation later'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/board-diagram-interchange.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/board-diagram-interchange.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/board-diagram-interchange.md){: .fa-edit-source }

{% raw %}
# Relationship first, visualisation later

**One sentence, and it is the owner's:**

> treat it like OMG specs and BPMN layout. **relationship first, visualiztion
> alter.**

BPMN separates the semantic model — `bpmn:process`, its tasks and its flows —
from **Diagram Interchange**: `BPMNDiagram`, `BPMNShape`, `BPMNEdge`, which say
where each of those was drawn. They are two documents about one subject, and
the layout one points **at** the semantic one, never the other way.

A folio board is the same shape:

```
semantic model        notes, anchors, content nodes     what is true
diagram interchange   board-positions.json              where it was drawn
```

## What follows, and it is four things rather than a preference

**A folio is complete with no board.** Deleting every board loses layout and
no content. That is the test to apply when you are unsure whether something
belongs on the board or in the folio: if losing it would lose a fact, it is not
layout.

**A note carries no `x`, no `y`, no `board`, no `position`** — for the same
reason a BPMN task carries no coordinates. The owner said it directly: *"it
lives on top of notes, not data within notes"*, and *"notes exist lower down
than folio. make sure arrows correct."*

**One note may sit on several boards**, at different places, without the note
arbitrating between them. A coordinate on the note could not express that; a
layer above it does so for free.

**An orphan is swept from the LAYER**, which is the easy direction: one file,
one pass, and nothing edited out of a note a person owns.

## The arrow, and how it is kept

```
folio  ──▶  board  ──▶  position  ──▶  note        allowed
note   ──▶  position / board / folio               REFUSED
```

This is a property a future edit can break silently, so it is **checked rather
than described**. `schemas/board-positions.test.ts` asserts two things against
the SOURCE:

- no field named `x`, `y`, `board` or `position` appears in `todo.ts`,
  `carried-note.ts`, `landing-sticky.ts` or `note-anchor.ts`;
- `board-positions.ts` imports `zod` and nothing else — it names notes by id,
  and an id needs no type from the layer below.

The first guards the failure that actually happens: somebody adding coordinates
to a note "for convenience", which makes a `content` node carry `state` and
gives one note two answers on two boards.

## Two graph kinds, because they are two things

| kind | holds | what it is |
|---|---|---|
| `boards` | **content** | what a board is and what it shows |
| `board-positions` | **state** | where each note was drawn |

`content-context-and-state-graphs` refuses a content node that carries state,
which is the same rule one level up. And `check:graph-kind-work` asks a
sharper question of the second: it *is* state, written by a running process
every time somebody moves a note — but **state that records a position in a
PROCESS is work, and state that records a position on a CANVAS is not.** Both
kinds declare `recordsWork: false`.

## A board declares what it SHOWS, and absent means everything

`schemas/board.ts`: an optional `filter` over `pages` and `kinds`, OR within an
axis and AND across them. **Absent is the default and it means the whole
folio** — a query rather than a stored list, because a list of content nodes
needs something to notice that a listed node was renamed and that a new one was
never added, and a query has nothing to fall behind.

That decision also answered a question nobody asked it. The owner later said
every harness above the floor *"has a board filled with all contents"*, and
**"filled with all contents" turns out to be the absent filter** — so the
minimal board and the total board are the same document.

## Mergeability is the reason for the shape, and its limit is stated

Positions are the most concurrently-edited state a folio has: two sessions
moving two notes is the ordinary case. So the document is sorted and indented,
one note per line-block, and the sort is **idempotent** — a writer that
reshuffled on save would conflict with every other save.

**It is a partial fix.** Two notes that sort *adjacent* still conflict, because
the inserted lines overlap. This removes the guaranteed conflict, not every
conflict, and saying so is what stops the next person trusting it further than
it goes.

## What this skill is NOT

**Not the rendering.** How a board draws, when a card becomes its avatar and
what an open window does are [`board-windows`](board-windows.md).

**Not the tiles.** Which boards and viewers a reader can reach is
[`harness-tiles`](harness-tiles.md).
{% endraw %}

## Processes that run this skill

| process | step(s) that name it |
|---|---|
| [Board: place a note](../../processes/board-place-note.html) | Write the note into the folio — with no coordinate; Record x,y for this note on THIS board; Sweep positions whose note is gone |
| [Board: relocate content to the trashcan](../../processes/board-relocate.html) | Relocate the content to the trashcan; Drop its positions and sweep orphans |

