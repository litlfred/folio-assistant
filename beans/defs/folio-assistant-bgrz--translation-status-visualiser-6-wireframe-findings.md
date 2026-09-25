---
# folio-assistant-bgrz
title: 'translation-status visualiser: 6 wireframe findings'
status: todo
type: task
tags:
    - wireframe-findings
    - ui
    - visualiser-translation-status
created_at: 2026-09-23T10:36:15Z
updated_at: 2026-09-23T10:36:15Z
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
