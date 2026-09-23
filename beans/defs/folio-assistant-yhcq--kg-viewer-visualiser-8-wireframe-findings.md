---
# folio-assistant-yhcq
title: 'kg-viewer visualiser: 8 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-kg-viewer
created_at: 2026-09-23T10:36:14Z
updated_at: 2026-09-23T10:36:14Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/kg-viewer/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **The page scrolls sideways at phone width on first load.** Measured: `scrollWidth` 606 against a 390 viewport before any facet is chosen, and the Kind and Subgraph count badges render off-screen. After choosing a kind (Tool), the track fits again. The single grid track is sized by content (a long list row or facet), not clamped to the viewport. (→ `folio-assistant-2r2n`)
2. **On mobile the detail is below the whole list.** The order is Kind (15), Subgraph (up to 31), Nodes (a nested scroll box, `max-height: 72vh`), then Detail. With Tool chosen, tapping the first row (`discussion`) put its detail about 630 px further down, below the node list, in a full-page capture 2,063 px tall. Nothing scrolls to it visually. On a phone a swipe inside the 72vh list scrolls the list, not the page, so the reader has to find the edge of the box to get past it. The detail region is `aria-live`, so a screen reader hears it, but a sighted touch reader does not see it.
3. **"No links to or from this node." sits directly under a link.** On Tool `discussion`, `satisfies` renders `skill/discussion` as a followable link, and the next line says the node has no links. The target is `…/bootstrap/bootstrap.jsonld#skill/discussion`, a node in another document. So it is neither a local edge nor listed as dangling, and the short label hides that it leaves this graph.
4. **Two kinds of link look different, and nothing says why.** An IRI outside the document is a plain `<a href>` in the browser's default blue (`kg-viewer.ts` line 925). An edge inside the document is a green in-page button. The styling difference is the only signal that one of them leaves the graph, or the site, and there is no text or icon saying so. The difference in colour is not a contrast failure. (→ `folio-assistant-rtuo`)
5. **A long list with no alphabetical order.** With All selected, the Nodes list is 2,361 rows in document order (SequenceFlow and ProcessNode together are 1,594 of them). Search is the only practical way in, and the facet counts are the only overview.
6. **Neighbourhood labels are cut to 26 characters**, for example "Produce >= 2 candidates, w" and "Mechanical checks, both vi", and on web the labels crowd the edges of the diagram. The full name is in each neighbour's accessible name and in the back-link list above it, so the cut is visual only.
7. **The language switcher never appears.** `.po` catalogues exist for ar, es, fr, ru and zh, but the group stays `hidden`. The skill says *"offer only what the page can show"*, and all five catalogues have 0 translated `msgstr` entries, so `LOCALES` holds only English and `drawLangs` hides the group. This is correct behaviour, but the translation-boundary note the skill requires never gets a chance to show.
8. **No link back to the docs site.** The page is reached from the docs navbar's ⌘ icon, but it carries none of that chrome and no "back to site" link. Returning depends on the browser's Back button.

Related: `folio-assistant-a98i`

When fixed, re-draw `cat-harness/docs/wireframes/kg-viewer/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.
