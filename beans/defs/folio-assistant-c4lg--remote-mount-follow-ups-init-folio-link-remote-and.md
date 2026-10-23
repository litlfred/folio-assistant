---
# folio-assistant-c4lg
$schema: bean/1.0.0
title: 'Remote mount follow-ups: init-folio --link remote, and pin skill_fetch REFERENCE_PACKAGES'
status: in-progress
type: task
priority: normal
created_at: 2026-10-23T08:34:18Z
updated_at: 2026-10-23T09:16:30Z
parent: folio-assistant-0mpw
---

The two items still unticked on `0mpw`, recorded as their own task so the parent's open state rests on an open child (`check:bean-rollup`).

## Done when
- [x] `init-folio --link remote` is implemented (today `--link` accepts `submodule | sibling`). — **in open PRs `litlfred/cat-harness-tools#573` and `litlfred/cat-harness#422` (`scripts/init-folio.ts`, `src/tools/folio-init.ts`, `schemas/tool-types.ts`, `scripts/tests/init-folio.test.ts`).**
- [x] `skill_fetch`'s `REFERENCE_PACKAGES` is pinned to a commit rather than `ref: "main"`. — **in open PR `litlfred/cat-harness-tools#573` (`src/tools/skill-fetch.ts` pinned to `fb6a938ef617b6377a66eb4257774a0b857e9255`, regression test in `src/tools/skill-fetch.test.ts`).**

Split out on 2026-10-23 by the coordinator (session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6).
