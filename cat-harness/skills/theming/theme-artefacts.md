---
name: theme-artefacts
description: >
  The per-surface SPECIALISATION layer — sticky, landing board, docs
  background, navbar avatar. Only what DIFFERS lives here; the general rule
  lives in its stage. Read this last, after the stage that owns your question.
---

# Per-artefact specialisation

**This is level 3 of the axis, and it is deliberately the narrowest.** The
general rule lives in its stage — `intake`, `declaration`, `generation`,
`contrast` — and an artefact carries only its difference. Going artefact-first
would duplicate intake and contrast into every surface, which is the shape that
let the scrim rule be rediscovered rather than read.

The avatar crop boxes are the worked example: the **rule** that a crop is
declared data belongs to `theme-declaration`; the **boxes themselves** are
navbar-avatar specialisation, and they are below.

## The surfaces

| artefact | what differs | where |
|---|---|---|
| **sticky** | the container sizes to its CONTENT, so a text region would reimpose the geometry the sticky removes | `schemas/landing-sticky.ts`, `.fa-sticky` |
| **landing board** | text is composited INTO the art, so it needs `textRegion` per layout and a crop chosen by content shape | `docs/_includes/landing.html` |
| **docs background** | the page ground, not a card — a different CSS surface and probably a different crop set | not built; bean `yj32` |
| **navbar avatar** | the art CLIPPED to the subject in a square frame — `avatarRegion` | `<name>.json`, `bun run avatar:crops` |

## Sticky: art backs it, text does not sit IN it

**Most sticky-backing art carries no `textRegion` on purpose.** A sticky is a
container that sizes to its content; a region would fit the text into a cloud
interior, which is the geometry the sticky exists to remove. The three
`landing-*.webp` entries keep theirs because the composited landing path still
uses them.

**A floating sticky keeps its theme.** `.fa-sticky-floating`'s opaque override
is scoped to `:not([data-fa-sticky-theme])`, because the theme is a property of
the sticky and not of the pinned state — bean `ivfw`. That scoping is sound
only while every theme surface is opaque, which is why `theme-declaration`
carries the rule and `themes.test.ts` gates it.

## Landing board: the crop is chosen by CONTENT, then overridden by viewport

The default crop is the one the sticky's content wants — computed from how much
text and how many links the card carries. The narrow-viewport `<source>`s stay
on top of it: **content decides the default and the viewport still overrides**,
which is the right precedence, because the viewport is a hard constraint and
the content shape is a preference.

`<picture>` swaps the FILE at `30rem` and `48rem`, so the card's ratio and the
cloud's position must change at exactly those widths or the words land in the
wrong part of the art. A media query cannot read which `<source>` won, so both
sides are keyed to the same two numbers.

## Navbar avatar: the box is per-image and measured

**The avatar is the card art clipped to the cat's head and torso, not the card
scaled down.** A whole 1:1 card in a 46px frame makes the cat about four pixels
tall and every theme reads as grey mush.

Measured off a 5–10% grid overlay of each card, as fractions `x y w h`:

| card | box |
|---|---|
| `landing-card` (grumpy-cat) | 0.00 0.46 0.50 0.50 |
| `landing-library-card` | 0.14 0.40 0.42 0.42 |
| `landing-bootstrap-card` | 0.27 0.615 0.24 0.24 |
| `landing-operations-card` | 0.17 0.475 0.27 0.27 |
| `landing-engineer-card` | 0.00 0.40 0.46 0.46 |
| `landing-analyst-card` | 0.05 0.48 0.36 0.36 |
| `landing-architecture-card` | 0.00 0.36 0.46 0.46 |

**Only CARD crops carry one.** The avatar is cut from the square crop; a box on
the laptop or mobile art would be measured against a composition the frame
never shows — and it would validate, because squareness is checkable and
relevance is not.

**Two of these were wrong twice, and both times only a render caught it.** The
first pass put the library and analyst boxes on scenery. The operations box was
square, in bounds, and clipped the crown off the hard hat; the owner saw it and
said so. **The schema cannot see a hat.** So:

    bun run avatar:crops     # every declared box, drawn on the card and clipped
    bun run theme:sheet      # every theme: palette, contrast, art, both regions

## Adding a surface

1. Find the stage that owns the general rule and read it.
2. Add **only the difference** here.
3. If the surface renders art behind text, it inherits `theme-contrast`
   unchanged — a measured scrim, AAA over pure black.
4. If it renders art at all, render it and LOOK. Nothing in this section was
   found by reading a diff.

## Related

- [`theming`](theming.md) — which stage owns your question
- [`theme-declaration`](theme-declaration.md) — the rule these specialise
