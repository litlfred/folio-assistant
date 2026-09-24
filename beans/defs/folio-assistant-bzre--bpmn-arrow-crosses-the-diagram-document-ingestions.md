---
# folio-assistant-bzre
title: 'BPMN ARROW CROSSES THE DIAGRAM: document-ingestion''s gap-to-derive edge routes under every task instead of back along the lane'
status: completed
type: bug
priority: normal
created_at: 2026-09-23T20:00:15Z
updated_at: 2026-09-23T20:41:46Z
parent: folio-assistant-p5wm
---


Owner, 2026-09-23, on the rendered `document-ingestion` diagram: **"bad
arrow"**, then the rule: **"keep rectilinear if possible, no overlapping."**

## What is wrong

The `gap` flow from *Record the gap as a bean* back to *Derive content from the
assets* is drawn as ONE LONG DIAGONAL crossing the full width of the process,
passing beneath every task in the lane. It is an ordinary loop-back and it is
the hardest edge on the page to follow.

## The rule, now in the skill

`skills/workflow/bpmn-processes.md` §"Edge routing" carries it:

- **rectilinear** — a sequence flow turns at right angles; a diagonal reads as
  a different kind of edge, and the notation has no such kind;
- **never over a task, a lane label or another edge** — a loop-back belongs in
  the channel BELOW the lane's tasks, which is where a reader already looks
  for one and crosses nothing.

## Not semantics

`BPMNDiagram` carries where a thing was DRAWN; the process carries what is
true. So a routing fix changes no flow and needs no re-validation of the
process — the same split `board-diagram-interchange` draws one level up. What
it changes is whether somebody can read it.

## Done when

- [x] `document-ingestion.bpmn`'s gap edge routes below the lane rather than
  across it
- [x] the RENDERED SVG is checked rather than the XML

## Fixed 2026-09-23

`Flow_i8` was `(1775,570) -> (1775,610) -> (865,430) -> (865,390)`. The third
segment is the bad arrow: a diagonal running the full width AND rising 180px,
passing beneath every task in the lane.

Now `(1775,570) -> (1775,595) -> (865,595) -> (865,390)` — down out of the
task, left along a clear channel, up into `CallActivity_Derive`. Three right
angles, no diagonal.

**y=595 was measured, not picked.** `Lane_2` spans y 440..620 and
`Task_OpenBean` occupies y 490..570, so the channel beneath it is 570..620.
595 is its middle; the original 610 hugged the `Lane_3` boundary at 620.

**Nothing is crossed, and that was checked rather than assumed.** The x
830..900 column between y 390 and 620 holds only lane BANDS — containers, not
obstacles — and `CallActivity_Derive` ends at y=390 where the edge terminates.
No other edge has a waypoint in y 575..615.

**Verified in the RENDERED SVG**, per the rule this bean put in the skill: the
edge's polyline is the four waypoints with zero diagonal segments. The two
sub-pixel diagonals in the sibling path are the renderer's 2.5px corner
rounding, which is a corner rather than a diagonal — worth saying, because a
naive segment check over the whole file reports 216 of 565 "diagonals" that
are arrowheads, icons and glyphs.
