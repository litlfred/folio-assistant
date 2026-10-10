---
# folio-assistant-g3h7
title: 'MAIN RED: external-schema registry lists opengroup-archimate-3.0 but no instance declares a use of it; the committed external-schemas page has 26 rows for 27 specs'
status: todo
type: bug
priority: high
created_at: 2026-10-10T16:55:29Z
updated_at: 2026-10-10T16:55:29Z
parent: folio-assistant-ml9h
---

Found on folio-assistant#2531, 2026-10-10. cat-harness-tools/test/coordinator/external-schemas-viz-checkout.test.ts fails 2 tests at main's own pins (cat-harness a89998b, cat-harness-tools a9e699c) — reproduced locally with main's index.lock, so every folio-assistant PR's bun test shard 3 is red.

- 'every specification has a declared user': undeclared = [opengroup-archimate-3.0]
- 'every row's link resolves': committed page has 26 links, registry has 27 specs

## Done when
- [ ] the instance that uses ArchiMate (cat-harness-tools carries archimate/) declares the use in one of the four forms (front-matter, kind, tag, xmlns)
- [ ] the committed external-schemas page is regenerated in cat-harness (gen-external-schemas-viz)
- [ ] both re-pinned in folio-assistant; shard 3 green on main
