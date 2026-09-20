---
# folio-assistant-whbf
title: 'Overview panel: the DYNAMIC half — drag, re-run layout, alternate arrangements'
status: todo
type: feature
created_at: 2026-09-20T21:10:28Z
updated_at: 2026-09-20T21:10:28Z
parent: folio-assistant-vke6
---

Owner, 2026-09-20, splitting the work explicitly:

| dynamic stuff is bean for later.  but static visualiztion overview is needed.
| panel at top (colassibkle)

The static half shipped: a collapsible `<details>` panel at the top of the
schema viewer holding a deterministic SVG of the whole graph. See
`schema-management` §"The overview panel".

## What is NOT there, and is this bean

- Dragging a node, and the layout holding the new position.
- Re-running / switching layout (the ring is one arrangement; a layered DAG
  and a grouped cluster answer different questions).
- Zoom and pan beyond what the browser gives an inline SVG.
- Filtering the picture live from the list's facets — today the overview shows
  the page's SCOPE, not its current filter, which is deliberate but is a
  choice worth revisiting once the panel can be re-rendered cheaply.

## The constraint that does not relax

No CDN, no framework, no build step — `kg-viewer`'s rule, restated in
`schema-management`. A layout library is exactly the third party that rule
excludes, so the dynamic half is hand-rolled or it does not ship. That is a
real cost and is the reason this is its own bean rather than a follow-on
commit.

## What the static half established, and should not be re-litigated

- Granularity is adaptive: declarations at or under 70 in scope, modules above.
  Drawing 812 labelled declarations is the hairball `kg-viewer` measured at
  1111 nodes and is still ruled out.
- An edge that aggregation makes vanish is COUNTED and reported. 446 of 512
  edges here are intra-module; a dynamic view that drops that report
  reintroduces the defect.
- The layout is reproducible, not merely deterministic — every tie breaks on
  something stable. Any dynamic mode needs a way back to that arrangement, or
  a reader loses the picture they learned.

## Done when

Whatever lands, a reader can return to the static arrangement, and the
undrawn-edge count survives every mode.
