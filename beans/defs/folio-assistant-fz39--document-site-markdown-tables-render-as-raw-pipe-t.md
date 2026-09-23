---
# folio-assistant-fz39
title: 'DOCUMENT SITE: Markdown tables render as raw pipe text — build-document-site has no GFM (needs remark-gfm; owner decides)'
status: todo
type: bug
created_at: 2026-09-23T18:00:43Z
updated_at: 2026-09-23T18:00:43Z
parent: folio-assistant-q4jm
---

Found by the ojcx rehearsal, 2026-09-23. A document folio's `table` block, with its rows written as a Markdown table in `<block>.md`, renders in the staging site as a paragraph of raw `| a | b |` text, not as a `<table>`.

**Cause:** `cat-harness/scripts/build-document-site.ts` runs `remark().use(remarkHtml)` without GitHub-flavoured Markdown, so pipe tables, strikethrough and task lists are not parsed. `micromark-extension-gfm-table` is in `node_modules` only as another package's dependency, so relying on it would be fragile.

**Fix:** add `remark-gfm` as a direct dependency (MIT licence; recorded in THIRD-PARTY-NOTICES) and `.use(remarkGfm)`. It is a dependency decision, so the owner decides.

## Done when
- [ ] the owner approves `remark-gfm`, or chooses another way
- [ ] a document folio's Markdown table renders as a `<table>` in `build-document-site`, pinned by a test
