---
# folio-assistant-qttr
title: 'Relationship diagram: a layer has no width budget, so 12 of 67 modules render illegibly'
status: completed
type: task
created_at: 2026-09-21T05:51:49Z
updated_at: 2026-09-21T05:51:49Z
parent: folio-assistant-vke6
---



Found while opening `whbf` (the dynamic half), by measuring the static half
rather than taking its premise. `whbf` assumes the picture is right and
interaction is what is missing. It is not.

## The measurement

Playwright against the committed `cat-harness` schema viewer at a 1280px
viewport, reading each module's `viewBox` against the SVG's actual CSS width.
All 67 modules, worst first:

| module | viewBox W | H | rendered | scale | effective glyph |
|---|---|---|---|---|---|
| `dak-blocks.ts` | 5476 | 692 | 1248 | 0.228 | **1.60px** |
| `theme.ts` | 4735 | 463 | 1248 | 0.264 | 1.84px |
| `cat-harness.ts` | 4189 | 831 | 1248 | 0.298 | 2.09px |
| `kg-node.ts` | 2529 | 662 | 1248 | 0.493 | 3.45px |

**12 of 67** fall below a 5px effective glyph width, which is not cramped but
illegible. A 10px font at 0.228 scale is 2.3px tall.

## The shape of the failure IS the diagnosis

W is 2–8x H in every bad case. `diaLayout` places each layer in exactly ONE
row:

```js
L.keys.forEach(function (ky) { var row = L.rows[ky]; ... });
```

so width grows linearly with the widest layer while height stays bounded by
the layer count. There is no width budget anywhere in the layout, and the
`viewBox` then scales the whole thing down to fit — silently, because an SVG
that does not fit does not complain.

## Why this is the static half's bug, not `whbf`

Wrapping a too-wide layer onto several rows fixes it with NO interaction: the
result is still reproducible, still printable, still a screenshot somebody can
paste into an issue. Zoom and pan would also make it readable, but only for a
reader who is there to drive it, and the panel's whole point is the picture
you get for free on opening it.

The two are not alternatives — wrapping is the floor, and `whbf`'s zoom/pan
sits on top for the cases wrapping cannot reach.

A box is at most 34 chars wide (`34 * CH + PAD * 2` = 258px), so a width budget
can always be met; there is no case where one box alone overflows.

## Done when

- [x] a layer wider than the budget wraps onto further rows, staying in its
      own band so layer-as-depth still reads
- [x] the same Playwright measurement re-run shows NO module below a 5px
      effective glyph width
- [x] the new H distribution is reported rather than assumed acceptable —
      wrapping trades width for height and the trade has to be shown
- [x] the arrangement stays reproducible: wrapping breaks ties on something
      stable, like every other ordering here

## Not in scope

Dragging. `whbf`'s own "done when" requires a reader can always return to the
static arrangement, and a dragged position is by definition not reproducible.


## Summary of Changes — 2026-09-21

### The budget is the panel's own width, and there is no floor

A fixed 1100 was tried first and measured: at a 390px viewport it left **49 of
69** modules below a 5px glyph, because the constant rather than the page was
setting the width. Taking `getBoundingClientRect().width` degrades to one box
per row on a phone -- tall, but legible, which is the right trade for a panel
a reader opened in order to read it. The band loop already gives an
over-budget box a row of its own, so no width is degenerate and no floor is
needed.

Wrapping therefore depends on the viewport. That is deliberate and costs no
reproducibility: the ORDER within a layer is what has to be stable, and it is
untouched. A `resize` listener re-runs the layout, debounced, or the panel
keeps the width it was built at and the reader is back to the shrunk picture.

### A second defect the fix exposed

One box per row means near-vertical edges, whose midpoint is the next box --
so edge labels landed **on** boxes. An opaque box hides the label; a faded
CONTEXT box shows it through as overstruck text, which is how it was spotted,
in a screenshot rather than in a count.

One pass of push-aside was not enough: **28 of 323** labels were still on a
box, because pushing clear of one lands on the next. Six ordered candidates,
first clear one wins, and anything still unplaceable is COUNTED and said in
the caption rather than silently overstruck or silently dropped -- the same
discipline as the undrawn-edge count.

### Measured, all 69 modules, three viewports

| | worst glyph | below 5px | H median | H max | labels on a box |
|---|---|---|---|---|---|
| before | **1.60px** | **12 / 67** | 478 | — | not measured |
| 1280px | 6.79px | **0 / 69** | 478 | 1629 | **0 / 323** |
| 768px | 6.64px | **0 / 69** | 530 | 2301 | **0 / 323** |
| 390px | 6.39px | **0 / 69** | 714 | 4058 | **0 / 323** |

69 modules against the earlier 67: main added two while this was in progress,
so the two runs are not over an identical corpus. Said rather than quietly
compared.

The height cost is real and is the trade: at 390px the p90 is 2124 and the
worst is 4058 units. That is a long scroll, and it is the price of legible
boxes. It is reported in the caption as the wrapped-row count rather than
left for a reader to discover.

`bun run gates --all` -- 80 gates, 197 e2e.
