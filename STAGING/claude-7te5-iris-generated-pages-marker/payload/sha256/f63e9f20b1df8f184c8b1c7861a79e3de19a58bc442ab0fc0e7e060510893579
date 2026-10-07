---
# folio-assistant-f8wp
title: 'Placement PR8: schemas regroup and move with their importers; library sources by group; residual gate'
status: todo
type: task
priority: normal
created_at: 2026-10-01T06:58:01Z
updated_at: 2026-10-01T17:45:24Z
parent: folio-assistant-iirv
blocked_by:
    - folio-assistant-70lx
    - folio-assistant-apcg
---

Placement proposal §2 (owner rulings 2026-09-30 §6; process: review → resolve issues → staged PRs). Parent of PR0/PR1 is `9umr`; PR2–PR9 sit under the separation epic because D4 (owner, 2026-10-01, option 3) interleaves them with the split stages into one ordered sequence. Every PR: references move with the subject; generated trees regenerated, never hand-edited; `beans/**` not rewritten; kg-qa sidecars RELOCATED (identity-checked), never deleted without the owner (`deletion-requires-confirmation`).

PR8: 106 harness schemas regroup into `schemas/<group>/` (barrel re-exports old names for one release); the 28 schemas that belong above the harness **move now with their importers** (ruling 4, 2026-09-30: B — not deferred to #223/`yj6r`); `library/` sources regroup to `library/<group>/<slug>/` (ruling 3); `processes.json`, `schemas.json`, `library.json` and the test declaration list their members; UML regenerated; the ~50 per-instance entries `1g4s` found redundant are removed. **Retargeted by D4 (2026-10-01):** the Zod tree is regrouped where stage 1a left it; stage 1b then moves it to `cat-harness-tools/schemas/`.

Then **keep it at zero**: turn `residual.py`'s five checks into a CI gate (extend `check-reference-direction.ts` or add `kg:audit` joins; `zhg2`).

Blocked by stage 1a and PR6 (library sources regroup after the library split).

## Done when
- [ ] `tsc` passes in a scratch run with the barrel REMOVED
- [ ] `kg-export` has the same Schema node count and ids
- [ ] `uml:overview:check` emits one `.puml`/`.mmd` pair per declared sub-subgraph and none for an undeclared one
- [ ] the residual gate exists in CI and was watched red on a planted upward reference

_2026-10-01_ — Stage D of the smart-* separation (bean kg83, #1767, PR #1795) MOVED three of this bean's 28 above-harness schemas already: cat-harness/schemas/dak.ts, dak-content-type.ts and dak.test.ts to smart-base/schemas/ (plus content-type.test.ts as smart-base/schemas/content-types-stack.test.ts, since it registers the full stack). dak-blocks.ts did NOT move: core's block-kinds.ts names the dak adapter and DAK_BLOCK_KINDS, so it waits on a registration extension point, bean 1335. Do not re-do these three here.
