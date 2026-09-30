---
# folio-assistant-3clc
title: 'B10c (#1168): ModelId type + advisory check against the model registry'
status: completed
type: task
priority: normal
created_at: 2026-09-30T14:59:53Z
updated_at: 2026-09-30T15:20:06Z
parent: folio-assistant-tr05
---

Owner 2026-09-30: Type + advisory. 532 free-string model ids across 5 fields; not-disclosed a declared value; bootstrap/models/models.json seeded with the 4 ids as validation: unverified.
## Done when
- [ ] ModelIdSchema on every model field
- [ ] advisory check resolves ids against the registry



## 2026-09-30 progress
- [x] ModelIdSchema (bootstrap-tools/schemas/model-registry.ts) + NOT_DISCLOSED; on Attribution.model, adjudication by.model, site-indexes draftedBy.model, ModelEntry.id.
- [x] advisory: check-model-languages lists corpus ids the registry does not declare (claude-opus-5 323, claude-sonnet-5 171, claude-opus-5-5 44).
- [ ] SEEDING held for the owner: the registry's own $comment says an agent must not populate it, and an entry with preferredLanguages [] asserts a determined empty. block-qa-schema agent_model not typed (separate Zod/Pydantic package in lockstep).



## Done — resolved properly (owner 2026-09-30)
preferredLanguages is OPTIONAL on an unverified entry, which then records IDENTITY only and claims nothing about languages (self-reported/human-validated must still state the list). claude-opus-5, claude-opus-5-5 and claude-sonnet-5 are identity-only entries, so every recorded model id resolves; model-ids.test pins that and that no identity entry is read as language evidence.
