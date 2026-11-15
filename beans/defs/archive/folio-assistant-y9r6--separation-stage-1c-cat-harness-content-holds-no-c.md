---
# folio-assistant-y9r6
$schema: bean/1.0.0
title: 'Separation stage 1c: cat-harness content holds no code — block manifests, tool and skill definitions become JSON'
status: completed
type: task
created_at: 2026-10-01T06:58:01Z
updated_at: 2026-10-30T19:55:00Z
parent: folio-assistant-iirv
---

Stage 1c of the split plan — FR-7, content holds no code. Owner D2 (2026-10-01), option 1: convert to JSON data, validated by the tools on read.

- 189 block manifests + 7 translation nodes → `<block>.json`; `readBlockManifest` accepts `.json`
- 100 `defineTool` literals (4 files) → one JSON tool node each under `cat-harness/tools/<stub>/`; `discover.ts` (in tools since 1a) validates with `ToolDefinitionSchema`; the 129 `test/results/kg-qa/tools/*` sidecars keep their verdicts (identity-checked relocation if keyed by path)
- 8 `SkillDefinition` `.ts` → entries in `skills/skill-definitions/*.json` (the #1702 form)
- browser JS under `docs/` per D5 (default, 2026-10-01): site chrome moves to `cat-harness-tools/site/`, composed in by `compose-docs`

Plans (session scratchpad, 2026-10-01; to be committed with stage 0): `cat-harness-split-plan.md` (stages 0–6, decisions D1–D6, "Owner rulings, 2026-10-01") and `placement-proposal.md` (PR0–PR9, §6 "Owner rulings, 2026-09-30").

## Done when
- [x] new gate `check:content-code-free` (no tracked `.ts/.js/.py/.sh` under `cat-harness/`) watched red first, then green, and wired in CI
- [x] every node and page `.jsonld` byte-identical (`jsonld-gen-check`)
- [x] `knownSkills` identical; `kg-export` node count identical; `check:tools` and `tool-coverage` green

## Completed on landed evidence
Landed on main in PR #1702 (rqao (#1168): the JSON skill definitions and conventions leave .claude/, split by theme).

## Reopened 2026-10-09 — "completed on landed evidence" was premature

PR #1702 landed the JSON skill definitions, which is one bullet of four. None
of the Done-when items is ticked, and measured on `litlfred/cat-harness` main
@ `712332dc` the first bullet is untouched: **189 `.ts` block manifests**
remain under `content/docs/` (the exact count this bean set out to convert),
plus 21 under `docs/assets/`. `check:content-code-free` does not exist.
Still blocked by `8lcl` and, in practice, by `70lx` (reopened the same day).

_2026-10-16T06:30:00Z_ — Reopened (Owner ruling 2026-10-16, item 5): the closure cited PR #1702, which merged before this bean existed, and none of the three done-when boxes is ticked. The block on `vj2p` stays. Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.


## Reopened 2026-10-09 — "completed on landed evidence" was premature

PR #1702 landed the JSON skill definitions, which is one bullet of four. None
of the Done-when items is ticked, and measured on `litlfred/cat-harness` main
@ `712332dc` the first bullet is untouched: **189 `.ts` block manifests**
remain under `content/docs/` (the exact count this bean set out to convert),
plus 21 under `docs/assets/`. `check:content-code-free` does not exist.
Still blocked by `8lcl` and, in practice, by `70lx` (reopened the same day).

_2026-10-16T06:30:00Z_ — Confirmed open (Owner ruling 2026-10-16, item 5); the folio-assistant store copy is reopened to match. The block on `vj2p` stays. Session https://claude.ai/code/session_01Pc8vSeXCwp5Ckvmz56cMDs.

_2026-10-30T14:50Z_ — Claimed by Lane A (session https://claude.ai/code/session_01Qmmkt7dhGQL6nLTZKbWCxo). Owner card 2026-10-30 14:43Z, option A: take y9r6 now and lift its block on 8lcl (8lcl moves `schemas/`; this bean moves content code only). Measured on cat-harness main: 78 docs block manifests (70 prose, 8 webpage), 167 `defineTool` files under `tools/`, 9 skill `.ts`, 7 translation manifests, 11 site-chrome JS, plus openapi/archimate/folio-render. Plan: loaders accept `.json` first, then one PR pair per group, then `check:content-code-free` watched red then green.

_2026-10-30T15:30Z_ — Steps 1 and 2a landed. cat-harness-tools#909 (cc82c06): the readers accept `block-manifest/v1` JSON manifests (`pipeline/json-manifest.ts`, 9 readers, 9 tests). cat-harness#746 (14c45e1): the 70 `prose` docs manifests are now JSON; 71 QA result files moved hash-only (0 skipped); `block-manifest/v1` is registered on the docs kind. Site JSON-LD and docs pages are unchanged, and all 13 gates exit as on main. Left: the 8 `webpage` manifests (after agy's cat-harness#734, which edits exactly those 8), 167 tool definitions, skills and translations, site JS, and the `check:content-code-free` gate.

_2026-10-30T15:21Z_ — Step 3 landed: 163 of 165 Tool definitions are JSON. cat-harness-tools#913 (tool-closure and check-declared-paths read Tool JSON), cat-harness#748 (the `tool-definition/v1` loader in `toolsFromFolders` + 163 conversions; `tools()` byte-identical for two bases; all comments kept in `$comment` as `{at: <JSON pointer>, comment}`), cat-harness-tools#914 (baseline re-keyed, loader test). Left as `.ts`: `harness-state` (agy's #734 edits it) and `cat-harness-schema` (its artefact path reads `stub()`, so it is instance-dependent).

_2026-10-30T15:35Z_ — Step 4a landed: cat-harness#749 (155d495). The 8 remaining skill `.ts` records are now `skills/skill-definitions/<id>.json`, with no field lost; their 8 prose/code pair attestations are removed and their kg-qa sidecars regenerated. `skills/framework/types.ts` stays because folio-assistant-sci imports it. Left: the 8 webpage manifests, `harness-state` and the 7 translations (all after agy's cat-harness#734 / tools#893), the site JS move, and `check:content-code-free`.

_2026-10-30T15:55Z_ — Step 6 gate landed as a one-way ratchet: cat-harness-tools#915 adds `check:content-code-free`, which is red with no list (551 files) and green with `scripts/content-code-free-baseline.json`. About 470 of the listed files are `schemas/` (8lcl). The first done-when box ticks when the list is empty. Site JS: the owner is leaning to option C (move the whole `site-chrome/` subgraph, plus `docs/assets/js`, to cat-harness-tools) and the plan is with them for a decision.

_2026-10-30T15:45Z_ — Owner card, option A: the 2026-10-09 chrome-subgraph layout stays. cat-harness-tools#916: a `.js`/`.mjs` under `site-chrome/assets/`, `site-chrome/_includes/` or `docs/assets/` is a browser asset and is allowed by rule (list 551 -> 533). This supersedes the D5 bullet: site chrome does not move. Step 5 is closed.

## 2026-10-30 ~16:00Z — step 4b done, list 533 -> 322

- cat-harness#751 (2dc3fba): 8 docs/source webpage manifests are JSON (`block-manifest/v1`, builder `webpage`).
- cat-harness#752 (d73c888): 7 translation manifests are `translation-node/v1` JSON; `tools/harness-state` is JSON.
- tools#918 (a972f2f): `translate-kg-viewer` writes the JSON form, validated by `TranslationNodeSchema`.
- tools#917 (63a4a2c): stale `schemas/fsh-guts.ts` partition rule removed (f8wp aftermath).
- f8wp shim PRs merged under owner card "A. Merge both now": tools#893, #901, #908; cat-harness#734, #741, #743; core#241, #244; sci#119, #121; fhir#201, #202. That took 195 schema shims off the list.
- Gate `check:content-code-free` is green with 322 allowed files and nothing added.

Remaining: `schemas/` (moves with 8lcl), `tools/index.ts`, `tools/lib.ts`, `skills/framework/types.ts` (sci imports it), openapi/archimate/folio-render, test fixtures, `_plugins/*.rb`.

_2026-10-30T16:10Z_ — Follow-up PR `litlfred/cat-harness-tools#921` opened to re-key the 2 moved `webpage` witnesses in `scripts/declared-path-baseline.json` (`.ts` -> `.json` after `cat-harness#751`) and clear the `check:declared-paths` findings on `scripts/check-content-code-free.ts` and `scripts/tests/content-code-free.test.ts` from `#916`.

_2026-10-30T16:55Z_ — The `skills/framework/types.ts` shim is gone: folio-assistant-sci#125 (48991b5) and folio-assistant-core#252 (cddb02f) import `schemas/conduct/assistant-types` directly, and cat-harness#759 (f9a353e) deletes it. Lane A was split by the coordinator: this thread keeps y9r6, 8lcl, txue and vj2p. Left on the list outside `schemas/`: `tools/index.ts` and `tools/lib.ts` (they go with the `schemas/tools` loader in 8lcl), the openapi and archimate Zod schemas (8lcl), `tools/cat-harness-schema` (instance-dependent), one test fixture, and the folio file-list renderer plus 3 Jekyll plugins (owner card posted: keep by rule, or move).

_2026-10-30T18:45:00Z_ — `check:content-code-free` now reports 0 code files under cat-harness and the baseline list is empty: `schemas/`, `tools/index.ts`, `tools/lib.ts` and the openapi/archimate schemas moved with 8lcl, and the last test fixture moved in cat-harness-tools#971 / cat-harness#789. Box 1 is met. folio-render and the 3 Jekyll plugins stay by owner card "A. Keep them, allowed by rule". Session https://claude.ai/code/session_01Qmmkt7dhGQL6nLTZKbWCxo.

_2026-10-30T19:40Z_ — Claimed by thread "Finish GOAL 1 code-move beans" (session https://claude.ai/code/session_01Qmmkt9MhQCZs54m2YPoyXp). The placement-move beans stay with "Finish GOAL 1 beans".

_2026-10-30T19:55Z_ — All three boxes measured met; completed. Box 1: `check:content-code-free` on cat-harness-tools main 9673b1f reports 0 code files under cat-harness, baseline `files: []`, and is in `run-gates.py --list --instance cat-harness-tools`. Its unit test still asserted a non-empty list; fixed in cat-harness-tools#979. Box 2: two sibling layouts (pre-y9r6 = cat-harness 854d7ac6 + tools cc82c060^1; now = both mains), `gen-site-jsonld` in each gives 156/156 `.jsonld` byte-identical; none of #746 #748 #749 #751 #752 #759 #773 #787 #789 #792 changed a tracked `.jsonld`. Box 3: `knownSkills` 249 = 249 (the two names that differ come from #747 and #755); `kg-export` 6222 -> 6198 nodes, every added or removed `@id` traced to other work (#747 #771 #741 #762 #773 #743 #755 #756), and every converted node keeps its `@id`; `check:tools` exit 0; `tool-coverage` identical before and after (186 uncovered). cat-harness-tools#921 was closed as superseded (main already had its changes via #952 and #929). Session https://claude.ai/code/session_01Qmmkt9MhQCZs54m2YPoyXp.
