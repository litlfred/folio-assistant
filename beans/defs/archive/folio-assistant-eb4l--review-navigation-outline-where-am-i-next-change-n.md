---
# folio-assistant-eb4l
title: 'REVIEW NAVIGATION: outline, where-am-I, next change / next unreviewed, minimap — one key or one click each'
status: completed
type: task
priority: normal
created_at: 2026-09-22T21:02:55Z
updated_at: 2026-09-23T11:20:14Z
parent: folio-assistant-q4jm
blocked_by:
    - folio-assistant-jwox
---

Owner: *"review navigation"*.

**What a 300-page reader needs that does not exist** (measured 2026-09-22):
- **Outline.** The owner withdrew a folio-level TOC ("no toc"), so this is a
  NAVIGATION pane on the review page, not a TOC in the content. Confirm that
  this does not reopen the ruling.
- **Where am I**: a breadcrumb along the folio/ graph path. Nothing exists; the
  only breadcrumb hit is theme catalogue HTML.
- **Next / previous change, next unreviewed, next open comment**: each is one
  key with a visible button twin.
- **A minimap strip**: the whole document as one column of cells coloured by
  the heat-map metric (child 07). Clicking a cell jumps to that block.

**Accessibility is a requirement, not polish.** The owner works with very
limited hand function. Every action must be one key or one click, work with
switch access and a screen reader, and never depend on a drag or a hover.
o3xy's rules apply.

## Done when
- [x] outline, breadcrumb, next/prev and minimap on the review page
- [x] every action is reachable by keyboard alone, verified by a Playwright test that uses no mouse
- [x] the TOC ruling is checked with the owner (ruling below)


## Roast correction 2026-09-22 (epic q4jm, R6)

The TOC ruling's own reason is *"a sub-graph has no single order"*. A document folio has one (manifest order), so an outline for a DOCUMENT folio falls under its "(mayber later)", not against it. It is still asked, not assumed.


## Owner ruling 2026-09-22: outline on the review page only

The owner was asked with three options side by side (review page only / every page of a document folio / none) and chose **review page only**:
- the outline lists a **document** folio's chapters and sections in manifest order;
- each row carries changed / reviewed / has-comments badges, and one click jumps to that section;
- it appears on `review/` pages and nowhere else.

The docs-auto "no toc" ruling for normal pages **stands unchanged**. A folio with no single order (a paper graph, a multi-document folio) gets no outline; it falls back to the minimap and next/previous.

- [x] the TOC ruling is checked with the owner, and the answer is recorded here

## Built 2026-09-23 (session_017nyJj3PsjvszpF3DyGeBgE)

- **`outline.json`**, written by `build-document-site`: each document's
  chapters and sections in manifest order, with block labels. The section
  keys are the ChangeSet's own (`<chapter dir>::<label ?? title>`), and a
  test holds them equal on a scaffolded folio. Section REFERENCES are
  skipped, as the Markdown build skips them.
- **`cat-harness/scripts/review-nav.ts`** (`crumbFor`, `renderOutline`,
  `renderMinimap`), embedded by `toString()`:
  - the outline is a `<nav>` with word badges; sections with something to
    review are buttons that jump to it;
  - the minimap is ONE tab stop with roving tabindex (arrows, Home/End,
    Enter), labelled in words and marked with glyphs;
  - the breadcrumb goes into the one live status line.
- **Keys** `n`/`p` for next/previous with open comments, with button twins.
- **Not offered:** "next unreviewed". There is no verdict data yet (en2d).
  Saying so beats a guess that skips unread blocks.
- **Tests:** 5 keyboard-only Playwright tests (no mouse in the file), and
  the outline/ChangeSet key-equality test. Checked in Chromium, light and
  dark, on the scaffolded folio with real comments and QA.
