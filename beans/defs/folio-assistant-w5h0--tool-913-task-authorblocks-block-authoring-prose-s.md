---
# folio-assistant-w5h0
title: 'TOOL 9/13: Task_AuthorBlocks — block authoring & prose structure (14 files, 1 entry point)'
status: todo
type: task
priority: normal
created_at: 2026-09-20T04:34:56Z
updated_at: 2026-09-20T04:34:56Z
parent: folio-assistant-d308
---

Group 9 of 13 in `d308`. **14 files, 1 entry point.**

`render-markdown`, `markdown-ast`, `block-module`, `front-matter`,
`build-foreshadows`, `generate-index`, `readme-toc`, `section-story-audit`,
`audit-status-sections`, `extract-status-sections`, `find-dangling-remarks`,
`conditional-class-banner-audit`, `language-trap-audit`, `check-voices`.

**BPMN:** `authoring-a-paper · Task_AuthorBlocks` (`serviceTask`, refs
`content-author`) and `authoring-a-document · Task_AuthorBlocks` (refs
`document-authoring`) — two skills, one Tool, which is legitimate and is what
`satisfies` being an array is for.

**Target repo (#223):** `folio-assist-core`. The 14 `adapters/` files (LIB) sit
behind it.

## Done when
- [ ] a Tool node over the block authoring path
- [ ] `satisfies` names BOTH `content-author` and `document-authoring`
- [ ] the paper/document adapter split preserved — `adapterForKind` stays total
- [ ] `tool-coverage` reflects it
