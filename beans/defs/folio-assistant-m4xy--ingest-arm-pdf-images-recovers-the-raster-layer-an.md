---
# folio-assistant-m4xy
title: 'INGEST ARM: pdf-images recovers the raster layer, and WHO''s real figures are vector'
status: in-progress
type: task
priority: normal
created_at: 2026-09-22T08:48:53Z
updated_at: 2026-09-24T18:00:36Z
parent: folio-assistant-2yyh
---

Surveyed across all seven entries 2026-09-22 (issue #877). The cheapest of the three candidate fixes has shipped; the other two remain the owner's call.

## The finding

`pdf-images.py` recovers the **raster** layer. WHO's conceptual figures — frameworks, maturity models, taxonomies, process flows — are drawn in **vector**, so they are never extracted. What IS extracted is furniture.

| entry | declared figures | placed `figure` images | plausibly real content |
|---|---:|---:|---:|
| `9789240010567-eng` DIIG | 42 | 17 | 2 |
| `9789240081949-eng` Classification v2.0 | 1 | 10 | 0 |
| `9789240093362-eng` PHC handbook | 18 | 9 | 1 |
| `9789240120747-eng` SF medical products handbook | **6 (+18 tables)** | **0** | **0** |
| `9789241509510-eng` MAPS Toolkit | 4 | 161 | 17 |
| `9789241511766-eng` M&E guide | 28 | 99 | 16 |
| `who-rhr-1806-eng` Classification v1.0 | 0 | 0 | 0 |

Declared-figure counts re-derived independently twice — once by survey, once by the shipped `declaredFigureLabels` — and they agree. "Plausibly real content" is a keyword heuristic over the drafted narratives and is an estimate, not a measurement.

## The case that settled it

`9789240120747-eng` declares six captioned figures — including *"Fig. 3. DIIG digital health enterprise architecture framework"* — and places **zero** raster images. Its `images.json` read `0 placed images (determined: this document places none)`, which is true about raster and misleading about figures. It was one of the two entries that promoted FIRST and cleanest, precisely because it had nothing to describe.

An entry could be L1-complete, gate-green, and missing every figure it declares, with nothing anywhere signalling a gap.

## Summary of Changes — the third state shipped

`check-l1-complete.ts` gains `declaredFigureLabels(sectionsDir)` and `image-descriptions` gains a third outcome:

- **zero images placed AND the text declares figures** → `not-derivable`: *"no raster image was placed, and the text declares at least N captioned figure(s) — they are drawn in vector and no arm reads them (bean m4xy)"*
- **zero images and no declared figures** → `met`, unchanged. `who-rhr-1806-eng` genuinely has neither, and the state must not fire on it or every image-free document reads as gapped.
- **images described, figures also declared** → still `met`, with the detail refusing to claim coverage: *"the text declares at least N captioned figure(s); which of them correspond to placed images is NOT established."*

**`not-derivable` rather than `unmet`, deliberately.** `unmet` would be a permanent blocker no amount of work could clear — the `pn6j` failure, where a gate made every non-paged document un-ingestable. `not-derivable` is reported and does not block promotion, which is what makes it safe to be honest. Verified: the handbook's sidecar now carries `notDerivable` count 2 and `unmet` count 0, and still promotes.

**Counts are never compared.** Declared figures and placed images are not commensurable: MAPS declares 4 and places 162, of which 63 are blank fragments of one title page, so `placed >= declared` would read as "covered" and be wrong in both directions. The number is reported and never graded.

**The caption match is a LOWER BOUND and says so.** A caption is matched only at the start of a line, because a cross-reference ("see Fig. 3.1") runs mid-sentence and carries the same label. That misses an inline caption and counts a line that begins for another reason — stated in the function's own docstring rather than left for a reader to infer from a bare integer.

Five regression tests in `ingest-and-l1.test.ts`, including the one asserting the state is NOT `unmet`.

## Still open — the owner's call

- **Is a vector-figure arm wanted at all**, or is the captioned text beside a figure the better handle? `9789240120747-eng` argues for the latter: its figures are fully described in prose the ingest already holds.
- **The role threshold.** Every image uses `basis.method: "geometry"`, and the only role split ever exercised is `page-scan` vs `figure`, once, at coverage ≈1.0. Pooling all 296 figure coverages there IS one empty stretch — nothing between ≈0.00012 and ≈0.00033, separating 143 near-zero fragments from everything else — and above it the distribution runs continuously for three more orders of magnitude. **No number is proposed**: a threshold chosen after seeing this corpus is a number chosen to fit the answer.

## Done when
- [x] the pattern is checked across all seven entries rather than four
- [x] `image-descriptions` either covers vector figures or SAYS it does not, rather than passing silently
- [ ] the owner has said whether a vector-figure arm is wanted
- [ ] the role threshold is decided on a stated basis rather than on this corpus

## MEASURED 2026-09-24 — this bean's own premise for the caption option is FALSE

Picked up on the owner's instruction to bring these two decisions to a head.
`j820`'s dedup work produced evidence bearing on one of them; measuring the
other falsified a sentence written here.

### The caption does NOT carry the figure's content

This bean says `9789240120747-eng` *"argues for the latter: its figures are
fully described in prose the ingest already holds."* **They are not.** What the
text layer holds beside each caption:

| | |
|---|---|
| Fig. 1 | the caption, then *"Source: Digital implementation investment guide (DIIG) (WHO; 2020)"* and the stray label *"WHO core indicator sets"* |
| Fig. 2 | the caption, then *"Data, evidence and impact Narrative Guideline and data"* |
| Fig. 3 | the caption, then *"SHARED SERVICES DATA SERVICES DATA SOURCES Institution-Based HIS"* |
| Fig. 4 | the caption, then **§4.4 Outline data requirements** — the next section. No description at all |
| Fig. 5, 6 | captions adjacent to each other, with fragments between |

That is a TITLE plus a bag of the figure's own box labels, not a description. A
reader handed *"SHARED SERVICES DATA SERVICES DATA SOURCES Institution-Based
HIS"* cannot tell what the architecture framework says — there are no
relations, no nesting, no arrows.

So *"the captioned text beside a figure is the better handle"* is not a live
option on this evidence. The sentence is left above rather than edited away.

### But the arm is CHEAPER than this bean assumed, because the labels are positioned

Page 34 of `9789240120747-eng`, the Fig. 3 page: **179 vector drawings, 0
raster images, 55 positioned text blocks.** The labels come back from PyMuPDF
with their bounding boxes — *"Digital Health Platform"* as a tall narrow box
(a rotated spine), *"SHARED SERVICES DATA SERVICES DATA SOURCES"* as a header
row at y=129, *"Institution-Based HIS"* at y=148, *"Population-Based HIS"* at
y=302.

**No OCR and no VLM are needed.** The text and its geometry are already
available; what is missing is only the ASSEMBLY — grouping labels by region
and relating them to the drawing primitives.

### The scale, across all seven entries

Caption-bearing pages, by what the page actually holds. Vector-only means
≥20 drawing primitives and zero raster images; labels-recoverable means that
page also carries ≥10 positioned text blocks.

| document | caption pages | vector-only | with raster | labels recoverable |
|---|---:|---:|---:|---:|
| `9789240010567-eng` DIIG | 49 | **48** | 1 | 46 |
| `9789241511766-eng` M&E | 28 | 11 | 6 | 11 |
| `9789240120747-eng` SF handbook | 5 | 5 | 0 | 5 |
| `9789241509510-eng` MAPS | 3 | 3 | 0 | 3 |
| `9789240081949-eng` Classification | 1 | 1 | 0 | 1 |
| `9789240093362-eng` PHC | 1 | 1 | 0 | 1 |
| `who-rhr-1806-eng` | 0 | 0 | 0 | 0 |
| **total** | **87** | **69** | **7** | **67** |

**69 of 87 caption pages hold a figure the raster arm cannot see, and 67 of
those have their labels sitting there with geometry.** The gap is the norm, not
the exception — which this bean could not have known, because it counted
placed images rather than looking at what the pages hold.

The caption count is the same LOWER BOUND `declaredFigureLabels` documents:
matched at line start, so an inline caption is missed. It is used here only to
find candidate pages, never compared to an image count.

### The role threshold: the evidence now argues AGAINST picking a number

`j820`, measured across 29 documents in 5 libraries. This bean's instinct —
*"a threshold chosen after seeing this corpus is a number chosen to fit the
answer"* — is now measured rather than suspected:

- **Per-image coverage does not separate the classes at all.** Split by whether
  a page is crowded (≥20 images): crowded 2.70e-05..6.03e-01, uncrowded
  2.80e-05..5.04e-01. Every uncrowded image sits below the highest crowded one.
- **This bean's own gap is real and corpus-specific.** Rechecked against the
  same 296 images: ≈0.00012..0.00033 is genuinely empty. But the 469
  figure-role images OUTSIDE `smart-base/` have a minimum of **1.81e-04**,
  above the gap entirely — so a threshold placed there is inert on every
  non-WHO document, including the two with the worst duplication.
- Three other geometric rules were tried and failed; `j820` tabulates them.

So the honest answer to the second question is that **no number should be
proposed**, and the mechanism that should carry these calls is the one that
already exists: `apply-image-verdicts`, an `inspection` basis naming who looked.

## Done when
- [x] the pattern is checked across all seven entries rather than four
- [x] `image-descriptions` either covers vector figures or SAYS it does not
- [x] the caption-as-handle option is tested rather than assumed — it fails
- [x] the arm's real cost is measured — no OCR, no VLM, assembly only
- [x] the role threshold has evidence — and it argues against a number
- [ ] the owner rules on whether to build the assembly step
