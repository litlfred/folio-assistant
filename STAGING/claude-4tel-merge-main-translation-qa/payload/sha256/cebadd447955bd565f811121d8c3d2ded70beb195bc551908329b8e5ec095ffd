---
# folio-assistant-r3ei
title: 'f017 follow-up: review the remaining input sites that block ~57 checks from the input-hash skip'
status: todo
type: task
created_at: 2026-10-06T22:53:13Z
updated_at: 2026-10-06T22:53:13Z
parent: folio-assistant-xpcu
---

PR #2327 (bean f017) audits every skippable check's import closure. `bun run input-hash:coverage --blockers` lists the unannotated sites that keep the remaining ~57 declared tasks running every time.

The biggest blockers:
- kind-validator.ts:196: a computed import of validator modules.
- staging-stamp.ts:61 and :81: environment reads.
- kg-export.ts: spawn, clock, env and host.

Each site needs reading, then one of: an annotation with the right verdict, a `traced` hook, or a small refactor that moves the impure read to its one caller (as `freshness()` did).

## Done when
- [ ] each listed blocker is annotated, traced or refactored, with its reason
- [ ] the coverage report's blocked count is re-measured and recorded here
