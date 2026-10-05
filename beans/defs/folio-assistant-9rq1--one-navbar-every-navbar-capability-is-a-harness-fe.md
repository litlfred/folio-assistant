---
# folio-assistant-9rq1
title: 'ONE NAVBAR: every navbar capability is a harness feature, drawn by one mechanism on every layout (.side-bar, .fa-nav rail, viewer pages)'
status: todo
type: feature
priority: normal
created_at: 2026-10-05T05:37:13Z
updated_at: 2026-10-05T08:39:49Z
parent: folio-assistant-rwmf
---

Owner, 2026-10-05, choosing how to fix the missing harness icon row on who-iris pages (#2147): '1... this should be a common navbar funcationliatyt in harness. should be a bean about this'.

## The gap this names
The navbar's capabilities are defined per LAYOUT, not per harness. The harness icon row (mountNavIconRow in docs-ui.js) binds only just-the-docs's .side-bar and reads data that only head_custom.html writes. Pages railed by lib/navbar.ts (who-iris replicas, viewer pages) therefore never get it. Bean 2vpn was the same class of defect for the header mark (two callers, two readers), fixed by one resolver.

## Rule
A navbar capability is declared once for the harness (cat-harness.json navbarIcons, marks, and so on) and drawn by one mechanism wherever a harness navbar appears. A capability that exists on one layout and not another is a defect, not a design.

## Done when
- [ ] inventory: every navbar capability x every layout it appears on, measured on built pages
- [ ] each capability drawn by one mechanism on every layout (first: harness icon row, bean wckf / #2147)
- [ ] a gate fails when a harness navbar on any layout lacks a capability its harness declares
- [ ] the navbar skill states the rule


## Re-parented to GOAL 4 (rwmf), 2026-10-05

Created under p5wm (GOAL 2) at 05:37Z. GOAL 2 was signed off and closed on main at 04:57Z (e6ac11b), and its open UI work was moved to rwmf on the owner's "Move to GOAL 4 PLATFORM". This bean follows that ruling. check:bean-rollup flagged it as the one open child of a completed GOAL 2.
