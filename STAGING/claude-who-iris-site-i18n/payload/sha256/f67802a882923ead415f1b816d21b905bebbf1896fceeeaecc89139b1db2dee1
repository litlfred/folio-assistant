---
# folio-assistant-2vne
title: Folio handle back to top-centre as a short pill
status: completed
type: bug
priority: normal
created_at: 2026-09-27T05:19:36Z
updated_at: 2026-09-27T05:19:46Z
---

Owner 2026-09-27: 'i want purple folio button, not on navbar but at top middle of display screen. not so tall'. Reverses 269z's navbar placement.

## Summary of Changes

- `docs-ui.js` `placeHandle`: the handle is appended to `body` again (fixed top centre) on every page, rail or theme sidebar alike.
- `docs-ui.css`: pill 1.75rem tall (was 3.25rem), rounded bottom corners, 0.85rem label; `--in-nav` rules removed; viewer band 2.25rem (was 3.5rem).
- Tests: `glass.e2e.ts` asserts body-level, y=0, centred, 24–32 px tall, still toggles; `navbar-row.e2e.ts` asserts the handle is not in the sidebar and the ☰ still works. 114 pass across the five related e2e files.
