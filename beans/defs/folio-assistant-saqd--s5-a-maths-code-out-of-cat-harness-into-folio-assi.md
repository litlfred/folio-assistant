---
# folio-assistant-saqd
$schema: bean/1.0.0
title: 'S5-a: maths code out of cat-harness into folio-assistant-sci''s code (#223 partition; 49 MOVE + 10 split)'
status: todo
type: task
priority: normal
created_at: 2026-10-01T12:16:24Z
updated_at: 2026-10-24T08:05:00Z
parent: folio-assistant-7x5n
---

Story S5 (txue), with/after 70lx. Rows: cat-harness/docs/proposals/placement-audit-2026-10-01.json (PR #1778) — pr '(#223 code partition; S5)', instance=cat-harness, target folio-assistant-sci: MOVE 49, AMBIGUOUS 10 (owner Q4: SPLIT — generic pipeline -> cat-harness-tools, Lean/LaTeX checkers -> sci code plugged into it). Plus smart-base 3, fhir-harness 2, core 1. One agent at a time.
## Done when
- [ ] rows moved/split; typecheck program conserved; gates green; merged

## State 2026-10-09
Re-derived from `placement-audit-2026-10-01.json` against the post-split mount: of the **73** rows tagged `unplanned (#223 code partition; S5)`, **67** are still at their original path. Blocker `70lx` is completed, so this is unblocked; it is now cross-repository work (litlfred/cat-harness[-tools] → litlfred/folio-assistant-sci). Session https://claude.ai/code/session_017QXvm7c7RDYFguWzSxhrMb.

_2026-10-16T06:55:00Z_ — Block lifted: `70lx` is completed. Owner ruling 2026-10-16 06:50Z (question 4, option 1): the part-by-part measurement stands in for `bun run cat gates --all` and for falsifier 2, so 70lx is closed. Session https://claude.ai/code/session_01K9Xi9QSxCNYju8QNu7EuHg.

## 2026-10-24 — re-measured (separation drain, session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e)

Re-measured by file name across cat-harness, cat-harness-tools, core and sci: of 73 rows, 49 MOVE and all 10 AMBIGUOUS are still in the harness layers; 7 are in their target, 7 are found nowhere (renamed or deleted). Still the 39-module sci cluster `rfev` describes; not started.
