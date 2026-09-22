---
# folio-assistant-eb4l
title: 'REVIEW NAVIGATION: outline, where-am-I, next change / next unreviewed, minimap — one key or one click each'
status: todo
type: task
priority: normal
created_at: 2026-09-22T21:02:55Z
updated_at: 2026-09-22T21:04:32Z
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
- [ ] outline, breadcrumb, next/prev and minimap on the review page
- [ ] every action is reachable by keyboard alone, verified by a Playwright test that uses no mouse
- [ ] the TOC ruling is checked with the owner, and the answer is recorded here


## Roast correction 2026-09-22 (epic q4jm, R6)

The TOC ruling's own reason is *"a sub-graph has no single order"*. A document folio has one (manifest order), so an outline for a DOCUMENT folio falls under its "(mayber later)", not against it. It is still asked, not assumed.
