---
# folio-assistant-a8wy
title: 'VECTOR FIGURE ARM: extract positioned labels from vector-only figures — 69 of 87 caption pages'
status: in-progress
type: task
created_at: 2026-09-24T18:04:22Z
updated_at: 2026-09-24T18:35:11Z
parent: folio-assistant-2yyh
---

Sibling of `m4xy` under the same epic, and the second of its two open arms, and the narrow one: **the labels, and
nothing above them.** `pdf-images.py` recovers the raster layer; a WHO
conceptual figure is drawn in path operators and text, so there is no image
object and that arm places nothing. `9789240120747-eng` declares six captioned
figures and places zero images, and `check-l1-complete` reported *"0 image(s),
0 describable and all described"* over it.

Shipped 2026-09-24 as `scripts/pdf-vector-labels.py` and
`schemas/vector-labels.ts`, writing `vector-labels.json` beside `images.json`.
Its own sidecar, not `images.json`: a vector figure has no rectangle to measure
coverage on, no `xref` to dedupe by and no pixel to inspect, so `role` and
`basis` would each have to mean two things.

## What it recovered

| entry | qualifying pages | labels | on a drawing |
|---|---:|---:|---:|
| `9789240010567-eng` DIIG | 44 | 4 071 | 3 145 |
| `9789240081949-eng` | 1 | 124 | 98 |
| `9789240093362-eng` PHC handbook | 15 | 1 926 | 1 424 |
| `9789240120747-eng` SF handbook | 6 | 783 | 574 |
| `9789241509510-eng` MAPS Toolkit | 3 | 251 | 175 |
| `9789241511766-eng` M&E guide | 26 | 1 851 | 899 |
| `who-rhr-1806-eng` | 0 | — | — |

The last row is a **determined** zero: that document contains no `Fig.` or
`Figure` mention at all, checked over its 87 713 extracted characters. A
document with no text layer returns `pages: null` with a reason instead — the
`dh4f` guard, and the one place this arm could have produced a clean run over
an unread scan.

The two right-hand columns are not a coverage and no ratio is computed from
them, which is `m4xy`'s rule carried over: declared figures and recovered
labels are not commensurable.

## Three decisions were made, tested, and REVERSED

Each survives as a test in `scripts/tests/vector-labels.test.ts`, because each
is the kind of simplification a later reader would reasonably reintroduce.

1. **Filter labels by intersection with a drawing.** On `9789240120747-eng`
   page 34 this separates perfectly — 149 of 153 labels intersect, and the four
   that do not are the running head, the page number, the caption and the
   source line. On `9789240010567-eng` page 25, **rendered and checked by eye**,
   it is false for 33 labels of which only three are furniture: it would drop
   `SILOED`, `MUD`, `INTEGRATED`, `EXCHANGED`, every line of their glosses, both
   axis labels and the legend, because those sit in the white space BETWEEN the
   drawn boxes. `intersectsDrawing` is now recorded and never filtered on.
2. **Use MuPDF's block as the label.** One block on that page holds six circled
   numerals spread over 200 pt across three different architecture diagrams;
   another holds `HEALTH USE CASE` and `HEALTH PROGRAMME`, the titles of two
   DIFFERENT architectures, in one rectangle spanning half the figure. The unit
   is the LINE.
3. **Qualify a page on `Fig. N.` + space, as `declaredFigureCaptions` does.**
   That dropped 14 of `9789240093362-eng`'s 15 figure pages, whose captions read
   `Fig. 13\t Example decision-support logic matrix` — a tab, no period. The
   match is now loose, and the over-inclusion is chosen: a false positive costs
   a page of prose in the sidecar, a false negative loses a figure's labels
   entirely.

An earlier qualification rule also required a text line to intersect a drawing.
`9789241511766-eng` page 85 — Fig. 4.3, five names around a ring of arrows with
no text touching an arrow — was dropped by it entirely. The table-of-contents
guard that replaced it is a **dot leader**, a typographic fact rather than a
number chosen after seeing the corpus.

## What it deliberately does NOT do

No grouping above the line, no inferred arrows or nesting, no claimed reading
order (labels are sorted top edge then left edge, in the visible frame after
rotation), and no state in `check-l1-complete` is changed by it — the arm
appends a sentence to `image-descriptions`' detail and nothing more.

## Done when

- [x] a sidecar schema that cannot render could-not-determine as clean
- [x] an extractor, with the three reversals pinned by tests
- [x] sidecars written for all seven `smart-base/library/` entries
- [x] the L1 gate reports what was recovered without grading it
- [ ] an inspector actually describes a figure from its labels — the point of
      the arm, and not yet done for a single figure

