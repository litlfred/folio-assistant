---
# folio-assistant-f8wp
$schema: bean/1.0.0
title: 'Placement PR8: schemas regroup and move with their importers; library sources by group; residual gate'
status: in-progress
type: task
priority: normal
created_at: 2026-10-01T06:58:01Z
updated_at: 2026-10-29T09:27:00Z
parent: folio-assistant-iirv
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

_2026-10-15T16:49Z_ — Block lifted: `apcg` is completed (PR #1898 merged 2026-10-05). The edge was the work plan's "Block never lifted" finding (owner, 2026-10-15). Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.

_2026-10-16T06:55:00Z_ — Block lifted: `70lx` is completed. Owner ruling 2026-10-16 06:50Z (question 4, option 1): the part-by-part measurement stands in for `bun run cat gates --all` and for falsifier 2, so 70lx is closed. Session https://claude.ai/code/session_01K9Xi9QSxCNYju8QNu7EuHg.

## 2026-10-24 — re-measured (separation drain, session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e)

Re-measured: not started. `cat-harness/schemas/` is flat (287 `.ts` files; only `skills/` and `block-qa-schema/` subfolders). Of the 19 audit rows, 4 are in their target.

## OWNER, 2026-10-24 08:06Z (structured question in the separation drain thread, session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e)

Same ruling as `8fq9`: **do it now, one concern group per PR** to keep churn down.

_2026-10-24T08:16Z_ — Claimed by the separation drain thread (session https://claude.ai/code/session_01X14WfP6kHutkCyB8dpmj4e). Open PRs: none yet; next after 8fq9 groups.

_2026-10-29T08:05Z_ — Group 1 (conduct) merged: litlfred/cat-harness-tools#806 then litlfred/cat-harness#670. Lane A, session https://claude.ai/code/session_01Qmmkt7dhGQL6nLTZKbWCxo; the 10-24 claim had lapsed. What landed:
- `schemas/schemas.json` (`concern-groups/v1`) declares the groups from within.
- `interaction`, `memory` and `waiver` are in `schemas/conduct/`, each with a one-release `@graphNode none` re-export at the old path.
- The schema readers (`schemaModules` and `instanceZodSchemaDirs`) walk the declared groups and skip re-export shims.
- `libraries.ts` no longer treats `schemas/schemas.json` as a nested instance.

Checked in a composed index at the layer mains: tsc 0/0, kg-export has 179 Schema nodes with identical ids, 12 gates match the before run, and the touched tests are the same 366 pass / 7 env-fail as main. **Next groups:** tools, process, ui, library, kg, content and sdlc, one per PR. The audit's concern labels cover 155 modules; 146 need classifying first. The barrel removal (box 1) comes after the last group.

_2026-10-29T08:45Z_ — Groups 2 to 5 merged, each as a cat-harness PR then its paired cat-harness-tools PR (Lane A, session https://claude.ai/code/session_01Qmmkt7dhGQL6nLTZKbWCxo):
- 2 tools: litlfred/cat-harness#671, litlfred/cat-harness-tools#810.
- 3 process: litlfred/cat-harness#672, litlfred/cat-harness-tools#811.
- 4 ui: litlfred/cat-harness#673, litlfred/cat-harness-tools#812. It also fixed `import.meta.dir` joins that were one level short in three moved tests (one had passed on main against a missing directory).
- 5 library: litlfred/cat-harness#674, litlfred/cat-harness-tools#813.

Each one was checked in the composed index the same way as group 1: tsc is clean, the 179 Schema ids are the same, gate exit codes match, partition has 0 wrong-direction edges, and the touched tests fail the same way as on main. kg-qa sidecars that name a moved path are refreshed hash-only. Next: kg, then content and sdlc.

_2026-10-29T09:27Z_ — Groups 6 to 8 merged (Lane A, session https://claude.ai/code/session_01Qmmkt7dhGQL6nLTZKbWCxo):
- 6 kg: litlfred/cat-harness#675, litlfred/cat-harness-tools#814. Fixes module-relative paths that the move left one level short: `defaultTypologyRoots`, `kg-node.test.ts`, the tools `eval-bpmn-forced-vs-managed.ts` HARNESS_ROOT, and the library group's `translation-tools.ts` checkout root (missed in #674).
- 7 content: litlfred/cat-harness#676, litlfred/cat-harness-tools#817. Only the 24 plainly-content modules. The audit's other 29 "content" rows look mislabelled.
- 8 sdlc: litlfred/cat-harness#680, litlfred/cat-harness-tools#822. `test-preload` stays at the top level, because every layer's bunfig names it.

All eight labelled groups are done. **Next:** the 109 modules still at the top level (the 146 unlabelled plus the mislabelled ones) have a drafted placement in `/mnt/project-files/lane-a/f8wp-remaining-schemas.md`. It is waiting on an owner card. After them come the barrel removal (box 1) and the residual gate (box 4). Lesson for later groups: check every `import.meta.url`, `import.meta.dir` and `new URL("..")` in the moved files by hand, because tsc can't see them.
