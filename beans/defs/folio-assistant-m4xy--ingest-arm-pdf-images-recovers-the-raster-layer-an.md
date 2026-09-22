---
# folio-assistant-m4xy
title: 'INGEST ARM: pdf-images recovers the raster layer, and WHO''s real figures are vector'
status: todo
type: task
priority: normal
created_at: 2026-09-22T08:48:53Z
updated_at: 2026-09-22T08:51:51Z
parent: folio-assistant-2yyh
---

Measured 2026-09-22 while describing the figures of the WHO digital-health corpus (issue #877, bean `3gef`).

## The finding

`pdf-images.py` recovers the **raster** layer of a PDF. In WHO typesetting the conceptual figures — frameworks, maturity models, taxonomies, process flows — are drawn as **vector** text and shapes, so they are not extracted at all. What IS extracted is furniture, and on one document it is mostly noise.

Measured over four described entries:

| entry | extracted "figures" | what they actually are |
|---|---|---|
| `9789240081949-eng` (Classification v2.0) | 10 | 2 WHO logos, 6 QR codes, 1 ISBN barcode, 1 image of 8×2 px |
| `9789240093362-eng` (PHC handbook) | 9 | 1 solid-white 266×118 image, 1 HRP logo, 6 covers of OTHER publications, 1 ISBN barcode |
| `9789240010567-eng` (DIIG) | 17 | 1 portrait photograph, 7 repeats of one logo, 1 screenshot, 5 component logos, 1 barcode, 2 indeterminate |
| `9789241511766-eng` (M&E guide) | 99 | **70 sub-35px fragments of the single title page**, 28 body images, 1 barcode |

## The two sharpest cases

**DIIG page 92.** Five images were extracted — the OpenHIM, iHRIS, OpenHIE, RapidPro and mHero logos. *Fig. 5.6.2, "How mHero integrates digital health interventions using standards"*, is the diagram those logos sit inside, and it was not extracted. **The parts came through and the figure did not.**

**M&E guide page 1.** Seventy-one images were extracted from one title page. Seventy of them are 8–35 px on a side and render blank or near-uniform at that resolution — fragments of stylized title text, individually meaningless. Meanwhile two images on pages 57 and 107 are 3-pixel-wide colour slivers where the surrounding text refers to numbered figures (Figure 3.1 and a chapter 5 figure) that were never captured as raster at all.

So on that document **70% of the "describable figures" carry no recoverable content**, every one of them obliges a narrative, and the honest narrative is "could not be determined from the extracted image" — which occupies a slot that reads, downstream, as a described figure.

## Why this is a finding and not a defect in those entries

The arm did what it says: it placed every raster image, gave each a role with a geometric basis, and refused nothing silently. `images.json` for the two figureless handbooks reads `0 placed images (determined: this document places none)`, which is a determined empty and correct.

The gap is between what `image-descriptions` promises a reader — every describable figure has a narrative — and what it can deliver, because the figures a reader most needs are invisible to the arm that finds them. An entry can therefore be L1-complete and still leave its frameworks undescribed, and **nothing in the output says so**. That is the shape this repository keeps paying for: a check that passes over a subject it never saw.

## The role threshold is the smaller half of it

Role assignment is geometric, and an 8×2 px image with `coverage: 0.011` is classified `figure`. At the small end this is over-inclusive in a way that is now measured rather than suspected: it generated 70 obligatory narratives on one document that no reader will ever want.

## Deliberately NOT acted on

No rung was changed and no threshold was moved. The owner's standing rule is that speculative code changes need explicit consent, and a threshold picked to make this corpus look tidy is exactly a number chosen after seeing the answer. What a fix would need first:

- the MAPS Toolkit's 161 — a fifth regime, and the largest
- whether a vector-figure arm is wanted at all, or whether the page text beside a figure is the better handle
- who decides that a page region IS a figure, given `6xaz`'s rule that an inferred structure is refused rather than guessed — the same argument applies to inferring a figure's bounding box, and it is the reason this is not a five-minute fix

## Done when
- [ ] the pattern is checked across all seven entries rather than four
- [ ] the owner has said whether a vector-figure arm is wanted
- [ ] the role threshold is decided on a stated basis rather than on this corpus
- [ ] `image-descriptions` either covers vector figures or SAYS it does not, rather than passing silently
