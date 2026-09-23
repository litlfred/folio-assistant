---
# folio-assistant-ob3m
title: 'navbar visualiser: 12 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-navbar
created_at: 2026-09-23T10:36:15Z
updated_at: 2026-09-23T10:36:15Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/navbar/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **At rest the strip is marks with no labels.** Changed by #1022: the four divider initials are gone, so the harnesses are **not reachable from the strip at all** until the sidebar is opened and "Harnesses" unfolded. That is two actions, and on a touch tablet at 800 px or wider it is ☰ first. What remains is five unlabelled glyphs (▤ ◍ ⇶ ⌘ ▦) and ⌂. Their accessible names exist, but a sighted mouse reader has to hover each one.
2. **Two dividers open the same page.** Folio Assistant and C@T Harness both have `href: "/"`, which is the landing page the reader is already on. The difference only shows as two sections further down that page.
3. **The harness descriptions leak authoring notes and formatting into the landing page.**
4. Folio Assistant's description is a naming rationale: *"NAMED `folio-assistant-checkout` rather than `folio-assistant`…"*, with literal backticks. (→ `folio-assistant-mylx`)
5. C@T Harness's description is five newline-separated alternative spellings ("caaat-harness ca&at-harness .c&at-harness c@t-harness"), which run together as one line.
6. **Each harness's navigation now appears in four places.** The graph kinds appear as the divider's links in the sidebar, as "Folders (25)" for cat-harness, as "visualisations you can open" on the landing, and now as the glass's bottom strip (23 tiles, which is the declared-tile list rather than the divider list). They are generated from one declaration, so they agree. But the strip's captions are the tile titles ("Skills — cat-harness", "folio-assist-core-schemas"), and the sidebar's are the kind names ("skills", "schemas"), so the same destination carries two names.
7. **The open sidebar is long even with its caps.** This is eased, not fixed. With every group folded on arrival, the open sidebar is short until the reader unfolds something. Unfolded, it is "On this page" (11), the 27-page nav, and five dividers with up to 25 graph links each. The CSS comment records that the middle region can shrink to an 8rem floor, and the theme's page list is still the region that gets squeezed.
8. **Mobile: the sidebar's own × / ☰ labels are unstyled below 800 px.** This is read off `docs-ui.css`: every `.fa-nav-toggle` / `.fa-nav-close` rule, and every `:has(.fa-nav-open:checked)` rule, is inside `@media (min-width: 50rem)`, and neither #1010 nor #1022 touched them. Only print hides them. I have not seen a just-the-docs render, so whether the theme's own mobile CSS hides the sidebar footer they sit in is unconfirmed.
9. **The "▾ Folio" handle is fixed at top centre on every page** (`z-index: 91`, 52 px tall in the render). At 390 px it sits over the middle of the theme's top bar, where the title is. New and observed: **it also covers the glass's own content.** The sheet's top padding is 3 rem (48 px), less than the handle, and the sheet scrolls under it. At 390 with Settings scrolled, the handle hides the "Glass" and "High contrast" radio labels. The glyph also stays "▾" when the glass is down. Only the accessible name changes, to "Put your folio away". (→ `folio-assistant-015u`) (→ `folio-assistant-rtuo`)
10. **New: the bottom strip hides most of its tiles, and says nothing about it.** 25 tiles in one row: 11 visible at 1280, 2½ at 390. The rest scroll sideways inside the strip, with no arrow, count or edge fade. On a phone, only Todos, Settings and agent-skills-library are on screen, and library, processes and tools are off it. (→ `folio-assistant-2r2n`)
11. **New: most declared tiles on the strip wear the same glyph.** In the render, 21 of the 23 declared tiles draw the same generic outline SVG. Only beans and uploads differ. Tiles are told apart by caption only, and several captions wrap to three lines at 88 px ("folio-assistant-sci-library").
12. **New: there are two unrelated "Settings".** ⚙ Settings on the glass sets the glass: theme, avatars, opacity and blur. ▦ Actions → Settings sets the page: scheme, reading preferences, the Discarded fish and Declared kinds. They share a name and a gear, and neither points to the other. A reader who wants the Discarded items and opens the glass Settings, the one now on screen at the bottom of every page, will not find them.

Related: `folio-assistant-603s`, `folio-assistant-1le7`, `folio-assistant-z1ug`

When fixed, re-draw `cat-harness/docs/wireframes/navbar/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.
