---
# folio-assistant-cnhh
title: 'LHS navbar: glyph-marked harness rows lose child indent (#2151)'
status: completed
type: bug
priority: normal
created_at: 2026-10-05T05:36:04Z
updated_at: 2026-10-05T14:40:27Z
parent: folio-assistant-p5wm
---

Owner 2026-10-05: 'alignment of harnesses is off'. Issue #2151. itemHtml infers fa-nav-kind from glyphPath, so #2122's glyph harness marks got the kind-row padding. Make kind a declared NavItem field.



## Completed by PR #2152 (2026-10-05)

Lands with #2152 (owner: "finish and merge" #2152, 2026-10-05), rendered-verified with Playwright screenshots on the PR. Its parent p5wm was closed on main by #2132 before this bean was opened under it; leaving it open failed check:bean-rollup.
