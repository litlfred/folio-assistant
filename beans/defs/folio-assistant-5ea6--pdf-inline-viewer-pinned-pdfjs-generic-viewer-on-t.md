---
# folio-assistant-5ea6
title: 'PDF INLINE VIEWER: pinned pdf.js generic viewer on the site, embed on who-iris item pages, as skill + Tool node'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-04T18:40:22Z
updated_at: 2026-10-04T19:16:24Z
parent: folio-assistant-o3xy
---

Owner request 2026-10-04: lightweight inline PDF viewer (search, scroll, jump to page, print, download) for CDN-hosted PDFs, e.g. who-iris item pages. Owner chose option 2 (pdf.js generic viewer copied onto the site) and asked for it as a skill and a tool.

## Todo
- [x] vendor script: pinned pdf.js release, sha256-verified, pruned, installed into _site at build time (not committed)
- [x] cross-origin open shim with an allowlist (pdf.js generic viewer refuses cross-origin ?file=)
- [x] embed fragment module (generic, platform side)
- [x] who-iris item pages embed it only when the PDF is published (never for withheld)
- [x] Tool node + MCP tool
- [x] skill
- [x] wire into docs-site.yml and feature-staging.yml
- [x] tests, gates, rendered verification, staging deep link

## Progress 2026-10-04

All eight items are done on PR #2120 (head `2e2d7a6`, CI green). Staging deep link:
https://litlfred.github.io/folio-assistant/STAGING/claude-vibrant-darwin-r6im60/who-iris/item-item-18892cf3-5a4f-42a4-923c-a93f4a594dec.html

The bean stays in-progress until the owner signs off and the PR merges. An agent does not close issue #2119.
