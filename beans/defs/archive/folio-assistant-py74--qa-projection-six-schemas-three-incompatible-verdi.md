---
# folio-assistant-py74
title: 'QA PROJECTION: six schemas, three incompatible verdict shapes — no honest roll-up exists yet'
status: completed
type: task
priority: normal
created_at: 2026-09-20T23:09:04Z
updated_at: 2026-09-21T10:30:54Z
parent: folio-assistant-yj32
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

### Re-measured before the ruling — and my first re-measurement was WRONG

**Correction, recorded rather than quietly fixed.** I reported "there are nine
families, this bean undercounts". That was measured over all of
`cat-harness/`, which is not the `qa` graph. The declaration says the graph is
`test/results/` and nothing else, and **within it there are six families —
exactly what this bean said.** The bean was right; the claim that it undercounts
was mine and is withdrawn.

The three extra tags live OUTSIDE the declared graph, which is a different and
still-interesting fact: `qa-script/v1` (**84 files**) in
`content/pipeline/script-sidecars/`, `kg-qa-manifest/v1` in `skills/`, and
`translation-qa/v1` in `content/docs/crdm-methodology/`. So **86 QA-shaped
documents sit outside the `qa` graph**, and a dashboard over the graph is honest
only because it never claims to cover them. Whether they should be declared is
somebody's ruling, not this bean's.

The ruling is unaffected: all three disagreeing families are inside the declared
graph.

| schema | files | `criteria` | roll-up buckets |

| schema | files | `criteria` | roll-up buckets |
|---|---|---|---|
| `kg-qa/v1` | **321** | dict | `totals`: pass · fail · **`n/a`** · unknown |
| `qa-witness/v1` | 134 | **list** | `counts`: pass · fail · **`na`** · unknown · **`warn`** |
| `block-qa/v1` | 122 | dict | **none** |
| `folio-qa-index/v1` | 11 | — | — |
| `qa-results/v1` | 8 | — | — |
| `folio-test-run/v1` | 1 | — | — |

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

## Built 2026-09-21

`content/pipeline/qa-graph-index.ts` — the reader. `gen-docs-pages.ts` emits
`assets/qa/index.json`. `state-visualizer.ts` renders one panel per family,
**server-side**, so the page needs no JavaScript.

### The refusal is structural, not a habit

`QaGraphIndex` has no cross-family verdict field, and a test asserts its
ABSENCE rather than trusting nobody to add one — the same discipline
`GraphKindDef.holds` uses. The page also SAYS there is no total and names the
three disagreements, because a reader who finds none and is told nothing will
assume the page is unfinished and go looking.

### A real bug caught on the way, and it would have shipped

`dashboardPage` chose its renderer as `g.id === "beans" ? beans-meta :
todo-meta` — a DEFAULT rather than a choice, so **every** projection that was
not beans got the todo renderer. It survived because only two existed. The
third would have mounted the work-plan renderer over a document with no `items`
array: the page would have claimed `live` above a container rendering nothing,
which is worse than honestly saying `declared` and is the defect `flh4` already
paid for one state over.

The dispatch now reads the projection's own `$schema`, and a tag it cannot
render says so rather than guessing. Five tests.

### Two guards were stale and both were narrowed rather than deleted

- `state-visualizer.test.ts` used `qa` as its example of an unprojected graph.
  Moved to `health` and `issue-marks` — the two this bean DECIDED are too thin
  to earn a dashboard, so they are stable examples rather than merely empty
  ones.
- `qa-results.test.ts` asserted `docs/assets/qa/` does not exist at all, as a
  proxy for "no witnesses under docs/". The proxy stopped being equivalent the
  moment the graph's projection landed there. It now asserts what it always
  meant: nothing but `index.json`, and no `.block.json` / `.qa.json` /
  `.qa-results.json` committed under it.

### Verified by removal, not by assertion

Moving `assets/qa/index.json` aside and regenerating: **4 declared / 3 live**.
Putting it back: **3 declared / 4 live**. Exactly one graph changed state.

## Done when
- [x] A ruling on whether the families may be summarised together —
      **no. One panel per family, no cross-family total** (owner, 2026-09-21)
- [x] A reader that classifies on `$schema` and never infers from a path
- [x] A projection at `assets/qa/index.json`
