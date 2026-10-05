---
# folio-assistant-a8wy
title: 'VECTOR FIGURE ARM: extract positioned labels from vector-only figures — 69 of 87 caption pages'
status: in-progress
type: task
priority: normal
created_at: 2026-09-24T18:04:22Z
updated_at: 2026-09-30T00:48:55Z
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
- [x] an inspector describes a figure from its labels — done once, 2026-09-30,
      and the result is below: the labels are sufficient for the NOUNS and
      insufficient for the RELATIONS, demonstrated rather than asserted
- [x] **owner ruled 2026-09-30: a third sidecar.**
      `<library>/figure-descriptions.json`, `folio-figure-descriptions/v1`,
      beside `image-verdicts.json` and standing to `vector-labels.json`
      exactly as the verdicts file stands to `images.json`. Schema, registry
      entry, ten tests, and the Annif Figure 2 description written into it.



## Claim released 2026-09-29

Released `in-progress` → `todo` on the owner's instruction (review session https://claude.ai/code/session_014Qj8wncQhqV52QGN1yZDnj). No git change to this bean since before 2026-09-26, no holder recorded, and no open branch touches it; the sessions that held theme D (content folios, SMART/FHIR stack, ingest) work stopped on the 2026-09-25 weekly usage limit. Nothing in the body was changed: re-claim with `bun run beans:claim <id>`.

_2026-09-30T00:48:51Z_ — Claimed by claude/magical-dijkstra-19yvml — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

## 2026-09-30 — the arm used in anger, once, on a real figure

Subject: `arxiv-2504.19675v2` (Annif at SemEval-2025), page 3, **Figure 2:
"Overview of Annif projects and how they were combined into ensembles."** One
of the four figures in that paper whose caption carries no descriptive text,
so the owner's caption handle does not reach it — the exact case `m4xy` names.

**Step 1, describe from the sidecar alone.** 13 of the page's 110 labels
intersect a drawing, and on this page that separation is clean — the other 97
are two columns of body prose. The 13:

| x | text |
|---:|---|
| 313 / 333 / 445 / 498 | `runs` · `ensemble/fusion projects` · `regular projects` · `trained on` |
| 312 / 338 / 455 | `1,2,3` · `BM simple ensemble` · `Bonsai` |
| 312 / 338 / 455 | `4,5,6` · `BM neural ensemble` · `MLLM` |
| 312 / 336 / 447 | `7,8,9` · `BMX simple ensemble` · `XTransformer` |

Read as a table, that says three ensembles each paired with one base project.

**Step 2, render the region and look.** It is wrong, and wrong on every row.
The dashed arrows CROSS: BM simple → Bonsai *and* MLLM; BM neural → Bonsai
*and* MLLM; BMX simple → Bonsai, MLLM *and* XTransformer. The paper's own text
says exactly that — *"two 'BM' ensembles (simple and neural) combining Bonsai
and MLLM, and a 'BMX' simple ensemble that combines all three"* — so the
labels-only reading contradicts the prose, and the row alignment is a layout
accident rather than a relation.

**And a whole column is invisible to the arm.** `trained on` is filled with
cylinder glyphs — four beside Bonsai, one beside MLLM, one beside
XTransformer, plus a stray one inside the BM neural box. No text, so no
labels. A reader of the sidecar alone would not know the column has content
at all, only that it has a heading.

## What this settles

**The arm delivers the nouns and refuses the relations, and that refusal is
load-bearing rather than a shortfall.** Every proper name, number and heading
in the figure came out of the sidecar exactly right; the arrows, the
multiplicities and the glyph column did not, and the schema says in advance
that they would not. A description written from labels alone is safe as an
INVENTORY and unsafe as an ACCOUNT.

So the inspector's rule, demonstrated: **labels first, render second, and the
render is not optional for anything with an arrow in it.** That is the same
conclusion `library-ingestion` §"Reading a figure: the text layer is not the
figure" reached for raster figures via the `xeg6` sign error, arrived at
independently one layer over.

**`intersectsDrawing` earned its keep here and must still not become a
filter.** 13 of 110 on this page is a clean cut; on `9789240010567-eng` p25 the
same test is false for 30 labels that are plainly figure content. Two pages,
opposite verdicts, which is why it is recorded and never applied.

## The sidecar, and the field that justifies it

`schemas/figure-description.ts`, one file per LIBRARY (keyed by doc id), the
same shape and placement as `image-verdicts.json`:

| | measurement, machine-derived | judgement, someone looked |
|---|---|---|
| raster | `<entry>/images.json` | `<library>/image-verdicts.json` |
| vector | `<entry>/vector-labels.json` | `<library>/figure-descriptions.json` |

**`basis` is required and closed** — `labels-only` or `labels-and-render`, no
default and no third value — and it is the whole reason this is a schema
rather than a convention. The worked case above is what it encodes: a
labels-only reading of Annif's Figure 2 got every proper name right and every
relation wrong. A reader must be able to tell which kind of description they
are holding without re-deriving it.

**`unread` is required at `labels-only`.** At that basis there is always
something invisible — arrows, nesting, glyph-only columns — and saying nothing
about it reads as its absence. At `labels-and-render` an empty gap list is a
real finding rather than an omission, so the field is optional there.

The first entry is deliberately recorded at `labels-and-render` **with its
labels-only reading preserved in `unread`**, because the gap between the two
is the finding rather than a draft to be tidied away.

`NarrativeSchema` is reused unchanged: an agent writes `draft`, only a human
confirms, and `confirmed_by.kind` must be `"human"` structurally.
