---
# folio-assistant-rnaj
$schema: bean/1.0.0
title: 'Memory: Bulb toggle on folio-rail jtd pages repainted only the rail, not body/tables/code until reload; fix in cat-harness navbar-row.js (branch claude/dark-...'
status: completed
type: task
priority: low
created_at: 2026-11-08T07:41:44Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `dark-toggle-body-2026-11-08.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Bulb toggle on folio-rail jtd pages repainted only the rail, not body/tables/code until reload; fix in cat-harness navbar-row.js (branch claude/dark-mode-toggle-body)

Thread "Fix dark mode on folio pages" (cmsg_017WNUkNK8kdDziPK58Pv6G9LUBmhED3rPms8TiqkQoWk4), user 07:38Z 2026-11-08.
- Cause: on just-the-docs pages with the folio rail, docs-ui.js finds no site header, so navbar-row.js draws the LITE row; its bulb set only `data-fa-scheme` and never swapped the theme's first sheet (just-the-docs-*.css). Reload fixed it via the first-paint snippet.
- Fix: `liteThemeSheet(name)` in cat-harness site-chrome/assets/js/navbar-row.js, same guard as docs-ui.js themeSheet/jtdShows. Pushed 369a180: issue cat-harness#1139, draft PR cat-harness#1140 (subscribed). MERGED 2026-11-08 13:34Z; live after folio re-pin. Live after folio re-pin.
- Local test: sparse gh-pages clone + python http.server; `document.querySelector('.fa-nav-scheme').click()` (Playwright click on the strip can miss).
Related: folio-assistant-pbfo, folio-assistant-bxc4.
