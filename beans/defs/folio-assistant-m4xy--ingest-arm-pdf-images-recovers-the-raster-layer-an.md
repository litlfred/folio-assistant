---
# folio-assistant-m4xy
title: 'INGEST ARM: pdf-images recovers the raster layer, and WHO''s real figures are vector'
status: todo
type: task
priority: normal
created_at: 2026-09-22T08:48:53Z
updated_at: 2026-09-22T08:48:53Z
parent: folio-assistant-2yyh
---

Measured 2026-09-22 while describing the figures of the WHO digital-health corpus (issue #877, bean `3gef`).

## The finding

`pdf-images.py` recovers the **raster** layer of a PDF. In WHO typesetting the conceptual figures — frameworks, maturity models, taxonomies, process flows — are drawn as **vector** text and shapes, so they are not extracted at all. What IS extracted is furniture.

Measured over the two entries described so far:

| entry | extracted "figures" | what they actually are |
|---|---|---|
| `9789240081949-eng` (Classification v2.0) | 10 | 2 WHO logos, 6 QR codes, 1 ISBN barcode, 1 image of 8x2 pixels |
| `9789240010567-eng` (DIIG) | 17 | 1 portrait photograph, 1 decorative graphic, 7 repeats of one "Principles for Digital Development" logo, 1 Digital Health Atlas screenshot, 5 component logos, 1 ISBN barcode, 1 indeterminate icon |

The sharpest case is DIIG page 92. Five images were extracted — the OpenHIM, iHRIS, OpenHIE, RapidPro and mHero logos. **Fig. 5.6.2, "How mHero integrates digital health interventions using standards", is the diagram those logos sit inside, and it was not extracted.** The parts came through and the figure did not.

## Why this is a finding and not a defect in those entries

The arm did what it says: it placed every raster image, gave each a role with a geometric basis, and refused nothing silently. `images.json` for the two figureless handbooks reads `0 placed images (determined: this document places none)`, which is a determined empty and correct.

The gap is between what `image-descriptions` promises a reader — every describable figure has a narrative — and what it can deliver, because the figures a reader most needs are invisible to the arm that finds them. An entry can therefore be L1-complete and still leave its frameworks undescribed, and **nothing in the output says so**. That is the shape this repository keeps paying for: a check that passes over a subject it never saw.

## A second, smaller observation

Role assignment is geometric, and an image of 8x2 pixels with `coverage: 0.011` is classified `figure`. That is over-inclusive at the small end: it obliges a narrative for something with no recoverable content, and the honest output is then "could not be determined from the extracted image" — true, but it occupies a slot that reads as a described figure.

## Deliberately NOT acted on

No rung was changed. Changing an extraction strategy on the strength of two documents is speculation, and the owner's standing rule is that speculative code changes need explicit consent. What a fix would need first:

- whether the pattern holds across the other five entries (the MAPS Toolkit alone has 161 extracted images, which is a different regime and may say something different)
- whether a vector-figure arm is wanted at all, or whether the page text beside a figure is the better handle
- who decides that a page region IS a figure, given `6xaz`'s rule that an inferred structure is refused rather than guessed — the same argument applies to inferring a figure's bounding box

## Done when
- [ ] the pattern is checked across all seven entries rather than two
- [ ] the owner has said whether a vector-figure arm is wanted
- [ ] `image-descriptions` either covers vector figures or SAYS it does not, rather than passing silently
