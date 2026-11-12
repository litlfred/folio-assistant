---
# folio-assistant-2a0d
$schema: bean/1.0.0
title: 'Memory: Where the DPI-H public-comment Google Sheet lives, its tabs, and the scheduled sync task'
status: completed
type: task
priority: low
created_at: 2026-10-30T19:43:00Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dpi-h-review-sheet.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Where the DPI-H public-comment Google Sheet lives, its tabs, and the scheduled sync task


- Sheet: 1TNr5VP1oiE9N0Wd-XCgmUIdishb_Yl6Rm39mNx-_GQY ("Reference Architecture - Public Comment Master Log"), owned by informatics.avengers; reachable via the Google Sheets connector (set up 2026-10-30).
- 2026-10-30 22:05Z layout: Change Set Comments tab deleted; Source Comments renamed Public Comment Source; RPC PC column deleted (No. links to smart-ra instead); RPC headers renamed Change Set, TWG (agent), TWG (human). Hidden helper tab 'RCS joins (live)'. Links/joins are kept by an Apps Script the owner installs (/mnt/project-files/dpi-h-review-sheet/Code.gs); hand-pasted '#rangeid=pcN' links show Invalid range.
- Tabs (owner restart 2026-10-30 20:26Z): Source Comments; Review Public Comments (one row per PC; J = PC's own Suggested revision, locked; K–M Architect Feedback (initials)); Agent (ONLY tab the agent writes; L–P per change-set with PR and staging); Review Change Sets (one row per CS; owner reorders columns by hand, so find by header: TWG (PCs) auto, TWG (CS) dropdown, Architect Feedback x3 blue, Ready for agent / Ready for merge orange and editable by editors (owner 20:34Z), grey = mechanical); Change Set Comments (old per-PC view, Ready lookup stale, delete card pending).
- PRs belong to change-sets. Agent watches feedback cells and cell comments on both review tabs.
- Procedure lives in the public-comment skill (folio-assistant-core; #273 has the change-set version), not here.
- Scheduled task "DPI-H review sheet sync" (trig_01EKmD7okZJQWpY6uKdauBbB), every 2 hours on weekdays at :18 UTC; owner chose the cadence 2026-10-30. Each run starts a new thread in this project.
- 2026-10-31: watcher thread "Watch DPI-H Public Comment Log" checks the sheet every 3 min (send_later). Watch tab live since 07:58Z; Config!B3 COLS rewritten from the current tool 08:08Z (user chose A; old value in project-files review-sheet/watch-2026-10-31/), so the watcher now reads only Watch!A1:D1. User consolidated (08:14Z): 2-hourly sync task trig_01EKmD7okZJQWpY6uKdauBbB is PAUSED; the watcher does its PR checks hourly. Grey-content basis ("2:") in core#349 (issue #348), needs owner re-paste then basis rewrite.

Workflow rules (user, 2026-10-31 09:34Z): when a change-set row goes stale because its content changed, "Ready for agent" goes back to No (the script does this; the agent never writes the orange cells). An Editor sets it to Yes again to tell the agent to update that row's PR. Owner chose 10:14Z: one row = one branch, one active PR; earlier PRs stay listed (skill review-sheet-script, core#368).
- 2026-10-31 10:19Z owner: people's PC columns renamed "Architect Feedback" -> "Committee Feedback" (core#371; script reads both). PC template renamed; DPI-H Master Log rename waits on the owner pasting the new Code.gs. Config EDITORS row is Orange. core#372: PC timer now rebuilds when Agent changed. Card pending: split DPI-H Agent tab into comments / change-sets tabs.
- 2026-10-31 (core#371-#374): headers become Committee Feedback (people) and "Change Set Feedback (agent)"; Agent tab splits into "Agent - Comments" + "Agent - Change Sets" (CFG.AGENT_CS). DPI-H sheet still on old names until the user pastes the new Code.gs; then split the tab and rename.
- 2026-11-08 ~13:30Z: 645 EY-review comments appended as No. 765-1409 (RPC rows 767-1411; Agent - Comments; Public Comment Source), user card A 12:48Z. GOTCHA: Code.gs refreshRpc rewrites No./Sections/Page/Lines from a snapshot read at run start, so an API write to RPC A-D during a run is lost; write A-D in ONE update_values call and re-read ~7 min later. No. 1336-1409 have no section/page/lines in the source (blank is correct).
