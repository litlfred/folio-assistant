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

## Re-verified 2026-09-29 on `main` 35402147f

Each finding re-measured on a local build of that commit, at 1280×800 and 390×844, both colour schemes where contrast is involved. 11 still present, 1 fixed, 0 could not be determined. FIXED means observed on the built page, not read from code.

- **STILL-PRESENT** — 1. At rest the strip is marks with no labels; harnesses not reachable from the strip: 1280x800, .side-bar is 56px at rest. Hit-test down x=12/28/44: .fa-nav-icon links Todos/Beans/Processes/Knowledge graph, button 'More actions' and the scheme button all have innerText '' (name only via aria-label). Harness dividers sit inside details.fa-nav-group (summary '▦ Harnesses', open=false); the harness link…
- **STILL-PRESENT** — 2. Two dividers open the same page (Folio Assistant and C@T Harness both href '/'): .fa-nav-bottom .fa-nav-row > a: 'Folio Assistant' href=/folio-assistant/ and 'C@T Harness' href=/folio-assistant/. Both point at the landing page. The other dividers now have their own pages (/smart-trust/, /who-iris/, /bootstrap/README.html).
- **STILL-PRESENT** — 3. Harness descriptions leak authoring notes and formatting into the landing page: p.fa-harness-section__description on the landing still carries both texts described in findings 4 and 5. The same texts also appear in .fa-landing-sticky__body (Stickies panel).
- **STILL-PRESENT** — 4. Folio Assistant description is a naming rationale with literal backticks: The .fa-harness-section__description innerText starts 'The repository itself, acting as an initialized instance. NAMED `folio-assistant-checkout` rather than `folio-assistant`…' and has 10 literal backtick characters.
- **STILL-PRESENT** — 5. C@T Harness description is newline-separated alternative spellings that run together as one line: The .fa-harness-section__description computes white-space:normal and renders as 1 line: 'computable adjudication and agentic test harness caaat-harness ca&at-harness .c&at-harness c@t-harness'. In the Stickies copy each spelling is now its own <p>, but it is still the same authoring text.
- **STILL-PRESENT** — 6. Each harness's navigation appears in four places, and the same destination has two names: The same set still appears in 4 places: the sidebar divider kids, 'Folders 29' (.fa-nav-folders), 6 'visualisations you can open' blocks on the landing, and the glass 'More' panel (20 .fa-tile). The names still differ: the glass tile says 'Skills — cat-harness' / 'Docs — cat-harness' / 'folio-assist-core-schemas' wh…
- **STILL-PRESENT** — 7. The open sidebar is long even with its caps: 1280x800, sidebar opened (264px) and every details unfolded: 506 links in .side-bar. nav.site-nav is 2228px tall inside div.fa-nav-middle, which is 128px high with scrollHeight 3244 (overflow auto). The page list is still the squeezed region. On arrival all 4 groups are folded (open=false).
- **STILL-PRESENT** — 8. Mobile: the sidebar's own ×/☰ labels are unstyled below 800px: 390x844: the class is now .fa-nav-head, not .fa-nav-toggle. The copy inside the theme footer (div.d-md-none) is display:inline, 9.6px, with transparent background and no border, at y≈6982. It renders as plain text '☰C@T Harness / ▶ ▦Harnesses / ⌂C@T Harness' under the build stamp (screenshot rv/nav-390-footer.png).
- **STILL-PRESENT** — 9. '▾ Folio' handle fixed top centre over the top bar and the glass's own content; glyph stays ▾ when down: .fa-glass-handle: z-index 91, position fixed. It is now 28px tall at 1280 and 25px at 390 (was 52px). At 390 its rect [154,0,82,25] is over a.site-title. With the glass open the text is still '▾ Folio' and only aria-label changes ('Put your folio away'). With glass ⚙ Settings open and scrolled, the labels passing un…
- **FIXED** — 10. Bottom strip hides most of its tiles with no arrow, count or fade: With the glass open, .fa-glass-tiles holds 4 tiles (Todos, Filter, Settings, ⋯More). scrollWidth equals clientWidth (1280/1280 and 390/390) and none is off-screen at either width. The 20 declared tiles moved behind a labelled 'More — every visualisation this folio declares' tile. Caveat: at 1280 the More panel is 95… — dbbc2b6ef
- **STILL-PRESENT** — 11. Most declared tiles wear the same glyph: Glass → More: 18 of the 20 .fa-glass-more-item .fa-tile draw the identical outline SVG path ('M12 4.5 5 9.5…'). Only beans and uploads differ. The tiles are now in the More panel rather than the strip.
- **STILL-PRESENT** — 12. Two unrelated 'Settings': The glass ⚙ Settings panel (aria 'Folio settings — theme, avatars, opacity') holds Theme/Avatars/Opacity/Blur/Harnesses/Tidy and no text matches /discard|fish/ or points to the page settings. ▦ More actions → 'Settings' holds scheme, Larger text, Higher contrast, Underline links, Reduce motion and the Discarded item…
