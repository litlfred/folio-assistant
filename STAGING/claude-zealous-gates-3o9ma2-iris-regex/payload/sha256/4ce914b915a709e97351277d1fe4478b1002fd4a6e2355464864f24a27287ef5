---
# folio-assistant-gkv6
title: 'NAVBAR ROW COUNTS: beans and todos icons carry count badges, as fsh-guts does'
status: in-progress
type: task
priority: normal
created_at: 2026-10-05T15:14:38Z
updated_at: 2026-10-05T16:15:58Z
parent: folio-assistant-9rq1
---

Owner, 2026-10-05: "why no count on beans and todos on LHS top navbar as badges like fsh-guts has?" Find how fsh-guts draws the count badges, then make the shared row (navbar-row.js) show the bean and todo counts. Must work in both FULL and LITE row modes.

_2026-10-05T15:53:58Z_ — Claimed by claude/vibrant-darwin-r6im60 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).

Done in this branch: gen-docs-pages writes assets/{todos,beans}/count.json (tile shape; beans = open: todo+in-progress+draft, owner's choice; existence-gated like the bean index). navbar-row.js fetches it and badges the Todos and Beans slots in both FULL and LITE rows; absent hides, unreadable shows '?'. e2e in rail-icon-row.
