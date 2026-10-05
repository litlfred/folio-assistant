---
# folio-assistant-lnoy
title: 'Thin pages get the rail, with its style LINKED: navbar.css as a shared asset, folio-navbar: linked'
status: in-progress
type: task
created_at: 2026-10-05T13:30:03Z
updated_at: 2026-10-05T13:30:03Z
parent: folio-assistant-9rq1
---

Owner, 2026-10-05: chose '1. Add the rail' for the 95 built pages with no navbar, then, told they decline on purpose (the rail is 7.9 KB, 4.3 KB of it CSS, on pages of 1.4-3 KB), '1. Shared rail style first'. thin-page.ts and gen-library-viz.ts decline 'until the rail is itself a shared asset'.

## Done when
- [ ] assets/css/navbar.css generated from navbarCss(), with a check that it matches
- [ ] a page declaring folio-navbar: linked is railed with the rail CSS and the row script linked, not inlined
- [ ] thin pages (library entries, openapi operations, todos) declare linked instead of none
- [ ] id-lookup: why it has no rail, and fixed
- [ ] gate: every committed page has a navbar, declares one, or is a redirect
- [ ] rendered: a library entry and an openapi operation page show the rail and the row
