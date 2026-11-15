---
# folio-assistant-565h
$schema: bean/1.0.0
title: Re-measure the navbar's 'no viewer yet' rows after the next publish
status: completed
type: task
priority: normal
created_at: 2026-10-29T12:20:00Z
updated_at: 2026-10-29T16:20:00Z
parent: folio-assistant-46ob
---

## Parent

folio-assistant-46ob

## Why

Every viewer child of 46ob is completed, but 3 rows still read "no viewer yet" on the live site, because the fixes are not yet published. This is the work 46ob stays open for, recorded as an open child so `check:bean-rollup` sees it.

## Done when
- [ ] the next folio-assistant publish has deployed
- [ ] `en/cat-harness/library/index.html` on gh-pages is re-parsed and no row reads "no viewer yet", or each remaining row has its own child bean

_2026-10-29T16:20:00Z_ — Done: the re-measure ran on gh-pages 643d3f6 at 15:50Z (recorded on the parent 46ob): no navbar row says "no viewer yet". Session https://claude.ai/code/session_01NVW1gLKTQrfffUSgD3GCd5.
