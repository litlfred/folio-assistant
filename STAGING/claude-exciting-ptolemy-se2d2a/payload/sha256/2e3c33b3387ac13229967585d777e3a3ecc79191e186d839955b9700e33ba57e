---
# folio-assistant-u19y
title: 'THEMES PAGE: publish the theme sheet as themes/ on the site'
status: completed
type: feature
created_at: 2026-09-24T13:46:49Z
updated_at: 2026-09-24T13:46:49Z
---

Owner 2026-09-24: "have the themes harness make themes/ page to browse".

## Summary of Changes
- render-theme-sheet.ts: one renderer (sheetBody) now feeds both outputs — the standalone theme:sheet (images inlined) and a new site page, docs/themes/index.md (images linked via relative_url). Adds a "worn by" line per theme, read from the landing board's declared contributions, and each crop's pixel size.
- theme:page / theme:page:check scripts; the check is gated in code-quality-gates.yml.
- scripts/tests/theme-page.test.ts: one row per theme, every image link resolves to a published file, kramdown-safe HTML (mutation-tested), worn-by equals the board. Declared as the consumer-level verification in artefact-verification.json.
- theming.md links the page as the theming subgraph's visualiser.
- Rendered locally in Chromium at 1400px and 390px: all images load, no horizontal scroll; fixed a phone-width layout bug found that way.
