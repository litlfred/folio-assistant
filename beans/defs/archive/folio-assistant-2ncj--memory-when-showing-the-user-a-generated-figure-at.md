---
# folio-assistant-2ncj
$schema: bean/1.0.0
title: 'Memory: When showing the user a generated figure, attach the SVG, not a PNG render'
status: completed
type: task
priority: low
created_at: 2026-10-31T13:29:51Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `figure-previews-svg.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: When showing the user a generated figure, attach the SVG, not a PNG render


When you share a generated figure in a thread, attach the SVG itself, not a PNG preview. The owner asked "why png not svg?" on 2026-10-31 at 13:29Z.

**Why:** the folios use the SVG, so a PNG preview shows something other than what ships.
**How to apply:** put the SVG in /mnt/project-files/<task>/ and attach that file. Add a PNG only if the SVG won't display. Related: folio-assistant-aqrb.
