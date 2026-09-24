---
# folio-assistant-xwrt
title: 'Mounted instance pages widen at phone width: kg-to-portal is 566px at 390'
status: todo
type: bug
created_at: 2026-09-24T07:06:54Z
updated_at: 2026-09-24T07:06:54Z
parent: folio-assistant-4ccr
---

Found by bean 2r2n (2026-09-24). After 2r2n, 1 of 249 built pages still scrolls sideways at 390 px: `docs/who-iris/kg-to-portal.html`, 566 px wide because of three long inline `code` spans (482, 357 and 311 px).

It is a MOUNTED instance page: `mount-instance-docs.ts` copies who-iris's own docs verbatim and injects the rail. It gets neither `narrow-viewport.css` (themed pages link it from head_custom.html) nor the inline copy (`withViewerNav` inlines it into generated viewers only).

The open question is whose page it is. The mount is the harness's write, but the page is the instance's content, and the navbar CSS deliberately carries no page-content rules because it lands on third-party pages (smart-trust's 681). Options: inline narrow-viewport.css at mount time for who-iris only; or fix it in who-iris's source.

## Done when
- [ ] The owner has chosen where the fix goes
- [ ] kg-to-portal measures ≤ 390 px at a 390 px viewport
