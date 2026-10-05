---
# folio-assistant-cnhh
title: 'LHS navbar: glyph-marked harness rows lose child indent (#2151)'
status: in-progress
type: bug
priority: normal
created_at: 2026-10-05T05:36:04Z
updated_at: 2026-10-05T05:36:31Z
parent: folio-assistant-p5wm
---

Owner 2026-10-05: 'alignment of harnesses is off'. Issue #2151. itemHtml infers fa-nav-kind from glyphPath, so #2122's glyph harness marks got the kind-row padding. Make kind a declared NavItem field.
