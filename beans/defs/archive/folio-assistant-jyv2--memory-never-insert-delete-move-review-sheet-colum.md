---
# folio-assistant-jyv2
$schema: bean/1.0.0
title: 'Memory: Never insert/delete/move review-sheet columns while the Apps Script timer may be running; how DPI-H lost ~200 proposals'
status: completed
type: task
priority: low
created_at: 2026-10-31T15:37:21Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `sheet-column-moves.md` (memory type: feedback) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Never insert/delete/move review-sheet columns while the Apps Script timer may be running; how DPI-H lost ~200 proposals


On 2026-10-31 ~15:31Z I moved "Disposition (agent)" on DPI-H Review Change Sets (delete col + insert) while a timer refresh was mid-run. The refresh had read column positions before the move and wrote by index after it: old Disposition values (mostly blank) landed on Change Set Feedback (agent), wiping ~197 agent proposals (rows without a PR). Rows with a PR survived (their ⏳ text landed in the neighbouring column and was copied back). Restored from the DPI-H thread's copy / version history.

**Why:** the script finds columns by header at the start of a run, then writes by index; a structural change mid-run shifts targets.

**How to apply:** before any column insert/delete/move on a review sheet, read the agent column first and keep a copy (or pick a moment right after a refresh finished), make the change in one batch, then re-read and compare the people's and agent columns. Prefer adding columns at the end over moving existing ones. Related: folio-assistant-2a0d.

2026-11-01: the title cell B1 is merged across the header (B1:P1 on Contributor Feedback), so `moveColumns` throws "can't move part of a merged cell". placeBefore (core#444) failed silently for that reason; core#474 unmerges, moves, re-merges. Q-COL1 answered B 09:56Z: moved by API on the template + HRH, PC, SC, PHC logs at ~09:58Z (unmerge B1:P1, move O to M, re-merge); data checked, nothing shifted.
