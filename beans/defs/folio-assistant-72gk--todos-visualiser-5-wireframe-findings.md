---
# folio-assistant-72gk
title: 'todos visualiser: 5 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-todos
created_at: 2026-09-23T10:36:15Z
updated_at: 2026-09-23T10:36:15Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/todos/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **The items are not on the page.** `assets/todos/index.json` carries 3 items, each with a summary, status, priority, target page and `viewHref`/`editHref`: "The human-todos page still says 'Not built yet' — the store now exists" (open, high), "Decide which roles content-pipeline-navigator and platform-boundary-guard take on" (blocked), and "Decide what 'kick off' means mechanically for the two CI-watcher dispatch points" (in_progress). The visualiser shows only "1 open / 3 total". A person cannot find out from it *which* item is open, or reach any item.
2. **"Open" means something different from the beans page beside it.** The counts panel counts only status `open`, so the blocked and in-progress items appear only in "total". On `beans/`, "open" is the resting status plus in-progress. The two sibling dashboards use one word for two definitions.
3. **Most of the first screen is the list of other graphs.** At 1280×800 the counts panel takes about 115 px, and the rest of the viewport is the 7 state-graph cards. At 390 px it is the same pattern.
4. **The heading order skips a level, and the tags run into the names.** These are shared with `beans/`: the panel title is an `h3` directly under the `h1`, and the card headings' text reads "beanslive", "todoslive" and so on, because the tag span has no separator.
5. **No way back to the site.** There is no `nav` or `header` and no link home. The page is dark by default, with no scheme control. (→ `folio-assistant-dc64`)

When fixed, re-draw `cat-harness/docs/wireframes/todos/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.
