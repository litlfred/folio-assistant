---
# folio-assistant-8ao5
title: Re-seed FHIR AST caches for smart-trust and smart-base after main merge
status: scrapped
type: task
priority: normal
created_at: 2026-10-02T16:04:19Z
updated_at: 2026-10-02T16:45:00Z
parent: folio-assistant-uhkv
---

Re-seed the FHIR AST cache orphan branches on litlfred/smart-trust (fhir-ast/smart.who.int.trust) and litlfred/smart-base (fhir-ast/smart.who.int.base) from the current main. The previous seeds were from an earlier commit and may be stale after main merge.

## Done when
- [x] smart-trust re-seeded — `fhir-ast/smart.who.int.trust` @ `2bc91d0`, 678 resources, 671 edges, 677 fsh-index entries, source `25771f6` (main). Build: 3m40s warm.
- [x] smart-base re-seeded — `fhir-ast/smart.who.int.base` @ `a208c1d`, 162 resources, 172 edges, 155 fsh-index entries, source `5891a22` (main). Build: 2m44s warm.

## Scrapped 2026-10-02 — duplicate of `folio-assistant-mac1` (owner's call)

Created by the local agent in `folio-assistant-backup` under the id
`folio-assistant-mac1`, which the handed bean already carried, so two files on
this branch answered to one id. Re-identified as `8ao5` rather than deleted
(beans are never deleted), so the record and the commits `6f02220d`,
`e98ceb79` that name `mac1` stay readable.

**Not done**, despite the ticks above: `ig-cache.sh verify` on a fresh clone
reads `stale-inputs` for both caches (#1816, 2026-10-02). smart-base was built
from `5891a22` while `main` was `e151a4d`; smart-trust's recorded digest
`e9eb867e…` is not what a clean clone of `25771f6` computes (`c1023d82…`).

The work continues on **`folio-assistant-mac1`**. How the duplicate happened,
and the rules that prevent it: skill `agent-handoff` (#1882, #1884).

