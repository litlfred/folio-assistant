---
# folio-assistant-hf2q
$schema: bean/1.0.0
title: 'PROGRAMME PROGRESS: an epic burn-down and a math-progress heat map as a board feed'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-04T15:10:08Z
updated_at: 2026-10-26T10:32:00Z
parent: folio-assistant-6lb8
---

Recorded from the qou work-plan analysis, 2026-10-04 (session https://claude.ai/code/session_01NdDGeP1SyShmoUssLuRZ91). Not started: recorded so the gap has an owner. milestone-status.ts rolls up milestones; nothing draws an epic over time or chapter x {proved, sorry, axiom, conjecture open, active bean, verdict}. Depends on WORK TRACEABILITY and CONJECTURE REGISTER. Must follow board-diagram-interchange (folio -> board, never back) and say 'no data is not zero'.

## Progress from rehomed copy `cat-tools-tk99` (2026-10-22)

- [x] Slice 1 (`cat-harness-tools#559`, merged `d7cf0807b7` 2026-10-23): `bun run cat epic:burndown -- <epic-id> [--ref <ref>] [--path <defs-dir>] [--days <n>] [--json]` — computes day-by-day open/closed/other bean counts beneath an epic from the store's git history (`git cat-file --batch`), preserving "no data is not zero" (5 tests in `epic-burndown.test.ts`).
- [x] Chapter × `{proved, sorry, axiom, conjecture open, active bean, verdict}` math-progress heat map (`cat-harness-tools#755`, merged `10771f3e99` 2026-10-24) and board feed history export (`cat-harness-tools#768`, merged `af98510434` 2026-10-24; slice 4 board rendering still open).

_2026-10-24T07:40:00Z_ — Re-measured: WORK TRACEABILITY `f227` is completed; CONJECTURE REGISTER `ckej` is still `todo`, so the heat map (box 2) still waits on `ckej`. Session https://claude.ai/code/session_01AnAGBDDY8TMwCApxe4b3pX.

Handed over 2026-10-24: the "Drain cat-harness-tools beans" thread owns this as cat-harness-tools bean `cat-tools-tk99`, its rehomed copy, and has put the board-feed question to the owner. ckej is closed (folio-assistant-sci#66), so the heat-map box is no longer blocked.

_2026-10-24T14:10:00Z_ — Claimed by the "Drain cat-harness-tools beans" thread (session https://claude.ai/code/session_01RzLVMhhApyXYiw4bb9RwG8). It is building the heat map (box 2). The board-feed history question is with the owner.

_2026-10-24T14:45:00Z_ — Slice 2 (the heat map, box 2) is up as draft litlfred/cat-harness-tools#755: `bun run cat math:heat`. The board feed, slice 3, waits on the owner's answer to the history question. Session https://claude.ai/code/session_01RzLVMhhApyXYiw4bb9RwG8.

_2026-10-24T15:25:00Z_ — The owner chose option C: the board's history is read at publish from the bean store's git history. Slice 3 is up as draft litlfred/cat-harness-tools#768. It adds `gen-docs-pages.ts --burndown-history`, which writes `assets/beans/burndown.json` with one series per open milestone and epic. Still to do: a one-line folio-assistant `docs-site.yml` change to pass the flag, and slice 4, the board drawing the series. Session https://claude.ai/code/session_01RzLVMhhApyXYiw4bb9RwG8.

## 2026-10-24 19:21Z

The docs-site flag landed: folio-assistant#2686 (277511f). It takes effect once cat-harness-tools is repinned past af98510 (#768). Next: slice 4, where the board draws the series.

_2026-10-26T10:32:00Z_ — Verified merges: `litlfred/cat-harness-tools#755` (`10771f3e99`, 2026-10-24T15:52:42Z) and `litlfred/cat-harness-tools#768` (`af98510434`, 2026-10-24T16:15:34Z). Remaining: slice 4 (board drawing the series).
