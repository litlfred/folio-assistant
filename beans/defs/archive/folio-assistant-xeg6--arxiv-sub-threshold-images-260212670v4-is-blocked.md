---
# folio-assistant-xeg6
title: 'ARXIV SUB-THRESHOLD IMAGES: 2602.12670v4 is blocked on image-descriptions, and a coverage bound would misclassify 3 of its 7'
status: completed
type: bug
priority: normal
created_at: 2026-09-21T16:24:49Z
updated_at: 2026-09-23T13:55:28Z
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

- [x] The four page-3 icons carry `role: "logo"` on an inspection basis
- [x] The three colourbars carry `role: "figure"` with a real description of
      the scale, not "a coloured bar"
- [x] `2602.12670v4` promotes, and `check:l1-complete` passes over it
- [x] The inspection's attribution names who looked, per `attribution.ts`

## Done 2026-09-23 — and the recorded inspection was wrong twice

Promoted to `agent-skills/library/arxiv-2602.12670v4`, destination derived from
the `source_file` relation rather than the path (all five existing entries
there name a bare `uploads/` filename, both arXiv papers among them) — the
`v1hw` rule that a queue does not determine a library.

**The roles above were right. Two things said about the images were not**, and
both would have shipped as descriptions had the 2026-09-21 record been applied
as written.

### 1. The colourbar direction was backwards

This bean said the scale runs *"blue low to red high"*. It runs the other way.
The bar is labelled **Pass Rate**, `1.0` at the top (dark blue) down to `0.0`
at the bottom (dark crimson) — read off the tick text beside the image, not
guessed from the colours. **Blue is a HIGH pass rate.** A reader given the
original sentence would have read every heatmap in the paper inverted, which
is worse than no description: a missing one is visibly missing.

### 2. `p27` is a DIFFERENT colourbar, not the same one repeated

This bean said *"one diverging blue-white-yellow-red colourbar, repeated on
three consecutive pages"*. Pages 25 and 26 are that bar. **Page 27 is not.**

| | title | range | ramp |
|---|---|---|---|
| p25, p26 | `Pass Rate` | 1.0 top → 0.0 bottom | blue → pale → **yellow** → red |
| p27 | `Delta Pass Rate` | +0.6 top → **white at 0.0** → -0.6 bottom | blue → white → red, **no yellow** |

Signed, centred on zero, different colormap. Describing it as an absolute pass
rate would have been a plain factual error about the figure.

The tell was in the bytes — 5188 vs 5167 for the other two — and the byte size
is the ONE thing this bean did record for all three without noticing they
disagreed.

**And the minus signs are invisible to text extraction.** `get_text` returns
`0.2 0.4 0.6` below the zero with no sign at any codepoint: matplotlib draws
U+2212 as a vector path. They are plainly there when the region is RENDERED.
So the sign of a diverging axis cannot be read from the text layer, and a
verdict that trusted it would have called a -0.6 endpoint +0.6.

### 3. The logos are now named, which is the point of the role

The record described them by appearance — *"a starburst mark, a gradient
chevron, a >_ terminal glyph, a raised-hands emoji"*. `DESCRIBABLE_ROLES`
includes `logo` because **a screen-reader user needs to know WHOSE mark is on
the page**, and appearance alone does not say. Each is now matched to its
label by vertical position in the page-3 harness column, corroborated by the
mark itself:

| id | icon y | label y | harness |
|---|---|---|---|
| `img-p003-4` | 234-248 | 238-245 | OpenHands (raised hands) |
| `img-p003-1` | 249-263 | 252-259 | Claude Code (starburst) |
| `img-p003-3` | 264-278 | 268-274 | Codex CLI (`>_` glyph) |
| `img-p003-2` | 280-294 | 283-290 | Gemini CLI (chevron) |

Two independent signals agree on every row.

## Found: promotion and descriptions are CIRCULAR, not sequential

This bean called itself *"blocked on promotion, not on judgement"* — a one-way
sequencing fact. It is a **cycle**, and that is why seven staged documents sit
on `image-descriptions`:

- `--promote` refuses while `image-descriptions` is unmet (observed);
- the only two writers of a narrative into `images.json` are
  `apply-image-verdicts.ts` and `narratives.ts`, and **both** resolve their
  targets through `directoriesForGraph(root, "library")` — staging is not a
  library, so neither can reach a document that has not been promoted.

Checked against every tool that touches `images.json`; `library-graph.ts` and
`check-image-roles.ts` write nothing.

Broken here for ONE document by calling the tool's own exported `applyTo` on
the staged sidecar, so the bytes are the tool's rather than hand-written. That
is a workaround, not a fix: the next document hits the same wall. **The fix is
not in this bean's scope** and is not taken — see `8suc`.
