---
# folio-assistant-lcwz
title: 'WORK-PLAN CHART: the epic bars are a picture, not a way in — 21 beans behind a bar with no route to them'
status: completed
type: task
parent: folio-assistant-o3xy
created_at: 2026-09-20T22:15:12Z
updated_at: 2026-09-20T22:15:12Z
---

The beans dashboard answers "how much is open and where" and then dead-ends. Measured 2026-09-20 on the live page:

- The epic LABEL is already a link to the epic's bean file, but `work-plan.css:274` sets `text-decoration: none` with the underline only on `:hover`. So the one control on the chart is invisible until a pointer lands on it — which fails this instance's declared low-dexterity interaction profile (`docs-ui.js` records the Pin button as a deliberate choice over drag for the same reason).
- The bar and the count are inert. There is no route from "SPLIT (#223) — 21" to the 21 beans. `addEventListener` occurs ONCE in the whole of `work-plan.js`, and not on the chart.

The renderer's own comment names the gap: the epic row is "where the 19 beans behind the bar actually are".

No pipeline work is required. `assets/beans/index.json` already ships all 317 beans with id, title, status, parent, blockedBy, file, plus repoWeb, and the bars are grouped from that array in the browser. Everything behind every bar is already loaded.

Owner asked for both halves, 2026-09-20: expand AND filter.

## Done when
- [x] The epic link is visibly a link without hovering
- [x] Each bar is a keyboard-reachable disclosure listing that epic's open beans, each linking to its own file
- [x] An explicit control scopes the WHOLE dashboard to one epic — counts, findings and list agree, per the dataviz rule that filters scope everything below them
- [x] No hover-only affordance and no drag anywhere in it
- [x] Verified by rendering and operating it, not by reading the diff

## Summary of Changes

Merged as `c15ecfbb` (PR #621, issue #627). Client-side only — no generator,
no schema, no projection change: the bars were already grouped in the browser
from an array that carries every bean.

**The two halves the owner asked for.** The whole bar is a `<button>` with
`aria-expanded`/`aria-controls`, so it takes keyboard focus and its hit target
is the width of the panel; expanding it lists that epic's open beans,
in-progress first, each linking to its own file, blocked ones marked. Inside
that panel, "Show only this epic" scopes counts, findings and list together,
with a filter row above the panels and a way out. Every bar survives a scope —
a one-bar chart removes the way back, and a filter that changes the series
count must not repaint the survivors.

**The hidden link was the other half of the owner's question.** The epic title
had been a link with `text-decoration: none` and the underline only on
`:hover`, so the chart's one control was invisible until a pointer landed on
it. The bar being a button retires that; every link in the panel is underlined
at rest.

**Three defects were invisible in the diff and obvious in the render**, which
is the reusable lesson rather than an anecdote:

1. The `<li>` still carried the 3-column grid moved onto the button, so the
   disclosure was laid out as a column of the bar and the bar itself vanished.
2. Five CSS tokens did not exist. Two had no fallback, which silently removed
   the focus outline — the change would have shipped breaking the exact thing
   it was built to fix.
3. Selection and hover resolved to the same background, so the row you had
   chosen was indistinguishable from the one your pointer rested on.

None would have failed a gate. Verified by driving it in Chromium: Enter on a
focused bar expands it, the bar reading 21 lists exactly 21, the scope gives
22 (21 children plus the epic) and findings re-evaluate to CLEAR, all 14 bars
remain, focus lands on "Show everything". Both colour schemes inspected.

