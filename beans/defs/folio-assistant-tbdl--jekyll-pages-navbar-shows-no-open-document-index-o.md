---
# folio-assistant-tbdl
title: Jekyll pages' navbar shows no open-document index — only the injected rail supplies documentIndex
status: in-progress
type: task
priority: normal
created_at: 2026-09-30T11:23:09Z
updated_at: 2026-10-01T05:31:21Z
parent: folio-assistant-yj32
---

Found closing `sjic`, 2026-09-29/30, session https://claude.ai/code/session_014nDNCRPYSuF4DiJUP7wMDq.

The owner's spec (in `sjic`): *"when a document or other indexed object is opened, the document index/idices are shown in a navbar tab/menu."*

## Measured

- `NavbarModel.documentIndex` has ONE supplier: `harness-rail.ts:118`, which calls `documentIndexOf(html)` on a finished page. So mounted and generated pages get it.
- `gen-navbar-include.ts` builds the Jekyll sidebar's model with no `documentIndex`. It cannot: the include is committed and shared by every page, and the index is per page.
- Published `gh-pages` (built from `f2d58d67b`): `index.html` and `getting-started.html` carry the renderer's `fa-nav-top` and no index group.

So on the ~1,300 Jekyll-laid-out pages the fixed top shows the instance and nothing about the open document.

## Two shapes, neither chosen

1. A post-build pass, like `rail-standalone-pages.ts`, that runs `documentIndexOf` on each finished Jekyll page and inserts the group into `.fa-nav-top`. It uses the same function, so the result matches the rail.
2. Liquid over `page.content` headings. This is a second implementation of `documentIndexOf`, which is the drift `sjic` exists to stop.

Option 1 looks right. It is recorded here, not decided.

## Done when

- [ ] a Jekyll page with addressable headings shows its index in the navbar's fixed top, from `documentIndexOf`
- [ ] a page without headings shows no empty group
- [ ] verified on a built page, before and after
- [ ] `bun run gates` green

_2026-09-30_ — Filed under `yj32`, not `p5wm`: on this date `main` re-parented its siblings `sjic` and `oi1y` there by subject (bean `ansc`, todo-manager §"WHICH parent"), and this bean is the same subject.

_2026-10-01T05:31:21Z_ — Claimed by claude/tbdl-jekyll-doc-index — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
