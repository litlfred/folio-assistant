---
# folio-assistant-5wrg
title: 'A11Y GATE: the six state dashboards are audited by nothing — measured clean today, untested tomorrow'
status: completed
type: task
priority: normal
created_at: 2026-09-21T10:51:28Z
updated_at: 2026-09-21T10:54:04Z
parent: folio-assistant-o3xy
---

Found 2026-09-21 by asking a question rather than assuming the answer: *does the
accessibility gate cover the state dashboards?*

## Measured, both halves

**The gate audits ONE page.** `cat-harness/test/a11y.e2e.ts` runs axe over
`PAGE = "/_kg/folio-assistant/index.html"` — the KG viewer — plus an i18n
fixture and two sticky fixtures it builds itself. Grepping for a `goto` at any
of `qa/`, `beans/`, `todos/`, `uploads/`, `health/`, `issue-marks/` across
every `*.e2e.ts`: **no match**. None of the six dashboards is visited by any
end-to-end spec.

**And they pass anyway.** Run locally in the pinned Chromium, axe with the same
tags the gate uses (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`):

| dashboard | violations |
|---|---|
| beans | 0 |
| health | 0 |
| issue-marks | 0 |
| qa | 0 |
| todos | 0 |
| uploads | 0 |

**Zero across all six.** So this is a coverage gap with no defect behind it —
which is the version worth fixing, because it is cheap now and expensive once
something has already broken.

## Why it still matters

This repository's own thesis, from the `1xhc` epic: *a gate that does not fire
is indistinguishable from one that passes.* Six generated pages that nothing
audits are six pages where the next markup change is unchecked — and one was
changed today, when the `qa` dashboard's bucket counts went from nested cards
to a KPI row.

The stakes are not generic here either. This instance's declared interaction
profile is **low-dexterity**, and `gjli` says ALL UI must follow the
accessibility guidance. A dashboard is UI.

## The shape of the fix

A spec that **discovers** the dashboards rather than listing them, so a seventh
is covered the day it is generated. The honest discriminator is the one the
pruner already uses: a directory under the site whose `index.html` carries the
generator's marker — `GENERATED_BY` in `state-visualizer.ts`.

**The generator cannot be imported from an e2e spec.** Line 150 is
`instanceRootFor(import.meta.dir)`, and `import.meta.dir` is a Bun extension
that is `undefined` under Node, which is what Playwright runs specs with —
`action-tiles.e2e.ts` already carries that warning in its own header. So the
marker is duplicated into the spec and a Bun-side test asserts the two agree.
That is this repository's own rule applied literally: an unavoidable duplicate
is fine while an unchecked one is not.

## Housekeeping

This bean was created by a probe while working out that `beans create` rejects
`--body-file -` with a heredoc. It was **reused rather than left as litter and
a second one created** — `beans create` dedupes on nothing, and an unguarded
re-run once produced 14,688 duplicates in another repo.

## Done when

- [ ] Every generated state dashboard is audited by axe at the same WCAG tags
      the existing gate uses
- [ ] The set is DISCOVERED, not listed, so a new dashboard is covered without
      anyone remembering
- [ ] The duplicated marker is checked rather than trusted

---

## Built 2026-09-21

`cat-harness/test/state-dashboards.e2e.ts` — **13 tests, all passing**: one
that the discovered set is non-empty, then two per dashboard (axe at the
gate's own WCAG tags, and no horizontal scroll at 390px).

### The set is discovered, so a seventh dashboard needs nobody to remember

Directories under the site whose `index.html` carries the generator's marker —
the same predicate `prunableDashboards` uses, and ownership is read off the
FILE rather than inferred from the directory, because the site also holds
`guides/`, `reference/` and much else this must not touch. Discovery finds
exactly `beans, health, issue-marks, qa, todos, uploads`.

### The non-empty test is not padding

Without it the suite is **vacuously green**: zero dashboards means zero tests,
and a run over nothing reports exactly like a clean sweep. That is the
`check:l1-complete` shape — *"nothing to check"*, exit 0 — which `a6kl` already
paid for once.

### Three copies of the marker became one import and one checked duplicate

The Bun-side test already carried a THIRD hand-typed copy (`const MARK = "..."`)
and now imports `GENERATED_BY` instead: a fixture that restates the value under
test agrees with a wrong one as happily as with a right one. The e2e spec still
carries a literal, because `state-visualizer.ts` calls
`instanceRootFor(import.meta.dir)` at module scope and `import.meta.dir` is a
Bun extension that is `undefined` under Node — which is what Playwright runs
specs with. Two Bun-side tests now assert the spec's literal equals
`GENERATED_BY`, and that the marker really is in the pages, so the case where
both copies agree and both are wrong is covered too.

### Falsified, not asserted

Two defects planted in the generated `qa` page, spec re-run, page restored
(`git diff` empty):

| planted | caught by |
|---|---|
| `<img src="x.png">` with no alt | `image-alt [critical] ×1 — Images must have alternative text` |
| a `width:2000px` block | `Expected: <= 390 / Received: 2016` |

**2 failed, 11 passed.** Both halves of the spec earn their place.

## Done when
- [x] Every generated state dashboard is audited by axe at the same WCAG tags
      the existing gate uses
- [x] The set is DISCOVERED, not listed
- [x] The duplicated marker is checked rather than trusted
