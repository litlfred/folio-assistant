---
# folio-assistant-wckf
title: 'WHO-IRIS LHS ICON ROW: harness icon row missing on .fa-nav rail pages (mountNavIconRow binds .side-bar only)'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-05T05:32:26Z
updated_at: 2026-10-05T05:37:13Z
parent: folio-assistant-9rq1
---

Owner, 2026-10-05: 'still no LHS icons top navbar on who-iris page' — confirmed it is the harness icon row (todos, beans, processes, kg, fsh-guts, launcher). Likely cause: docs-ui.js mountNavIconRow() requires .side-bar (just-the-docs); who-iris replica pages carry the harness rail nav.fa-nav instead. who-iris.json declares no navbarIcons (absent = inherit cat-harness's). Related, not duplicate: 2vpn (header mark, #2121). Starts after #2120 merges; owner chose 'New PR from me'.

## Done when
- [ ] who-iris pages show the row at the top of the LHS rail
- [ ] one mechanism draws the row for .side-bar and .fa-nav, no second copy
- [ ] a gate fails when an .fa-nav page lacks the row
- [ ] screenshots (desktop + phone) and staging deep link on the PR
