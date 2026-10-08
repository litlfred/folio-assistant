---
# folio-assistant-afu3
title: 'SEARCH PINNED: the magnifier stays on screen at every scroll position (#1732)'
status: complete
type: feature
priority: high
created_at: 2026-10-01T00:56:04Z
updated_at: 2026-10-08T04:30:00Z
parent: folio-assistant-o3xy
---

Owner, 2026-10-01: the search magnifier should ALWAYS be on screen, mid-page included. Issue #1732, follow-up to #1715/#1720. Branch claude/search-pinned.

## Completed on landed evidence
Landed on main in commit 49828a5686a3 ("afu3 (#1732): the search magnifier stays on screen at every scroll position").
- `.fa-search-home` set to `position: sticky`.
- Magnifier and open row are opaque, styled from tokens.
- Window scroll guard implemented for search focus.
- Added comprehensive E2E test suite in `cat-harness/test/search-pinned.e2e.ts` (196 lines).
- Verified on main.
