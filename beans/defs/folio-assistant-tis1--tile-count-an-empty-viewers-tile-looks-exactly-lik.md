---
# folio-assistant-tis1
title: 'TILE COUNT: an empty viewer''s tile looks exactly like a populated one — badge the count, absent is a third state'
status: in-progress
type: task
priority: normal
created_at: 2026-09-22T06:52:31Z
updated_at: 2026-09-22T06:52:49Z
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
