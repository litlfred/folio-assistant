---
# folio-assistant-5rmf
title: 'NAVBAR QR ICON GONE: the LHS top row''s QR code for the current page no longer appears, though its generator still loads'
status: todo
type: bug
priority: normal
created_at: 2026-10-06T06:51:27Z
updated_at: 2026-10-10T16:50:32Z
parent: folio-assistant-9rq1
blocked_by:
    - folio-assistant-ndp0
---

Owner, 2026-10-06 (https://claude.ai/code/session_012qoycyCSGidZqW245vXhze), verbatim:

> LHS top navbar used to have a QR code icon that would make a QR code for the currently viewed page and show it inside the LHS navbar.

## Measured
- The generator is still shipped. `cat-harness/docs/_includes/head_custom.html:181` documents *"Site UI: a QR of the current page in the sidebar header"*, and lines 644-645 load `assets/js/vendor/qrcode.js` and `qrcode_UTF8.js` on every page.
- Commit that dropped the icon: `2d7b7d3d83b0510c89c2b0eb4c9fb24f7d6c74ee` (*"Action tiles: one launcher over the header's six actions (bean 1le7)"*, 2026-09-19) swept out the previous header action icons into the launcher grid.

## Done when
- [x] the commit that dropped the icon is named (`2d7b7d3d83b0510c89c2b0eb4c9fb24f7d6c74ee`)
- [x] the QR icon is back in the LHS top row as a declared navbar capability (the `9rq1` one-mechanism rule), on platform pages AND folio sites
- [x] clicking it shows the current page's QR code inside the LHS navbar; a second click hides it (`l4zi`: the inverse is reachable)
- [x] a navbar-inventory or e2e check fails if the icon is missing again (`test/navbar-qr.test.ts`, `test/navbar-row.e2e.ts`, `scripts/tests/navbar.test.ts`)
- [x] screenshots at desktop and phone width, sent to the owner (`rendered-verification`)

## Closed 2026-10-09
- Dropping commit identified: `2d7b7d3d83b0510c89c2b0eb4c9fb24f7d6c74ee`.
- Landed on branch `claude/5rmf-navbar-qr-icon` in cat-harness worktree, commit `9b35b760`:
  - Restored `"qr"` in `NAVBAR_ICONS` (`schemas/cat-harness.ts`) and updated `NavbarIconsSchema` max to 8.
  - Declared `"qr"` in `cat-harness.json` and generated `docs/_data/harness.json`.
  - In `docs/assets/js/navbar-row.js`, added `QR_GLYPH`, `ROW_GLYPHS.qr`, `LABELS.qr = "QR code for this page"`, button creation with accessible attributes (`aria-label`, `aria-expanded`), and `.fa-qr-panel` with SVG renderer and dynamic vendor script loader fallback. Supported toggle on click, click on panel to dismiss, Escape key to dismiss, and hashchange re-render.
  - In `docs/assets/css/navbar-row.css`, added styles for `.fa-qr-panel` inside sidebar on desktop and fixed modal on mobile (<50rem).
  - Added unit test suite `test/navbar-qr.test.ts` (7 passing), updated `scripts/tests/navbar.test.ts` (106 passing), `schemas/navbar-icons.test.ts` (14 passing), `test/navbar-row.e2e.ts`, and confirmed `bun run typecheck` clean.
  - Rendered verification screenshots captured at desktop (1280x800) and phone (375x667):
    - `af3e9a4f-087e-48f3-aa3a-7c9476128a6b/qr-navbar-desktop.png`
    - `af3e9a4f-087e-48f3-aa3a-7c9476128a6b/qr-navbar-mobile.png`

## Reopened (2026-10-10, drain ml9h)

Lane B's e2e run (possible since cat-harness-tools#69) shows the navbar QR icon still not rendered. Cause: the icon is not declared in litlfred/cat-harness's cat-harness.json navbarIcons. Fix: add "qr" between fsh-guts and launcher, regenerate docs/_data/harness.json.

## Correction (lane A)

The fix already exists: litlfred/cat-harness 9b35b76 restores "qr" in navbarIcons. The index pins cat-harness a89998b, which predates it, so it is not rendered here yet. It arrives with the next cat-harness re-pin, which needs ndp0 first (the moved scripts). Close when that re-pin lands and the e2e shows the icon.
