---
# folio-assistant-nwrm
title: "The @ logo could not theme: six baked colours, two files, and a tone it disagreed with"
status: completed
type: bug
priority: normal
created_at: 2026-09-22T07:30:00Z
updated_at: 2026-09-22T07:30:00Z
parent: folio-assistant-6lb8
---

Owner: *"The \"@\" logo"*, correcting my aim after `sbfb` — which fixed the
generic question-mark TILE, a real but different bug — and *"I want theme like
in avaatars"*.

## What was wrong, measured

`cat-mark.svg` bakes six colour literals (`#6f8b66` sage, `#cfe0c2` pale-sage
ears, `#ffffff` face and whiskers) and is drawn with `<img>`, **which no page
CSS can reach**. Three consequences, none of them visible from the file:

1. **It could not follow the scheme.** The workaround was a SECOND asset,
   `mark-dark`, and a second `<img>` with one hidden by CSS. Two files that
   must agree — precisely what `gen-avatars-css.ts` refuses to ship: *"as
   files they would drift, and the one that fell behind would be invisible
   until somebody opened the site in the other mode."*
2. **It disagreed with its own instance.** `cat-harness` declares tone **268**;
   the mark was sage, ~hue 100. Two colour vocabularies for one instance,
   which is the drift `schemas/theme.ts` exists to have ended.
3. **It failed a contrast bar the declaration itself recorded**: the light ink
   is *"2.60:1 on the dark sidebar — under the 3:1 bar for meaningful non-text
   content."*

**`docs-ui.css` had already recorded the defect AND the decision to defer it**
— *"the mark is fixed sage in both schemes … left as-is deliberately …
recorded here rather than silently corrected."* This closes that deferral
rather than discovering it.

## What shipped

The avatar mechanism, unchanged: a `mask-image` plus a `background-color`
derived from one declared hue. One asset replaces the pair.

    mask on the DARK sidebar  #27262b : 6.11:1   (the sage it replaces: 2.60:1)
    mask on a LIGHT sidebar   #f5f6f7 : 9.31:1

Both colours are **`gen-avatars-css.ts`'s own targets** — `hsl(tone 46% 34%)`
light, `hsl(tone 42% 72%)` dark. Inventing a third pair here would have
removed one colour vocabulary by adding another.

## The cost, chosen by the owner

One colour with cut-outs, over two hand-derived tones. The face and whiskers
were **already cut-outs** in the coloured mark — its own description says the
whiskers are *"cut in white across the sage"*. **The pale-sage EAR step is the
one thing lost**; it flattens into the body.

## The witness, and why it is the hue rather than the picture

The colour now lives in `docs-ui.css` as a literal — and a literal is exactly
what drifted before. So the test asserts the JOIN: the stylesheet's hue must
BE `avatarFor("cat-harness").tone`. Falsified by retoning the avatar to 100;
the witness fails and nothing else does.

## Three mistakes of mine, recorded

**I fixed the wrong surface first.** `sbfb` declared an avatar-table entry for
`folio-assistant` — a genuine bug, the navbar question mark — but not the @
logo. The owner's two words re-aimed it.

**`json.dumps` reformatted the whole declaration**: 85 insertions, 61
deletions on a hand-maintained file full of `_comment` prose. Reverted and
redone as a surgical text insert — 8 insertions, nothing else touched.

**The test failed on my own comment.** It asserts no sage literal survives in
the mask, and the asset's header explains the conversion by NAMING the sage it
replaced. `translation-badges.e2e.ts` records this trap twice, the second time
in the same file: *"Comments stripped, for the second time in this file and
for the same reason."* Third time, different file — and the premise is now
asserted too, so stripping cannot make the case vacuous.

**And I wrote a bean id into three files before the bean existed** — `qk8v`,
which is nobody. Corrected to `nwrm` before pushing. An id that points at
nothing is the `hso8` failure in miniature: *"a key nobody can reach is worse
than a missing one."*

## Summary of Changes

- `docs/assets/img/icons/cat-mark-mask.svg` — the mark as alpha, via an SVG
  `<mask>` because SVG has no erase. Stacking order is `cat-mark.svg`'s own.
- `cat-harness.json` — the asset declared, `role: "mark-mask"`.
- `sync-docs-harness.ts` — `iconMask`, resolved by role like `iconDark`.
- `_includes/title.html` — one masked `<span>` when a mask is declared;
  otherwise the existing pair, because **absent is a real state**.
- `docs-ui.css` — the masked rule, both schemes, with the ratios.
- `scripts/tests/site-mark-mask.test.ts` — the hue join, the generator's
  targets, the declaration, and the cut-outs.

## Done when

- [x] the mark takes the instance's declared tone, both schemes derived
- [x] one asset replaces the light/dark pair
- [x] the dark-sidebar contrast clears the 3:1 bar the declaration recorded it
      failing
- [x] a witness fails if the tone and the stylesheet ever disagree again
- [x] an instance declaring no mask is unaffected

## Not done

**`mark-dark` is left in place, unused by this template.** It is a declared
durable artefact and removing it is the owner's call, not mine —
`deletion-requires-confirmation`. It also remains the fallback for any
instance that declares a dark mark and no mask.

**The FAVICON still cannot theme.** `<link rel="icon">` is an external
resource that page CSS cannot reach, so the mask mechanism does not apply to
it; it keeps `cat-mark.svg`. An SVG favicon can carry its own
`prefers-color-scheme` block, which would follow the OS rather than the
reader's stored choice — a different mechanism, and not this bean's.
