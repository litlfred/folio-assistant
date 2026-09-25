---
# folio-assistant-624f
title: 'STICKY SHAPE: square in the dock, content-shaped only on the glass, and the backdrop scrolls with the overflow'
status: completed
type: feature
priority: normal
created_at: 2026-09-21T19:23:39Z
updated_at: 2026-09-23T10:49:00Z
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

## Progress, 2026-09-22 — two of the four halves, and a correction

Both SHAPE rules are in. The BACKDROP half is not, and the reason is a
standing owner ruling this bean's "open before building" did not account
for.

### 1 and 4 — shape is now a function of WHERE

`.fa-sticky-cell`, `.fa-sticky-panel` and `.fa-sticky-board` square a
docked sticky; `.fa-sticky-floating` clears the ratio so a card on the
glass is shaped to its content.

**SQUARE BY RULE, art from the card crop, and they are different things.**
This bean asks whether a docked sticky is "simply always the `card` crop,
which would make this almost free". MEASURED: the card crop is square on
3 of 3 stickies in `_data/stickies.json` — so it would work today. Three is
the whole corpus, and `ThemeGeometrySchema` does not REQUIRE a card aspect
of 1. So the shape is written as `1` rather than read from
`--fa-aspect-card`: a theme declaring a non-square card still docks square.
Reading the declaration would make the rule true only for the three themes
somebody measured, which is `hfkl`.

The TEXT REGION still comes from the card crop, because that region is a
fraction of the art and the art is unchanged. Only the box's ratio is
overridden, and by `aspect-ratio` directly rather than the custom property
— so the two breakpoint aliases cannot quietly un-square the dock. That is
asserted at 1280, 700 and 400px rather than argued.

**A tolerance that is the claim rather than slack in it.** `toBe(1)` failed
at the two narrow widths with a measured 1.01 — a box like 396 x 392, which
is `aspect-ratio: 1` honoured and then laid out on a device pixel grid.
Square means square to within a pixel; 0.05 is two orders tighter than the
1.7758 being overridden, so a crop leaking through still fails loudly.

### 2 and 3 — the backdrop, NOT built, and why

This bean's open question offers two readings of *"background will scrll
accoringing"*: the art translates with the text, or the art is taller and
both scroll at one rate. I was about to take a third — the art as the
scrolling surface's background at `background-size: cover` — and the corpus
refused it.

`docs-ui.css` carries an explicit ruling on this exact element:

> `contain`, so the WHOLE artwork is visible rather than a crop of it. This
> was `cover` […] the owner, looking at it: "show full sticky image, not
> cropped."

So `cover` is already tried and already rejected. And with `contain` both
remaining readings have a cost the bean's gloss — *"so the words stay in
the cloud as you scroll"* — cannot escape: an uncropped, unrepeated,
undistorted artwork is a FIXED amount of picture, so words scrolled past it
leave it. The gloss is the bean author's interpretation; the owner's words
are only that the background scrolls accordingly.

Left for the owner rather than decided, because every available answer
trades against a ruling they have already made once.

## Owner ruling, 2026-09-23 — "scrolls with text"

The four readings were put to the owner: scroll together; keep the art still (close with no change); repeat the art; stretch it. They chose **"Scrolls with text"**:

> Picture and words move together as one surface. The picture stays whole, and text past its end continues on the plain theme colour.

That resolves the conflict this bean recorded. It keeps the earlier *"show full sticky image, not cropped"* ruling (`object-fit: contain` is unchanged) and accepts its consequence: whole, unrepeated art is a fixed amount of picture.

## Built 2026-09-23 — 2 and 3, the backdrop half

- **The CARD is the scroller, not the text box.** For a docked fixed sticky (`.fa-landing-sticky--fixed:not(.fa-sticky-floating)`), the card scrolls. The text box grows to its content (`min-height` is the declared cloud, so a short note still sits where the art put it). The `<picture>` and scrim are absolutely positioned against the card's scroll origin, so they move with the content.
- **The picture stays whole:** one square, `contain`. A long note continues below it on `.fa-sticky`'s themed surface.
- **On the glass nothing changes.** A floating sticky is shaped to its content, so it has nothing to overrun.

### Verified

- `sticky-shape.e2e.ts` has 5 new specs:
  - the card scrolls and the text box does not
  - art and words move by the SAME 120px
  - the picture is one square, `contain`
  - a short note does not scroll and starts at its declared cloud
  - the glass is excluded
- Removing the rule fails the two core specs.
- A screenshot with the real engineer card art confirms the picture moves with the text, and the note continues on the cream theme colour.
- Full e2e 533/533. Gates 135/135.

## Summary of Changes

All four halves are done: 1 and 4 (shape by place) on 2026-09-22, and 2 and 3 (the backdrop scrolls with the words, the owner's chosen reading) here.
