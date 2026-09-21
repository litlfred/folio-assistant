---
# folio-assistant-6n23
title: 'EXCISE harness.json: the declaration folds into <name>.config.json, and only a root <stub>.config.json instantiates'
status: in-progress
type: task
priority: normal
created_at: 2026-09-21T10:10:21Z
updated_at: 2026-09-21T10:43:24Z
parent: folio-assistant-vke6
---

Owner, 2026-09-21: *"Excise harness.json.. only <harness-stub>.config.json makes instantiation at root of repo"*.

Scope confirmed by the owner the same day: ALL TWELVE declarations fold (not just the root one), and an instance that is not instantiated here STILL GETS A CONFIG FILE — nothing loses its directories or assets.

## Measured before starting (main, 519e8c01)

| | harness.json | <instance>.config.json |
|---|---|---|
| where | inside each instance dir | repo root |
| how many | 12 | 1 (cat-harness.config.json) |
| carries | name, description, directories[], assets[], needs[], stickies[] | contentType, adapter, dependencies, translation, feedbackDir, skills |

72 TypeScript files touch the declaration API; 23 non-test references to DECLARATION_FILENAME.

## Done when

- [ ] A directory's declaration is <name>.config.json, and the filename stem equals the declared name
- [ ] All 12 declarations migrated with git mv so history follows
- [ ] Discovery no longer looks for a fixed filename
- [ ] The root keeps its instantiation markers, and nothing reads harness.json
