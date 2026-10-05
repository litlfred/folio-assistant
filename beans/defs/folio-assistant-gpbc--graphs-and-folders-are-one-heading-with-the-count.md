---
# folio-assistant-gpbc
title: Graphs and Folders are one heading, with the count badge
status: in-progress
type: task
priority: normal
created_at: 2026-10-05T14:39:33Z
updated_at: 2026-10-05T15:27:50Z
parent: folio-assistant-9rq1
---

Owner, 2026-10-05: 'graphs containing ONLY folders is weird. combine w/ badge of count.' mountSidebarRail wraps mountInstanceGraphs' 'Folders N' details in a second 'Graphs' details. Make one disclosure titled Graphs carrying the count.

## Done when
- [ ] one 'Graphs N' disclosure on the theme sidebar; the rail already has one
- [ ] e2e updated

_2026-10-05T15:25:10Z_ — Claimed by claude/vibrant-darwin-r6im60 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

Done in this branch: the count moves onto the Graphs heading and Folders is held open with its heading hidden (rows still Folders' nodes, moved; the group's pin rules unchanged). Rendered: one 'GRAPHS 28' that opens straight to the list. 94 e2e pass across navbar-row, sidebar-rail, rail-icon-row, action-tiles.
