---
# folio-assistant-j820
title: 'PDF EXTRACTOR FRAGMENTS A COMPOSITE FIGURE: 383 placed images against 7 captioned figures, 335 from one page'
status: todo
type: bug
priority: normal
created_at: 2026-09-23T21:14:17Z
updated_at: 2026-09-23T21:15:20Z
parent: folio-assistant-slw1
---

Found 2026-09-23 while ingesting arXiv:2510.21603v1 (bean `ctp3`). Split out
rather than worked around, because routing around it would have meant writing 383
image descriptions from nothing.

## Measured

| | |
|---|---|
| document | `arxiv-2510.21603v1` (Dong et al., Doc-Researcher), staged, **not promoted** |
| captioned figures in the text | **7** |
| images `pdf-images.py` placed | **383** |
| from page 3 alone | **335** |
| shape of those 335 | many byte-identical in size |

Page 3 carries the paper's composite architecture diagram. The extractor placed
each of its constituent drawing objects as a separate image, so the count is not
"335 figures" but one figure in 335 pieces.

## Why this blocks promotion, and why that is correct

`image-descriptions` is an L1 completeness requirement, and `document-image.ts`'s
inspection basis exists so that a description is grounded in something an inspector
actually looked at. A description of a fragment of a composite is a description of
nothing a reader will ever see — writing 383 of them is fabrication at scale, which
is the failure the requirement is there to prevent. The gate is doing its job; the
extractor is producing a subject the gate cannot honestly clear.

## What this is NOT

- **Not `xeg6`.** That was `2602.12670v4`: 7 images, all genuinely figures, all
  below `CAPTURE_CHROME_THRESHOLD`, and the finding was that a coverage bound
  would misclassify three of them. Here the count itself is wrong before any
  threshold is applied.
- **Not `r8br`.** That is browser-print nav icons — chrome mistaken for content.
  These are content, fragmented.

The three are siblings under `slw1` and each needs its own answer.

## Open, and NOT decided here

Whether the fix is at extraction (merge drawing objects that share a page region
into one placed image) or at classification (a `fragment` verdict that
`image-descriptions` does not require a description for) is a real design choice
with a real trade-off, and picking one from a single document is picking from one
data point. Measure across the staged corpus first: how many other documents have
a page whose image count is an order of magnitude above its caption count?

## Done when

- [ ] the fragment/composite ratio is measured across every staged document, not
      just this one
- [ ] extraction-side vs classification-side is decided with the owner, on that
      measurement
- [ ] `arxiv-2510.21603v1` either promotes, or carries a recorded reason it cannot
