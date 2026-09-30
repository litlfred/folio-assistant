---
# folio-assistant-ob3m
title: 'navbar visualiser: 12 wireframe findings'
status: in-progress
type: task
priority: normal
tags:
    - wireframe-findings
    - ui
    - visualiser-navbar
created_at: 2026-09-23T10:36:15Z
updated_at: 2026-09-30T16:12:47Z
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


---

## 2026-09-30 — findings 11 and 12 root-caused; 11's declaration half now gated

Worked from `claude/cool-fermi-htir5p`, on the owner's request for a QA check
that *"each harness LHS navbar header and menus are themed appropriately and has
consitent layout/icon/navgation"*.

### Finding 11 has TWO causes, and only one was where the finding looked

The render says *18 of 20 tiles draw the identical outline path*. Reading the
client, `docs/assets/js/docs-ui.js`:

- **`ROW_GLYPHS`** (the navbar row, 5 slots) already carries **five distinct
  drawings**, and its own comment insists on it: *"a row where four slots are
  indistinguishable is a row that says nothing."* The row is not the defect.
- **`TILE_GLYPHS`** (the glass tile panel) carries **two** entries, `beans` and
  `uploads` — which is exactly the finding's *"Only beans and uploads differ."*

But the registry is not short of drawings. The declaration side is:
**2 of 11 declared tiles name a glyph at all**; the other 9 call
`glyphFor(undefined)` and take the fallback. Per instance: `cat-harness` 7 of 9,
`smart-trust` 1 of 1, `who-iris` 1 of 1.

**The two denominators are not the same number and must not be quoted as one.**
The render's 20 includes tiles derived from pages rather than from
`directories[].tile`; this 11 is the declaration-side half. A static check
cannot see the rendered panel, so the rendered count still needs an e2e
assertion — NOT done here, and named as outstanding below.

### What is gated now — `bun run check:navbar-consistency`

New: `cat-harness/scripts/check-navbar-consistency.ts`, wired into
`code-quality-gates.yml` as `check:navbar-consistency:check` (`:check` and not
`:strict`, deliberately — see below). 13 unit tests in
`cat-harness/scripts/tests/navbar-consistency.test.ts`.

| family | blocking | today |
|---|---|---|
| `unregistered-tile-icon` — a declared name absent from `TILE_GLYPHS` | yes | 0 |
| `registry-disagreement` — one id, two registries, two glyphs | yes | 0 (overlap 1) |
| `tile-without-icon` — declared tiles sharing the fallback | no | 9 of 11 |
| `art-declared-no-icon` — images shipped, none named as `icon` | no | 1 (`who-iris`) |

Every family was falsified before it shipped: plant the defect, watch it fire,
restore, watch it pass. Renaming either registry literal exits **2**, not 0 —
could-not-determine is never green (`dh4f`), and a registry read as empty would
satisfy every family above.

**Advisory rather than blocking for the two coverage families**, on the line
`check:theme-art` already drew: whether an artefact deserves its own drawing is
editorial, and `glyphFor`'s fallback is deliberately defended in its docblock.
What was missing was never the fallback — it was the COUNT. This finding had to
be taken by hand off a render.

### One correction to the record

A first draft of the check treated the instance-level `icon` as a glyph-registry
name and would have reported `cat-harness`'s navbar mark as falling back to the
net. **It does not.** `sync-docs-harness.ts` resolves it with
`decl.images?.find((i) => i.id === decl.icon)`, so `icon: "mark"` ends at
`/assets/img/icons/cat-mark.svg` and works. Two unrelated namespaces:

- instance `icon` -> an id in that instance's `images` -> an SVG file
- `directories[].tile.icon` -> a name in `TILE_GLYPHS` -> an inline glyph

The script now carries a test per namespace so a later change cannot re-collapse
them.

A second draft had a `dangling-instance-icon` family. It was **dead code**:
`readDeclaration` already throws on an `icon` naming no declared image, and
names every valid id while doing it. The planted-defect test found it by getting
the schema's error instead of the finding — reading the code did not show it.
The script now refuses (exit 2) on an unloadable declaration rather than
duplicating a verdict the schema owns.

### Still open on this bean

- **Finding 11, rendered half** — an e2e assertion counting distinct
  `.fa-tile svg` in the rendered panel. The static check cannot reach it.
- **Finding 12** — two unrelated "Settings", both wearing a gear, neither
  pointing at the other. Untouched: it is a navigation-structure defect, not an
  icon-resolution one, and the repair (rename, or cross-link) is an editorial
  call rather than a check's.
- The remaining ten findings on this bean.

## Re-verified 2026-09-30 on `main` 3779d5d27

Each finding re-measured on a local build of that commit (`preview-site.sh`, served at `/folio-assistant/`), at 1280×800 and 390×844, both colour schemes where contrast is involved. 11 still present, 1 fixed, 0 could not be determined. FIXED means observed on the built page, not read from code.

- **STILL-PRESENT** — 1. At rest the strip is marks with no labels; harnesses not reachable from the strip: 1280×800 hit-test down x=12/28/44: the .fa-nav-icon links Todos/Beans/Processes/Knowledge graph, the 'More actions' button and the scheme button all have innerText '' (name only via aria-label). The harness dividers are still inside details '▦ Harnesses' (open=false). (nav8.mjs)
- **STILL-PRESENT** — 2. Two dividers open the same page (Folio Assistant and C@T Harness both href '/'): 'Folio Assistant' → /folio-assistant/ and 'C@T Harness' → /folio-assistant/. Side note: the Bootstrap divider now goes to /folio-assistant/processes/ (it was /bootstrap/README.html, which 404s in this build). (nav10.mjs)
- **STILL-PRESENT** — 3. Harness descriptions leak authoring notes and formatting into the landing page: p.fa-harness-section__description still carries both texts from findings 4 and 5. The same texts appear in 2 .fa-landing-sticky__body elements. (desc.mjs, nav10.mjs)
- **STILL-PRESENT** — 4. Folio Assistant description is a naming rationale with literal backticks: Narrowed since 2026-09-29: the description now has 0 literal backticks (the spans render as code). It still reads 'The repository itself, acting as an initialized instance. NAMED folio-assistant-checkout rather than folio-assistant, which …', which is a naming rationale, over 3 lines. (desc.mjs)
- **STILL-PRESENT** — 5. C@T Harness description is newline-separated alternative spellings that run together as one line: white-space:normal, 1 line: 'computable adjudication and agentic test harness caaat-harness ca&at-harness .c&at-harness  c@t-harness'. (desc.mjs)
- **STILL-PRESENT** — 6. Each harness's navigation appears in four places, and the same destination has two names: The same set is still in 4 places: the sidebar divider kids, 'Folders' (.fa-nav-folders, 20 links), 6 'visualisations you can open' blocks on the landing, and the glass 'More' panel (27 .fa-tile). The names still differ, e.g. 'Skills — cat-harness' / 'Docs — cat-harness'. (nav6.mjs, nav4.mjs, nav10.mjs)
- **STILL-PRESENT** — 7. The open sidebar is long even with its caps: 1280×800 with the sidebar opened (264px) and every details unfolded: 524 links in .side-bar (was 506). nav.site-nav is 2260px tall inside div.fa-nav-middle, which is 128px high with scrollHeight 3276. On arrival all 4 groups are folded. (nav8.mjs)
- **STILL-PRESENT** — 8. Mobile: the sidebar's own ×/☰ labels are unstyled below 800px: 390×844: the .fa-nav-head copy inside the theme footer (div.d-md-none) is display:inline, 9.625px, transparent background, no border, at y≈6968. It renders as plain text under the build stamp. (nav6.mjs, nav7.mjs)
- **STILL-PRESENT** — 9. '▾ Folio' handle fixed top centre over the top bar and the glass's own content; glyph stays ▾ when down: .fa-glass-handle is z-index 91, position fixed, 93×28 at 1280 and 82×25 at 390. At 390 its rect [154,0,82,25] is over a.site-title 'C@T Harness'. With the glass open the text is still '▾ Folio', and only the aria-label changes ('Put your folio away'). (nav2.mjs)
- **FIXED** — 10. Bottom strip hides most of its tiles with no arrow, count or fade: Still fixed. With the glass open, .fa-glass-tiles holds 4 tiles, scrollWidth equals clientWidth (1280/1280 and 390/390), and none is off-screen. — dbbc2b6ef (nav4.mjs)
- **STILL-PRESENT** — 11. Most declared tiles wear the same glyph: Glass → More: 25 of the 27 .fa-glass-more-item .fa-tile draw the identical outline SVG path ('M12 4.5 5 9.5…'). Only beans and uploads differ. The tile captions are clamped to 6 lines at 91–104px. (nav4.mjs)
- **STILL-PRESENT** — 12. Two unrelated 'Settings': The glass ⚙ Settings panel ('Folio settings — theme, avatars, opacity') holds Theme/Avatars/Opacity/Blur/Harnesses/Tidy, and no text matches /discard|fish/ or points to the page settings. ▦ More actions → 'Settings' is still a separate panel. (nav9.mjs, nav8.mjs)
