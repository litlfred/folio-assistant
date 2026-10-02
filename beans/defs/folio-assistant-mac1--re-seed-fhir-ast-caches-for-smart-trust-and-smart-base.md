---
# folio-assistant-mac1
title: Re-seed FHIR AST caches for smart-trust and smart-base after main merge
status: completed
type: task
priority: normal
created_at: 2026-10-02T16:04:19Z
updated_at: 2026-10-02T16:14:37Z
parent: folio-assistant-uhkv
---

Re-seed the FHIR AST cache orphan branches on litlfred/smart-trust (fhir-ast/smart.who.int.trust) and litlfred/smart-base (fhir-ast/smart.who.int.base) from the current main. The previous seeds were from an earlier commit and may be stale after main merge.

## Done when
- [x] smart-trust re-seeded — `fhir-ast/smart.who.int.trust` @ `2bc91d0`, 678 resources, 671 edges, 677 fsh-index entries, source `25771f6` (main). Build: 3m40s warm.
- [x] smart-base re-seeded — `fhir-ast/smart.who.int.base` @ `a208c1d`, 162 resources, 172 edges, 155 fsh-index entries, source `5891a22` (main). Build: 2m44s warm.
