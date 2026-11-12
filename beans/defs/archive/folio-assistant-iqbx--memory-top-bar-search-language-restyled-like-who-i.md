---
# folio-assistant-iqbx
$schema: bean/1.0.0
title: 'Memory: Top bar search + language restyled like who.int (cat-harness#1207 code, tools#1792 e2e, issue cat-harness#1206)'
status: completed
type: task
priority: low
created_at: 2026-11-10T20:20:50Z
updated_at: 2026-11-12T09:45:00Z
parent: folio-assistant-n6ny
tags:
    - project-memory
---

Moved from Claude project memory file `who-int-bar-controls-2026-11-10.md` (memory type: project) on 2026-11-12 (owner Q-MEM-1 A, Q-MEM-2 A+B). Index: folio-assistant-n6ny. Text below is the memory as it stood at the move; it is a record, so re-check anything live before acting.

Full description: Top bar search + language restyled like who.int (cat-harness#1207 code, tools#1792 e2e, issue cat-harness#1206)

Thread "Match who.int search and language styling" (cmsg_017WNUkNK8kdDziPK58Pv6G9H4y59JJUXX6HZUDnWpY5BX), 2026-11-10.
- User: who-iris, smart-*, dth-* pages styled like who.int, esp. search and language (screenshot: navy #2d4271 bar, big magnifier, 文A + bold "Select language" + chevron).
- One shared place: cat-harness site-chrome/assets/{js,css}/docs-ui.* acts on any `.fa-page-bar` (IG .ig-topbar, site bar #main-header, thin-page .iga-top). New mountBarSearch() wraps .ig-search/.search in a magnifier disclosure; slotted language picker = translate glyph + SELECT_LANGUAGE label (6 UN langs) + chevron + dropdown of native names. Band (no bar) unchanged.
- Draft PRs: cat-harness#1207 (branch claude/who-int-bar-controls), tools#1792 adds test/bar-controls.e2e.ts (green only after #1207 merged + re-pinned). Existing e2e 60/60 pass locally.
- Local e2e trick: clone bootstrap-tools sibling, `bun install` in tools, symlink /home/user/node_modules -> tools node_modules, use a throwaway config without globalSetup.
- 20:28Z Q-WHO-1 = A: bar default navy #2d4271 pushed to tools#1792 (page-layout.css) + fhir-harness#342 (IG css). page-layout.css test forbids the word WHO in that file.
- Not changed: who-iris replica's own IRIS header (site/, gen-iris-pages.ts localeBar).
- Screenshots: /mnt/project-files/who-int-bar-2026-11-10/.
- 20:34Z Q-WHO-2 = A: all three marked ready + labelled ready-to-merge, request sent to merge manager thread (order: cat-harness#1207, fhir-harness#342, tools#1792 after re-pin).
- 20:56Z cat-harness#1207 and fhir-harness#342 MERGED. tools#1792 waits on re-pin of cat-harness (merge manager).
- 21:02Z tools#1792 MERGED. All three done; sites show it after their next re-pin of cat-harness/tools/fhir-harness.
