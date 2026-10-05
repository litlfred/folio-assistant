---
# folio-assistant-82qs
title: Locale selector back in the LHS navbar's top row
status: in-progress
type: task
created_at: 2026-10-05T14:39:33Z
updated_at: 2026-10-05T15:24:15Z
parent: folio-assistant-9rq1
---

Owner, 2026-10-05: 'we lost locale selector in top navbar LHS again'. Cause (measured): docs-ui.css ~5729 hides .fa-lang-mini whenever .fa-nav-icons exists; the icon row took the launcher and the light/dark bulb but never a language control. Fix: a globe beside the bulb in the row's after-hook (opens the launcher on the language view), plus an e2e asserting a visible language control in .side-bar when the row is present.

## Done when
- [ ] a visible language control in the navbar's top row on the theme sidebar
- [ ] e2e: present whenever .fa-nav-icons is

_2026-10-05T15:24:15Z_ — Claimed by claude/vibrant-darwin-r6im60 — pushed to main so sibling sessions see it before this branch has a PR (bean 35nj).
