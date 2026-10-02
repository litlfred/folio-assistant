---
# folio-assistant-tis1
title: 'TILE COUNT: an empty viewer''s tile looks exactly like a populated one — badge the count, absent is a third state'
status: completed
type: task
priority: normal
created_at: 2026-09-22T06:52:31Z
updated_at: 2026-09-22T11:45:32Z
parent: folio-assistant-o3xy
---

Issue: https://github.com/litlfred/folio-assistant/issues/856

Owner ruling 2026-09-22, over greying an empty tile out and over "an empty
viewer is fine to open". Their reason is the stronger argument: a badge also
makes a WRONG count visible, where a dimmed tile only ever answers
"empty or not".

## The defect

A tile carries a glyph and a caption and nothing else. An empty viewer's tile
is indistinguishable from a populated one until clicked -- `rptk`'s shape
moved onto the navigation, and how #801's twelve off-site tiles survived a
hundred-odd green gates.

## Two measured facts that shape it

1. `graph-tiles.ts` derives tiles from the DECLARATION, never the projection,
   and `flh4` is why. A badge reads the projection, so the split is restated
   rather than crossed: existence stays declaration-derived, only the NUMBER
   is read.

2. There is no uniform entry count. Measured across all six projections:
   beans items 459 / findings 7; library entries 8 / uploads 28 / queues 3;
   qa families 7 + files + unclassified + unreadable; schemas roots 5 /
   modules 121 / decls 842 / edges 525; todos items 3; voices directories 4 /
   voices 5. `schemas` has four plausible answers, and for `uploads` the
   meaningful number is not an array length at all -- it is WAITING, 20 of 28,
   which is #836's whole distinction.

## Design

The projection DECLARES its own count and unit, because only it knows the
unit; the generators already compute and print these numbers. The tile reader
consumes the declaration and infers nothing -- inferring by array name is a
table of guesses, right the day it is written and silently wrong the first
time a shape changes.

Absent is a THIRD STATE: no declared count, or unreadable, renders NO badge,
distinct from a badge reading 0. Opposite facts. The count also reaches the
`aria-label`, not only the pixels.

## Done when

- projections carry a declared count with its unit
- `graph-tiles.ts` reads it, infers nothing, split restated at the read
- `docs-ui.js` badges it, and renders no badge where none is declared
- the count is in the accessible name
- a test making a projection unreadable asserts NO badge -- one that would
  FAIL on a fallback to 0
- `bun run gates` green

Six projections against fourteen tiles, so most tiles carry no badge at
first. That is the third state working; the PR names which have one rather
than implying coverage.

## Summary of Changes

Shipped across three merged PRs, and the middle one is the part worth reading.

**#862 — the mechanism.** A projection DECLARES its own count, keyed by
directory id, because there is no uniform entry count to infer: `schemas` has
four plausible answers, `library` three, and `uploads`' number is not an array
length at all. Keyed rather than bare because `uploads` and `library` are two
tiles over ONE dataset (`flh4`), so that file owes two different numbers.
Absent is a third state at every layer -- no declaration, a malformed entry or
an unreadable file yields NO badge, never `0`, and a malformed entry drops
without dropping its siblings. The count reaches the accessible name.

**#889 — and the mechanism caught its own author.** Extending to the scoped
viewers exposed that #862's two badges disagreed with the pages they open:
`schemas` read 137 over a page showing 122, and `library` read 8 over a page
showing ZERO -- that directory's declaration says "THIS INSTANCE HOLDS NONE".
So the first version of a feature built to surface empty viewers had hidden
one behind a number. Fixed structurally rather than by correcting two figures:
no whole-graph entry remains and every count is computed FOR the page a tile
opens, which makes the class unreachable rather than merely fixed.

Two mistakes made building that, both recorded at the point they happened: a
page is NOT uniquely owned (the first lookup scanned every instance and
returned ids that are not tiles here), and "1 entries", caught by RENDERING
rather than by any gate.

**#932 — the last tile the mechanism reached unchanged.**
`translation-sources`, 5 locales.

### What was verified, and how

Falsified rather than merely green: injecting a `?? 0` into the reader turns
10 of 26 unit tests red, and restoring #862's `library` count turns the
invariant test red. That test asserts a SUM rather than a snapshot -- scoped
tiles partition one graph so they can never exceed it -- and also asserts that
more than one instance contributes, without which the sum could not fail.

Verified on the DEPLOYED bytes, not only locally: 26 tiles, 0 assets absent,
14 badged, 0 off-site hrefs, 14 counts in accessible names.

### Left open, deliberately

Twelve tiles carry no badge, and they are two different problems rather than
one backlog -- issue #931. Nine `docs-auto` pages have no projection to put a
count in, so badging them means minting a file that projects nothing, which is
a decision and not an extension. Three authored `index.md` pages have no
generator; two of them are over countable graphs and one may have no headline
number at all, where "no badge" is the right final state.

### Fallout worth knowing about

The `tile` field created a clean-merge-wrong-result hazard: main and a sibling
branch touched different parts of the voices projection, git merged them with
no conflict, and produced `count: 5` beside six voices -- an artefact neither
side would emit. A sibling session found it and built
`scripts/regen-after-merge.ts` (bean `lxpq`) for the general class.
