---
# folio-assistant-lcwz
title: 'WORK-PLAN CHART: the epic bars are a picture, not a way in — 21 beans behind a bar with no route to them'
status: in-progress
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
