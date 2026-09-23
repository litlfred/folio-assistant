---
# folio-assistant-duez
title: 'beans visualiser: 7 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-beans
created_at: 2026-09-23T10:36:14Z
updated_at: 2026-09-23T10:36:14Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/beans/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **Epic labels are unreadable on a phone.** At 390 px the label column is about 120 px wide and clamps to two lines, so rows read "KG: the knowledge…", "PROCESS: how an agent decides…", "LARGE- DOCUMENT…". At 1280 px the longer titles are also clamped ("HARNESS AS INTERFACE: a harness instance's default rendering is LHS + do…"). The full title is only in the button's `title` attribute, which has no touch equivalent.
2. **The "What is stuck" sentences are squeezed into a narrow column on a phone.** The label (`BLOCK NEVER LIFTED`) keeps its own column at 390 px, so each finding runs in a column about 170 px wide, 8 to 10 lines per finding. The 7 findings take about 1.5 screens before the epic chart starts.
3. **The ✎ edit targets are 14×14 px** (measured at 1280 and 390). That is below the 24×24 px minimum target size, on the one control that leads to a write.
4. **No way back to the site.** The page has no `nav` or `header` and no link to the site home. Its only outbound links are the other state-graph cards at the bottom and GitHub bean links.
5. **The heading order skips a level.** `h1` "beans" is followed by the panel titles as `h3` ("Beans — the agent work plan", "What is stuck"). The `h2`s come later ("State graphs this harness declares", then each card is itself an `h2`).
6. **The state-graph tag runs into the name as text.** The status tag is a sibling span with no separator, so the heading's text is "beanslive", "glossaryelsewhere", "healthdeclared" (from `innerText`). A screen reader announces it that way.
7. **The page is dark by default and has no scheme control.** `:root` defaults to the dark ground, and light applies only through `data-fa-scheme="light"`. Nothing on the page sets it. (→ `folio-assistant-dc64`)

When fixed, re-draw `cat-harness/docs/wireframes/beans/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.
