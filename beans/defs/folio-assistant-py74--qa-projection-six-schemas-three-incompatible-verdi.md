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

## RULED 2026-09-21 — separate family panels, never one total

The owner, choosing from four options:

> Separate family panels, never one total.

So Done-when item 1 is settled, and it settles it in the direction this bean
was leaning: the dashboard shows one panel per family, in that family's own
vocabulary, and publishes no number that spans them.

### Re-measured before the ruling — this bean undercounts

It says six families. **There are nine.** Measured by reading `$schema` out of
every JSON under `cat-harness/` rather than from the earlier survey:

| schema | files | `criteria` | roll-up buckets |
|---|---|---|---|
| `kg-qa/v1` | **321** | dict | `totals`: pass · fail · **`n/a`** · unknown |
| `qa-witness/v1` | 134 | **list** | `counts`: pass · fail · **`na`** · unknown · **`warn`** |
| `block-qa/v1` | 122 | dict | **none** |
| `qa-script/v1` | **84** | — | — |
| `folio-qa-index/v1` | 11 | — | — |
| `qa-results/v1` | 8 | — | — |
| `kg-qa-manifest/v1` | 1 | — | — |
| `folio-test-run/v1` | 1 | — | — |
| `translation-qa/v1` | 1 | dict | — |

`qa-script/v1` (84 files), `kg-qa-manifest/v1` and `translation-qa/v1` were
missing from the table above.

### The three disagreements, which are sharper than "incompatible shapes"

The two largest families that both roll up disagree **three separate ways**:

1. the container is `totals` in one and `counts` in the other;
2. not-applicable is spelled **`n/a`** in one and **`na`** in the other;
3. `qa-witness` has a fifth bucket, **`warn`**, that `kg-qa` has no concept of.

And the third-largest, `block-qa` at 122 files, carries **no roll-up field at
all**. So a shared headline would have to drop `warn` or invent it for the
others, pick a spelling of not-applicable, and compute totals for 122 files
that never declared any — three decisions, none of them the reader's to
discover from a number on a dashboard.

### What was NOT chosen, and why it is worth recording

**Normalising the schemas first.** It is the option that makes a headline free
afterwards, and it was declined for now: it rewrites 577 committed files, and
the disagreement is only a defect if somebody wants the total. Nobody does.

## Done when
- [x] A ruling on whether the six families may be summarised together —
      **no. One panel per family, no cross-family total** (owner, 2026-09-21)
- [ ] A reader that classifies on `$schema` and never infers from a path
- [ ] A projection at `assets/qa/index.json`
