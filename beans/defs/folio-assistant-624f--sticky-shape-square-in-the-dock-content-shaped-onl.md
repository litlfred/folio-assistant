---
# folio-assistant-624f
title: 'STICKY SHAPE: square in the dock, content-shaped only on the glass, and the backdrop scrolls with the overflow'
status: todo
type: feature
priority: normal
created_at: 2026-09-21T19:23:39Z
updated_at: 2026-09-21T19:23:39Z
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
