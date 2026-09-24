---
# folio-assistant-3oqj
title: 'FOUR KINDS NOTHING AUDITS: health, interaction, issue-marks, todos - 13 files, 0 criteria, 0 gates'
status: todo
type: task
created_at: 2026-09-24T05:44:17Z
updated_at: 2026-09-24T05:44:17Z
parent: folio-assistant-1swy
---

Measured 2026-09-24 by `bun run audit:coverage` (bean `xutg`). Four declared
graph kinds hold files that **no `kg-audit` criterion and no gate declaring
`@covers` reaches**:

| kind | files | directories |
|---|---|---|
| `health` | 1 | `cat-harness/test/health/results` |
| `interaction` | 1 | `interaction` |
| `issue-marks` | 2 | `issue-marks` |
| `todos` | 9 | `todos` |

## This is an UPPER bound, not a verdict

10 of 141 gates have not declared what they cover (`3srh`). Close that first, or
a criterion gets written for a kind something already audits.

## Two of the four are read at session start

`interaction/` is the `context` graph read at the start of every session, and
`issue-marks/` holds the two timestamps `issue-working` tracks. Both are *read*
by the harness and validated by nothing, so a malformed node fails at the moment
an agent needs it rather than in CI. That is the same shape as `health`, whose
one result file carries every threshold's basis.

`state-visualizer` renders dashboards over all four and declares `@covers none`
deliberately: rendering is a currency check on the render, not a verdict on the
graph. Do not count it as coverage without deciding that it should be one.

## Done when

Either each kind has something that judges its nodes, or its row says in the
sidecar **why it needs nothing** — never by the row quietly reading clean.
