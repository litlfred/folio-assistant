---
# folio-assistant-624f
title: 'STICKY SHAPE: square in the dock, content-shaped only on the glass, and the backdrop scrolls with the overflow'
status: in-progress
type: feature
priority: normal
created_at: 2026-09-21T19:23:39Z
updated_at: 2026-09-22T11:51:20Z
parent: folio-assistant-6lb8
---

Owner, 2026-09-21, verbatim:

> when sitckes are square, and they ahould always be in the docker/panel, then
> if the content shape is not square and overruns, then you can scroll contents
> and background will scrll accoringing with mobile or laptop layout (dependeing
> on content layout/shape).
>
> they are only onsquare to fit contents when the pop to the window/glass

## What it says

1. IN THE DOCK/PANEL a sticky is ALWAYS SQUARE. Not 'square unless the content
   is long' — square, full stop. That is what makes a panel of them a uniform
   rack rather than a ragged column.
2. WHEN THE CONTENT DOES NOT FIT the square, the sticky SCROLLS rather than
   growing or clipping, and THE BACKDROP ART SCROLLS WITH IT — so the words
   stay in the cloud as you scroll, instead of sliding off a fixed picture.
3. WHICH LAYOUT the scroll follows is decided by the CONTENT's shape (mobile
   vs laptop crop), not by the viewport alone.
4. ONLY ON THE GLASS is a sticky non-square, and then it is shaped TO ITS
   CONTENT.

So shape is a function of WHERE THE STICKY IS, which is a new rule: today the
shape is a function of the sticky's declared crop and nothing else.

## Against what is already there

landing.html currently pins a FIXED aspect from the chosen crop —
'--fa-sticky-aspect' aliased per breakpoint to --fa-aspect-laptop/mobile/card,
with 'data-fa-shape' telling the stylesheet which is the default. That machinery
already knows how to switch aspect at a breakpoint, and the owner's 2026-09-20
ruling that a sticky is a FIXED SHAPE is not being reversed — what is being
added is that the fixed shape is SQUARE while docked and the content's while
floating.

The overflow half is PARTLY there and was designed for exactly this: that file
records 'the text box SCROLLS rather than spilling, so overflow is visible
instead of quiet'. What is NOT there is the backdrop scrolling WITH the text —
today the art is a <picture> behind a scrolling box, so the words would slide
over a stationary cat.

## Open before building

- Does 'background scrolls with it' mean the art translates with the text (one
  scrolling surface), or that the art is TALLER and both scroll at the same
  rate? The second is cheap and the first needs the art to tile or stretch.
- A square crop already exists in the three declared layouts ('card'). Is the
  docked sticky simply always the 'card' crop, which would make this almost
  free? Check schemas/theme.ts before designing anything new.

## Round 1 — the SQUARE half is built; the SCROLL half is measured and is not

### Both "open before building" questions, answered by measurement

**"Is the docked sticky simply always the `card` crop, which would make this
almost free?"** — **Yes, and more so than asked.** `card` is declared
1254x1254, exactly square, and `buildBackdrop` ALREADY picks
`art.card || art.mobile || art.laptop`. The square art was being served the
whole time; only the lock was missing.

**"Does the background scroll with it, or is the art taller?"** — Neither, as
posed. `background-attachment: local` was the obvious one-property answer and
is not available: the art is deliberately a `<picture>` because *"a background
can only name one crop"*. The intended shape is one scrolling surface with the
`<picture>` inside it.

### It is the TODO sticky, not the landing sticky

The first draft of the rule was aimed at `.fa-landing-sticky--fixed` — the
object with the shape machinery — and was wrong:

| | crop served | aspect-locked | floats to the glass |
|---|---|---|---|
| landing sticky | declared crop (laptop above 48rem) | yes | **never** |
| todo sticky | `card` already | no | **yes** |

`fa-sticky-floating` is added only by the todo board's `float()`, and
`fa-landing-sticky` appears nowhere in `docs-ui.js`. Locking the landing
sticky to the card aspect while `<picture>` serves the laptop file would have
letterboxed the art under the CARD crop's cloud coordinates — the failure the
stylesheet's own comment records.

### Two measurements the rule would have shipped wrong without

**`content-box` makes the square the wrong box.** `aspect-ratio` squares the
CONTENT, then padding and the 5px priority stripe are added on top: content
288.4x288.4 renders as a **320x313** card. Seven pixels looks like a rounding
artefact and is the stripe. `box-sizing: border-box`, scoped to the rule.

**`aspect-ratio` is a preferred size, not a cap.** With 60 paragraphs injected
the card did not scroll — it simply grew, and the "always square" spec passed
only because this file's sticky is two lines long. `min-height: 0` is what
makes the ratio hold, so the square and the scroll are ONE mechanism rather
than two lines that happen to sit together.

## NOT BUILT: the art does not yet scroll with the words

Measured on the themed fixture with the square lock in place:
`clientHeight === scrollHeight === 318` with the card at 320. **The card does
not scroll at all**, so there is nothing for the art to move with.

The overflow is absorbed before it reaches the card. `.fa-sticky-body` carries
no `overflow` rule, and the `qefk` drawer is about controls rather than text,
so the remaining candidate is the text box being positioned against the art
the way the landing sticky's is — which puts this in the `--fa-tx/ty/tw/th`
text-region machinery rather than in a scroll property.

**That is a bigger change than this bean's "almost free" framing and it is not
started.** The spec for it was written and then REMOVED rather than left
skipped: a `test.skip` that fires because the fixture never overflows reads as
coverage and is not. Requirement 2 is outstanding with the measurement above
to start from.

## Done when

- [x] a docked sticky with art is square, at every width
- [x] a floating sticky is shaped to its content
- [x] a sticky with no art is untouched
- [ ] the art and the words scroll as one surface
