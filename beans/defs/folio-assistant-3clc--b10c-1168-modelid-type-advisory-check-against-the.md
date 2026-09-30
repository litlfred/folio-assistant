---
# folio-assistant-3clc
title: 'B10c (#1168): ModelId type + advisory check against the model registry'
status: todo
type: task
created_at: 2026-09-30T14:59:53Z
updated_at: 2026-09-30T14:59:53Z
parent: folio-assistant-tr05
---

Owner 2026-09-30: Type + advisory. 532 free-string model ids across 5 fields; not-disclosed a declared value; bootstrap/models/models.json seeded with the 4 ids as validation: unverified.
## Done when
- [ ] ModelIdSchema on every model field
- [ ] advisory check resolves ids against the registry
