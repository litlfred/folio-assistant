---
# folio-assistant-jg8s
title: 'DECIDED: a sheet is a grouping node IFF the source has sheets — model reality, do not force conformance'
status: todo
type: task
priority: normal
created_at: 2026-09-20T13:05:11Z
updated_at: 2026-09-20T13:05:11Z
parent: folio-assistant-0lmb
blocking:
    - folio-assistant-p67i
---

## The owner's decision, 2026-09-20

Asked to choose between *a sheet is a `table` block* (flat, cheap) and *a sheet
is a grouping node* (nested, mirrors the paged path), the answer was **both**:

> "both, sheet in grouping and single sheet. should model reality. not force
> conformance"

So the shape follows the SOURCE, not a house style:

| source | graph |
|---|---|
| multi-sheet workbook | `manifest.contains → sheet → table block(s)` |
| single-sheet CSV | `manifest.contains → table block` |

## Why this is not a fudge, and was already decided one level down

`schemas/tabular-csvw.ts` sets `fac:anchor.sheet` to `null` for a CSV, with the
reason written on it: *"a CSV genuinely has no sheet, and writing `Sheet1` would
invent one."*

This is the same rule at the graph level. Wrapping a CSV in a sheet node
invents a sheet; flattening a workbook's sheets discards a real one. **Both
options as originally posed were a choice of which lie to tell uniformly.**

That also explains why `fac:anchor` exists at all. It is there because a table
may not start at A1 and a sheet may hold more than one — so a model that cannot
express *sheet contains tables* contradicts a constraint the schema already
carries.

## The general principle, which outlives this bean

**Model reality; do not force conformance.** A uniform shape is not a virtue
when the things being shaped differ. This repository has paid for the opposite
reflex more than once — the L1 gate demanding `structure.json`, `sections/` and
`images.json` of a CSV is the same mistake, and `pn6j`'s promotion gate turned
it from a wrong report into a permanent blocker (#499).

The honest cost: consumers must handle both depths. That is a real cost and it
is smaller than the alternative, because a consumer that assumes one depth was
going to be wrong about half the corpus anyway.

## Done when

- [ ] `gen-library-jsonld.ts` emits the sheet level IFF the source has sheets
- [ ] both shapes tested from fixtures — a workbook AND a CSV
- [ ] a consumer that walks `contains` is shown to handle both, rather than
      assumed to
- [ ] the rule is in `skills/folio-core/tabular-metadata.md`, not only here
- [ ] `p67i`'s manifest Done-when is met

## What still cannot be verified

There is **no tabular source in the corpus** — four PDFs, no CSV or workbook.
So this is fixture-tested by necessity, and that limit is stated rather than
papered over: the first real spreadsheet is the one that tests it.

*2026-09-20, same turn* — **"special case of common scenarios ok."**

An explicit licence, and it changes how the implementation should read. The
instinct when two shapes exist is to find the abstraction that covers both —
a `depth` parameter, a "container" that is sometimes elided, a generic walker
that handles N levels. That instinct is what produces a model nobody can read
and a bug nobody can find.

So: **a single-sheet CSV is a named case with its own branch, and a workbook is
another.** Two legible paths beat one clever one. If a third source type
arrives that is neither, it gets a third branch — and the moment there are
enough branches to be worth unifying, that is a measurement, not a prediction.

The limit on this, which is not a contradiction of it: a special case still has
to be a special case of something TRUE. Flattening a workbook because
single-sheet is common would not be special-casing, it would be the forced
conformance this bean rejects, wearing the licence as cover.
