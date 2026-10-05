---
# folio-assistant-lhvt
title: 'Navbar capability inventory: every capability x every layout, measured on built pages'
status: in-progress
type: task
priority: normal
created_at: 2026-10-05T10:15:18Z
updated_at: 2026-10-05T11:33:19Z
parent: folio-assistant-9rq1
---

First open item of 9rq1's Done when, split out so the container's open state is carried by an open child (check:bean-rollup).

## Done when
- [ ] a table of every harness navbar capability (icon row, marks, graphs section, avatars, ...) against every layout that draws a harness navbar (.side-bar, nav.fa-nav rail, viewer pages), measured on built pages rather than read from source
- [ ] each cell says present / absent / not applicable, with the page it was measured on


## Measured 2026-10-05 on origin/gh-pages (main site, after #2149), 6,869 built pages (STAGING and the vendored pdf.js excluded)

Layouts, from the built HTML:

| layout | pages | where |
|---|---|---|
| theme sidebar `.side-bar` | 4,027 | smart-trust 2,152, smart-immunizations 752, reference 343, smart-base 299, uml 186, processes 91 |
| rail `nav.fa-nav` **with** docs-ui.js | 38 | cat-harness/library 8, docs/who-iris 3, who-iris items, beans, qa, health, attestations, issue-marks |
| rail `nav.fa-nav` **without** docs-ui.js | 2,709 | api/* (TypeDoc) 2,585, cat-harness/auto-docs 56, bootstrap/skills 12, cat-harness/schemas 6, voices 6, uploads 4, wireframes 3 |
| no navbar | 95 | 66 library item pages (cat-harness/library/<instance>/<entry>/), 23 smart-trust/openapi/gateway operation pages, 3 todos/<slug>/, id-lookup, 2 redirects |

Capabilities, rendered in Chromium (one sample page per layout: index, architecture, smart-trust/; cat-harness/library/, who-iris item; cat-harness/auto-docs/, catalogue/who-iris/, api/):

| capability | side-bar | rail + docs-ui | rail, no docs-ui | none |
|---|---|---|---|---|
| instance mark | yes | yes | yes | no |
| harness icon row | yes (7) | yes (7) | **no — row data present, nothing draws it** | no |
| Graphs section | yes | yes | yes | no |
| Harnesses group | yes | no | no | no |
| On this page (document index) | yes | no | no | no |
| Folders / site pages | yes | no | no | no |
| search | yes | no | no | no |
| language switch (fa-lang-mini) | yes | no | no | no |
| colour scheme toggle | yes | yes | no | no |
| QR / tiles view | yes | no | no | no |

### Findings
1. **#2147's fix reaches 38 of 2,747 railed pages.** The row data is written on all of them, but only pages that load docs-ui.js draw it. navbar.test.ts's gate checks the data block, not that anything draws it, so it is green over the 2,709. The defect is in the gate as well as the pages.
2. 95 pages have no harness navbar at all (cf. #2170 for folio sites).
3. The rail lacks five capabilities the theme sidebar has: document index, folders, search, language switch, QR/tiles. Whether each belongs on the rail is a design question for the owner, not a measurement.


## Fix, owner's choice 2026-10-05: '1. Small shared script'; launcher on pages without docs-ui.js: '1. Leave it out'
- [x] navbar-row.js + navbar-row.css: the one drawing of the row. FULL when docs-ui.js calls it (launcher, fsh-guts dialog, light/dark switch); LITE otherwise (link slots, fsh-guts as a link, launcher left out). Full replaces lite in either load order.
- [x] injectRail links both before </head> on every railed page; head_custom.html loads them before docs-ui.
- [x] gate: every committed railed page loads navbar-row.js (navbar.test.ts); glyph copies equal docs-ui.js's.
- [x] e2e: lite row on a bare railed page (links, base prefix, 18px, 56px at rest, no launcher), both load orders end full.
