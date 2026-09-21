---
# folio-assistant-xeg6
title: 'ARXIV SUB-THRESHOLD IMAGES: 2602.12670v4 is blocked on image-descriptions, and a coverage bound would misclassify 3 of its 7'
status: todo
type: bug
priority: normal
created_at: 2026-09-21T16:24:49Z
updated_at: 2026-09-21T16:24:49Z
parent: folio-assistant-slw1
---

Split out of bean `r8br` / issue #722 on 2026-09-21, which deliberately left
its promotion box unticked because of this document.

`2602.12670v4` is one of the seven staged documents blocked on
`image-descriptions`. It is **not** a browser print, so the capture rung
`r8br` added does not reach it and was never going to.

## Measured 2026-09-21

| | |
|---|---|
| producer / creator | `pikepdf 8.15.1` / `arXiv GenPDF (tex2pdf:a6404ea)` |
| `is_capture_print` | **false** — correctly, on both signals |
| pages / placed images | 42 / **7**, all currently `figure` |
| coverages | 0.000395, 0.000402, 0.000404, 0.000404, 0.00684, 0.00684, 0.00684 |
| below `CAPTURE_CHROME_THRESHOLD` (0.02) | **7 of 7** |

## The finding that matters: a coverage bound would get three of these WRONG

Extracted and INSPECTED all seven rather than inferring from geometry:

| where | size | what it is | role |
|---|---|---|---|
| p3 ×4 | 280x280 | rounded-square app icons — a starburst mark, a gradient chevron, a `>_` terminal glyph, a raised-hands emoji | `logo` |
| p25, p26, p27 | 114x2267 | one **diverging blue-white-yellow-red colourbar**, repeated on three consecutive pages — the legend for a heatmap | `figure` |

The three colourbars are CONTENT. A reader needs to know the scale runs blue
low to red high through a pale midpoint; that is the difference between a
heatmap you can read and one you cannot. They sit at 0.00684 — comfortably
inside any "decorative" bound somebody would pick from the browser-print data.

**So this document is direct evidence for the choice `r8br` made.** The owner
picked a capture-scoped rule over a global coverage threshold; under the global
option all seven of these would have been swept to `chrome`/`decorative` and
three real colourbars would have lost their descriptions silently. That is the
"being wrong HIGH is the expensive direction" case, occurring in the very next
document.

## What this needs

Not a rung. **Inspection** — which is what `InspectionBasisSchema` exists for,
and which geometry provably cannot substitute for here. The four logos take
short factual descriptions (`logo` is in `DESCRIBABLE_ROLES` precisely because
a screen-reader user still needs to know whose mark is on the page); the three
colourbars take one real description, reused.

The inspection above is DONE and recorded here, so whoever promotes the
document can apply it rather than re-deriving it.

## Blocked on promotion, not on judgement

`apply-image-verdicts.ts` writes into a library entry's `images.json`, and
`2602.12670v4` is not promoted — it sits in `uploads/` with
`agent-skills/library/` holding only the two arXiv papers that passed. So the
verdicts cannot be applied from here. That is a sequencing fact, not a missing
decision.

## Done when

- [ ] The four page-3 icons carry `role: "logo"` on an inspection basis
- [ ] The three colourbars carry `role: "figure"` with a real description of
      the scale, not "a coloured bar"
- [ ] `2602.12670v4` promotes, and `check:l1-complete` passes over it
- [ ] The inspection's attribution names who looked, per `attribution.ts`
