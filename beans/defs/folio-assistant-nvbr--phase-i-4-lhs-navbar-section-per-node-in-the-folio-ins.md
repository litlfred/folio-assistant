---
# folio-assistant-nvbr
title: 'Phase I.4 — LHS navbar section per node in the folio instance (#223)'
status: todo
type: task
priority: normal
created_at: 2026-09-18T15:00:27Z
updated_at: 2026-09-18T15:00:27Z
parent: folio-assistant-vke6
---

From [issue #223 comment](https://github.com/litlfred/folio-assistant/issues/223#issuecomment-5726628913):
"the lhs navbar should have sections for each node in the folio instance".

**Blocked on bean `fsch`** — without a folio holding 0..n content instances
there is only ever one node to render.

Gate: a two-instance folio shows two sections; a zero-instance folio renders
without error.
