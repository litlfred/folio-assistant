---
# folio-assistant-bzre
title: 'BPMN ARROW CROSSES THE DIAGRAM: document-ingestion''s gap-to-derive edge routes under every task instead of back along the lane'
status: todo
type: bug
created_at: 2026-09-23T20:00:15Z
updated_at: 2026-09-23T20:00:15Z
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

`document-ingestion.bpmn`'s gap edge routes below the lane rather than across
it, and the RENDERED SVG is checked rather than the XML — waypoints that look
orderly in source can still emit a diagonal.
