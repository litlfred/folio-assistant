---
# folio-assistant-pqdv
title: Schema field notes render literal backticks
status: todo
type: bug
tags:
    - wireframe-findings
    - ui
created_at: 2026-09-30T16:12:48Z
updated_at: 2026-09-30T16:12:48Z
parent: folio-assistant-4ccr
---

Found 2026-09-30 by the wireframe QA re-run on main 3779d5d27: the schemas page's field notes show backticks as literal characters instead of inline code. No existing finding tracks it; xb4p #5 covers a different page (24 literal backticks down to 1 there).

## Done when
- [ ] The field notes render inline code through withInlineCode (schemas/inline-code.ts), and a built page shows 0 literal backticks in them.
