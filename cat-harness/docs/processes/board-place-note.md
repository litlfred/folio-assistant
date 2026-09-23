---
title: 'Board: place a note'
nav_exclude: true
---

{: .note }
> Generated from `cat-harness/processes/board-place-note.bpmn` by `gen-processes-viz.ts` — do not edit here. [All processes](index.html)

{% raw %}
# Board: place a note

`Process_BoardPlaceNote` · advisory · 3 step(s)

Putting a note at a spot on a board: write the note into the folio, record where it was drawn on THIS board, and sweep any position whose note has gone. You are in this process whenever a note is to appear somewhere. The first gateway exists because the note may already be there — placing is not the same as creating, and a process that conflated them would duplicate content every time somebody moved something. The rule the diagram holds is in the first activity's own wording: the note goes into the folio WITH NO COORDINATE. A folio is complete with no board, so a coordinate on a note would make the content depend on a drawing of it. The x,y belongs to the layer, keyed to one board, and an orphaned position is swept from the LAYER rather than being allowed to keep a note alive.

<img src="../assets/img/workflows/board-place-note.svg" alt="BPMN diagram: Board: place a note" style="max-width:100%">

## How it connects

- **Called by:** no call activity names this process
- **Calls:** none

## Lanes — who acts

| lane | role | what it does here |
|---|---|---|
| Author | `author` | Reached only on the `new sticky` branch of GW_Exists — dragging an existing card never re-enters this lane, because A_CreateNote is the one write to the folio and everything after it is positioning. Leaving out `x`, `y` and `board` here is what lets one note sit on several boards without this lane arbitrating between them; arbitration would make placement an authoring decision, which it is not. |
| Layout layer | `corpus` | Every placement writes here, and nothing that decides anything reads it back — losing this graph loses WHERE a note sits, never WHAT it says. That asymmetry is why A_SweepOrphans cleans stray positions from this lane's own file rather than touching the note itself: the easy direction is removing a position whose note is gone, never removing a note because its position is. |

## Steps

**3** of 3 step(s) carry no documentation — `activity-documented` lists them.

| step | lane | skill / sub-process | what it does |
|---|---|---|---|
| **Write the note into the folio — with no coordinate**<br>`A_CreateNote` | Author | [`board-diagram-interchange`](../reference/skill-instructions/board-diagram-interchange.html) | — |
| **Record x,y for this note on THIS board**<br>`A_Place` | Layout layer | [`board-diagram-interchange`](../reference/skill-instructions/board-diagram-interchange.html) | — |
| **Sweep positions whose note is gone**<br>`A_SweepOrphans` | Layout layer | [`board-diagram-interchange`](../reference/skill-instructions/board-diagram-interchange.html) | — |

{% endraw %}
