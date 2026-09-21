---
# folio-assistant-py74
title: 'QA PROJECTION: six schemas, three incompatible verdict shapes — no honest roll-up exists yet'
status: todo
type: task
parent: folio-assistant-yj32
created_at: 2026-09-20T23:09:04Z
updated_at: 2026-09-20T23:09:04Z
---

`<base>/qa/` says "declared and nothing publishes a projection for it yet" over **592 committed JSON files**. A reader was attempted 2026-09-20 and STOPPED at the measurement, deliberately.

## What the graph actually holds

| schema | files | where a verdict lives |
|---|---|---|
| `kg-qa/v1` | 316 | `criteria` as a DICT keyed by criterion id, plus `totals` |
| `qa-witness/v1` | 134 | `state` (top-level) + `counts` + `criteria` as a LIST of objects carrying `result` |
| `block-qa/v1` | 122 | `criteria` as a DICT keyed by criterion id, no totals |
| `folio-qa-index/v1` | 11 | none — an index, not a result |
| `qa-results/v1` | 8 | `families` + `total`, already rolled up |
| `folio-test-run/v1` | 1 | `outcome` with population / truePositives / falsePositives |

## Why this stopped rather than shipped

`criteria` is a **dict in two schemas and a list in a third**. `folio-test-run` measures an eval's true-positive rate, which is not the same kind of number as a KG criterion's pass. A single headline over these would mix them, and a wrong number on a dashboard is believed — the `.gitignore`-counted-in-the-badge lesson from `v1hw`, one level up.

Every file DOES declare its own `$schema`, so classification needs no guessing. The blocker is not detection, it is that **no roll-up across families is defensible without a ruling from the people who own these schemas.**

## What is already built and needs nothing

`state-visualizer.ts` flips a graph from `declared` to `live` the moment `assets/qa/index.json` exists — verified while building the four-state model. So this bean is a reader and a projection only; no generator or schema change.

## Done when
- [ ] A ruling on whether the six families may be summarised together, and if so how — or a decision that the dashboard shows six separate family panels and never one total
- [ ] A reader that classifies on `$schema` and never infers from a path
- [ ] A projection at `assets/qa/index.json`

## Not in scope
`health` (1 file) and `issue-marks` (2) are too thin to earn a dashboard. Saying so is the answer for them, not building one.
