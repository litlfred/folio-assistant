---
# folio-assistant-5ea6
title: 'PDF INLINE VIEWER: pinned pdf.js generic viewer on the site, embed on who-iris item pages, as skill + Tool node'
status: in-progress
type: feature
created_at: 2026-10-04T18:40:22Z
updated_at: 2026-10-04T18:40:22Z
---

Owner request 2026-10-04: lightweight inline PDF viewer (search, scroll, jump to page, print, download) for CDN-hosted PDFs, e.g. who-iris item pages. Owner chose option 2 (pdf.js generic viewer copied onto the site) and asked for it as a skill and a tool.

## Todo
- [ ] vendor script: pinned pdf.js release, sha256-verified, pruned, installed into _site at build time (not committed)
- [ ] cross-origin open shim with an allowlist (pdf.js generic viewer refuses cross-origin ?file=)
- [ ] embed fragment module (generic, platform side)
- [ ] who-iris item pages embed it only when the PDF is published (never for withheld)
- [ ] Tool node + MCP tool
- [ ] skill
- [ ] wire into docs-site.yml and feature-staging.yml
- [ ] tests, gates, rendered verification, staging deep link
