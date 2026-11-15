---
# folio-assistant-c4lg
$schema: bean/1.0.0
title: 'Remote mount follow-ups: init-folio --link remote, and pin skill_fetch REFERENCE_PACKAGES'
status: completed
type: task
priority: normal
created_at: 2026-10-23T08:34:18Z
updated_at: 2026-10-23T14:13:00Z
parent: folio-assistant-0mpw
---

The two items still unticked on `0mpw`, recorded as their own task so the parent's open state rests on an open child (`check:bean-rollup`).

## Done when
- [x] `init-folio --link remote` is implemented (today `--link` accepts `submodule | sibling`). — **`litlfred/cat-harness#422` merged `764f4bdce1` (`2026-10-23T09:57:53Z`, `LinkModeSchema`); `litlfred/cat-harness-tools#573` (`12873c3a5d`) is 100% green in CI.**
- [x] `skill_fetch`'s `REFERENCE_PACKAGES` is pinned to a commit rather than `ref: "main"`. — **`litlfred/cat-harness-tools#573` (`12873c3a5d`, pinned to `fb6a938ef617b6377a66eb4257774a0b857e9255`) is 100% green in CI.**

Split out on 2026-10-23 by the coordinator (session https://claude.ai/code/session_01BiusQ9uAZiHP6TUhfwZ2h6).

_2026-10-23T14:13:00Z_ — Completed: litlfred/cat-harness-tools#573 merged as 19d54e8 (owner, 14:12Z: "merge"), after main was merged in to clear a conflict in `scripts/init-folio.ts`; all 9 checks green. With cat-harness#422 (764f4bd) this lands `init-folio --link remote` and the pinned `REFERENCE_PACKAGES`. Thread "smart IG harnessing", https://claude.ai/code/session_01AW61nue34oLGoENwjCNcSA
