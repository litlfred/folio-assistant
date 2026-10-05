---
# folio-assistant-bejf
title: 'QA panel result links: one helper, addressed on qa-reports by the deployed commit''s key'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-05T18:02:27Z
updated_at: 2026-10-05T18:26:59Z
parent: folio-assistant-3fva
---

Issue #2217 (arc #1763). docs-ui.js qaBuildPanel links every QA result as hard-coded blob/main/ + an INSTANCE-relative path: wrong path today, wrong branch by declaration (every qa directory declares storage). One helper, decided per directory by the store's declaration; gen-docs-pages stamps sidecarLinks; docs-ui renders them; check:qa-result-links gates it.

## Done when
- [ ] helper + unit test
- [ ] gen-docs-pages stamps sidecarLinks, docs-ui renders them (no composed forge URL)
- [ ] check:qa-result-links in CI rejects blob/main links into stored qa dirs
- [ ] e2e assertion on the built panel
- [ ] screenshot + HTTP 200 on the new link
