---
# folio-assistant-bgrz
title: 'translation-status visualiser: 6 wireframe findings'
status: todo
type: task
priority: normal
tags:
    - wireframe-findings
    - ui
    - visualiser-translation-status
created_at: 2026-09-23T10:36:15Z
updated_at: 2026-09-30T16:12:46Z
parent: folio-assistant-4ccr
---

Findings from the as-is wireframe `cat-harness/docs/wireframes/translation-status/` (intent.md, as-is.html, checks/), observed at 1280×800 and 390×844. Verbatim from its `## Findings`; a finding tagged → is also covered by that cross-cutting bug.

1. **Horizontal scroll at phone width.** At 390 px the document is 509 px wide (`scrollWidth` 509). The *fuzzy* and *untranslated* columns start off-screen, and the header "catalogues / templates" wraps onto three lines. (→ `folio-assistant-2r2n`)
2. **The page is always dark.** The palette is dark by default and switches to light only under `:root[data-fa-scheme="light"]`. The page has no script and does not load `docs-ui.js`, which is where that attribute is managed, and it has no `prefers-color-scheme` rule. So it renders light-on-dark even in a light-mode browser, unlike its sibling harness pages, which follow the OS scheme. (→ `folio-assistant-dc64`)
3. **Locales are shown as bare codes** (`ar`, `es`, `fr`, `ru`, `zh`) with no language name. A reader has to know the ISO 639-1 codes.
4. **The two questions are not visually separated.** The generator's main point, that catalogue coverage (about 5–8%) differs from string coverage (35–74%), rests on the first column. That column looks the same as the string columns, and the explanation sits below the table in the first note.
5. **Nothing links onward.** A reader who sees 111 untranslated `fr` entries gets no link to the `fr` catalogues, the `.pot` list or the `translation-manager` skill. The page is a dead end with no way back to the site.
6. **The accessibility markup is right.** Row headers use `th scope="row"` and column headers use `scope="col"`. This is recorded so a redesign keeps it.

When fixed, re-draw `cat-harness/docs/wireframes/translation-status/` and re-run `bun run wireframe:check` and `bun run check:wireframes`.

## Re-verified 2026-09-29 on `main` 35402147f

Each finding re-measured on a local build of that commit, at 1280×800 and 390×844, both colour schemes where contrast is involved. 5 still present, 1 fixed, 0 could not be determined. FIXED means observed on the built page, not read from code.

- **FIXED** — Horizontal scroll at phone width: At 390x844 document scrollWidth 390 (was 509). Table is now its own scroll box (display:block; overflow-x:auto; scrollWidth 493 / clientWidth 318). Caveat: 'fuzzy' (x=380) and 'untranslated' (x=437) still start off-screen inside that box; 'catalogues / templates' header still wraps to 3 lines (th height 76px). — 76b34f8ec
- **STILL-PRESENT** — Page is always dark: prefers-color-scheme light → body bg rgb(13,13,13), fg rgb(255,255,255), data-fa-scheme unset. Only a saved localStorage fa-color-scheme=light turns it light (bg rgb(249,249,247)) — partial, commit 805bbd1ba. No prefers-color-scheme handling, no on-page control. — 805bbd1ba
- **STILL-PRESENT** — Locales shown as bare codes: Row headers th[scope=row]: 'ar','es','fr','ru','zh' — no language names.
- **STILL-PRESENT** — Two questions not visually separated: 'catalogues / templates' cells have the same computed style as the string columns (bg transparent, weight 400, no borders, 16px). Explanation 'Two questions, not one.' is still a note below the table (y=528 vs table y=134).
- **STILL-PRESENT** — Nothing links onward / dead end: PARTIAL: a nav.fa-nav now gives 25 links (graphs, harnesses, home '../') — way back fixed. Still 0 links to fr catalogues, .pot list or the translation-manager skill; main content has no links.
- **STILL-PRESENT** — Accessibility markup is right (keep): Positive finding preserved: 6 th[scope=col], 5 th[scope=row].

## Re-verified 2026-09-30 on `main` 3779d5d27

Each finding re-measured on a local build of that commit (`preview-site.sh`, served at `/folio-assistant/`), at 1280×800 and 390×844, both colour schemes where contrast is involved. 5 still present, 1 fixed, 0 could not be determined. FIXED means observed on the built page, not read from code.

- **FIXED** — Horizontal scroll at phone width: Still fixed. At 390×844 the document scrollWidth is 390, and the table is its own scroll box (display:block; overflow-x:auto; scrollWidth 493 / clientWidth 318). 'fuzzy' (x=380) and 'untranslated' (x=437) still start off-screen inside it, and the 'catalogues / templates' header is 76px tall. — 76b34f8ec (D/p_tr.js, D/p_tr2.js)
- **STILL-PRESENT** — Page is always dark: With prefers-color-scheme light and nothing saved, body is rgb(13,13,13) on rgb(255,255,255) and data-fa-scheme is unset. Only a saved fa-color-scheme=light turns it light (rgb(249,249,247)). There is no on-page control. — 805bbd1ba (scheme.mjs)
- **STILL-PRESENT** — Locales shown as bare codes: The row headers th[scope=row] read 'ar','es','fr','ru','zh', with no language names. (D/p_tr.js)
- **STILL-PRESENT** — Two questions not visually separated: The 'catalogues / templates' cells have the same computed style as the string columns (transparent background, weight 400, no borders, 16px). 'Two questions, not one.' is still a note below the table (y=528 vs table y=134 at 1280). (D/p_tr.js)
- **STILL-PRESENT** — Nothing links onward / dead end: PARTIAL, as before. The 25 links are the nav rail. There are 0 links to the fr catalogues, the .pot list or the translation-manager skill. (D/p_tr.js)
- **STILL-PRESENT** — Accessibility markup is right (keep): This is a positive finding and it holds: 6 th[scope=col] and 5 th[scope=row]. (D/p_tr.js)
