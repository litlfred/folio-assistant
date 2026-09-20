---
# folio-assistant-lnpe
title: Both memory agents are back at the 200-line injection budget, so any new entry evicts a TRAP
status: todo
type: bug
parent: folio-assistant-8jt6
created_at: 2026-09-20T07:32:20Z
updated_at: 2026-09-20T07:32:20Z
---


Found 2026-09-20 while adding a memory node for the render log (bean `5mg5`,
PR #473). **A six-line entry was enough to evict a TRAP from both agents.**

## Measured, with `bun run agent-memory`

| | ci-health-watcher | platform-boundary-guard |
|---|---|---|
| 2026-09-19T12:45Z, when `4kiw` closed | 187 lines | 186 lines (11 entries) |
| 2026-09-20, before my node | **208** (11 entries) | **207** (12 entries) |
| with a 26-line node added | 234 (12) | 233 (13) |
| with that node cut to 6 lines | 218 (12) | 217 (13) |

At 208/207 the overflow is *only the hand-written tail*, which is why
`agent-memory:check` exits 0 today. Adding ANY entry moves a real one past the
cut, and the check correctly refuses:

- ci-health-watcher would drop `TRAP — two workflows fail BY DESIGN here; do
  not "fix" them by dispatching`
- platform-boundary-guard would drop `TRAP — three literals worth recognising
  in new code`

Both are entries `4kiw` explicitly decided NOT to archive, with reasons: they
carry the concrete literals (`QOU.`, `folio-assistant/simulators`,
`lakefile.toml`, `raw.githubusercontent.com`) that the superseding skills are
deliberately written folio-generically to avoid.

## What I did NOT do, and why

I **dropped my own entry** rather than archive somebody else's. Choosing which
existing entry goes is a durable-artefact decision
(`deletion-requires-confirmation`), and `4kiw` is on record having weighed
exactly these two and kept them. Nothing was lost: the fact lives in
`skills/folio-core/render-logging.md`, which is where AGENTS.md says the
discipline belongs — the memory entry only summarises.

`4kiw` is **completed and stays completed**. Its boxes were met and measured;
this is a recurrence at a rate of roughly 21 lines a day across both agents,
which is a different problem from the one it fixed.

## Done when

- [ ] the growth rate is understood — 21 lines in one day is either normal
      churn or one session's over-long entries, and the two want different
      answers
- [ ] both agents are under 200 with headroom, by ARCHIVING (never deleting)
      what a skill now supersedes, with the superseding quote recorded on each
      archived node as `4kiw` did
- [ ] the render-log entry is re-added once there is room

## Related

| | |
|---|---|
| the previous round, and its reasoning | `4kiw` |
| the entry waiting for room | `5mg5` |
