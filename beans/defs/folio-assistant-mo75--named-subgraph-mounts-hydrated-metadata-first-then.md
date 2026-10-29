---
# folio-assistant-mo75
$schema: bean/1.0.0
title: 'NAMED SUBGRAPH MOUNTS: hydrated metadata first, then a chosen set (nested ids, node sets, concern names) — the nn8e follow-up'
status: in-progress
type: feature
priority: normal
created_at: 2026-10-09T11:22:06Z
updated_at: 2026-10-29T08:45:00Z
parent: folio-assistant-fnx4
---

Filed 2026-10-09 on the owner's instruction ("nn8e yes"). `nn8e`'s done-when names it as a follow-up — "remote BRANCH mount of other repos' named subgraphs, hydrated vs not" — and no bean carried it until now.

Proposal: `cat-harness/docs/proposals/semantic-subgraphs-2026-10-09.md`, Option C (ruled "C y", 2026-10-09). The owner's workflow, verbatim: *"load the tools/skills metadata, review the skills description and then materialize a set of Tools"*.

## Measured 2026-10-09 (cat-harness main 6ea9242)
- Metadata of a NESTED subgraph exists for a SUBSCRIPTION only: `kg:materialize --nodes <sub> <path>` fetches `index.hydrated.jsonld` (bean `c1m4`, completed).
- `remote-mount.ts` builds `byId` from the raw top-level `directories` (`:358`) and refuses any other id at plan time (`:379–387`); it never calls `resolveDirectories`/`promoteFromWithin`.
- `kg:materialize <sub> <subgraph>` copies a whole top-level declared directory (`declaredDirectories` reads the raw top level).
- `tools/` has no hydrated index: `gen-subgraph-jsonld` exports `kgDirectories(instance)` only (skills, scenarios, processes).

## Done when
- [x] G1: Tool nodes exported as a named subgraph with `index.jsonld` + `index.hydrated.jsonld` (`subgraph:jsonld:check`)
- [x] G2: a mount entry or override can ask for `hydrated: true` — the named subgraph's `index.hydrated.jsonld` at the pin, no files
- [x] G3: `overrides.<instance>.directories` and `kg:materialize` accept NESTED subgraph ids and NODE ids, resolved through `resolveDirectories` / the hydrated index; code nodes bring their import closure (`check:tools-closure`)
- [x] concern names: `"sdlc"` at the top level expands to its kind-first members (`docs/sdlc`, `skills/sdlc`, `processes/sdlc`, `scripts/sdlc`), derived from the `concern-groups/v1` declarations, checked by `check:concern-groups`
- [x] the CHOICE made in review is written back to the mount entry (the choice, never the state), so a fresh clone replays it; `index.lock.json` records what it resolved to
- [x] package exports derived from declared `code` subgraphs, checked (owner 2026-10-14, option 1) — litlfred/cat-harness-tools#198 (`scripts/package-exports.ts`; also declares `tools/`)
- [x] end to end: "load tools metadata, review, materialize three Tools" from a downstream checkout

Related: `whlc` (KG publication, named subgraphs), `fnx4` (subscriptions), `9umr` (concern groups).

## Builds on — measured against the beans, 2026-10-09 (owner: "check with beans related to mounting sub-sub graphs ... (materializing subgraphs)")
- **l4ay** (completed): a declared subgraph declares its SOURCE (`directory | branch | future`), resolved once (`resolveSubgraphSource`). A HYDRATED mount is that "future" variant — metadata only, from the published `index.hydrated.jsonld` at the pin — so G2 adds a source kind, it does not invent a second mechanism.
- **2j2r** (todo): ~44 readers of `decl.directories` miss entries declared FROM WITHIN. `remote-mount.ts` is one more (`byId` from the raw top level, `:358`), so G3's nested ids are 2j2r applied to the mount tool: read through `instanceDirectories` / `resolveDirectories`.
- **j9cs** (completed): a directory's `storage` names the TOOL that mounts it (`storage.tool`), no central mounter. A hydrated mount is declared the same way, never hard-wired into remote-mount.
- **54rk** (completed): the cache for on-demand subgraph materialization. G3's "materialize a chosen set" after review reuses it, and the five gates of `materialize-remote`.
- **1g4s** (completed): nested entries carry `subgraph: true` and inherit as named members — those are the mountable units G3 names.
- **c1m4** (completed): the `index.jsonld` / `index.hydrated.jsonld` pair per subgraph — what G1 must publish for `tools/`.

## 2026-10-14 — declaration rule (owner: option 1, with per-Tool folders kept)
Where a folder sits decides how it is declared: under the harness root in `<harness>.json`; inside a declared folder from within; a one-node folder (one Tool, one voice) not at all. One folder per Tool (`tools/<stub>/`, re-exported by `tools/index.ts`) is the recommended layout for a multi-file Tool. Guidance: litlfred/cat-harness#198. G3 still needs 2j2r: `remote-mount` reads top-level ids only.

_2026-10-16T10:50:00Z_ — Re-parented `0mpw` → `fnx4` (KG SUBSCRIPTIONS, `0mpw`'s own epic): a feature may not sit under another feature (milestone → epic → feature → task/bug), and this failed the parent check (https://claude.ai/code/session_01NUrhvvMEwU5MmPW4L2w9jP).

_2026-10-24T08:53:04Z_: Claimed by the README regen thread (https://claude.ai/code/session_01FUCxDH4Xeea4eUzZ5TaPL5). Starting with G1, after re-measuring the 2026-10-09 notes against current main.

_2026-10-24T09:30:02Z_: G1 done: litlfred/cat-harness-tools#716 merged as 5b36582. Every Tool gets its own tools/<id>/ subgraph with index.jsonld and index.hydrated.jsonld (243 Tools; 176 in cat-harness). For G3: cat-harness-tools' own tools/ holds implementation code, and Tool nodes carry no source path, so a code closure must come from the folder convention or maintainsFrom. kg:materialize --nodes lives in folio-assistant-core/scripts/kg-materialize.ts.

_2026-10-24T10:10:27Z_: G2 built: litlfred/cat-harness#537 (source kind `hydrated`), then litlfred/cat-harness-tools#725 (mount:remote hydrated mode). Gap: no harness commits docs/subgraph/ (builtAtPublish), so a hydrated mount of a real pin finds nothing. Owner chose 2026-10-24 (card, option A): publish the index files per pin in a package, fetched by the Tool the source names. Not B (commit them) nor C (generate at mount time).

_2026-10-24T12:19:07Z_: G2 done: cat-harness#537 (fb7e393) and cat-harness-tools#725 (040799e) add the hydrated source and mount mode. Per-pin index package (owner option A, then one prerelease per pin): cat-harness#542 (e5794f4) and cat-harness-tools#736 (c810edd). A mount reads the pin's git tree first, then the subgraph-index-<sha> prerelease, checked by sha256, the manifest, the schema and the IRI. Follow-ups: only cat-harness has the publish caller workflow; kg:materialize --nodes (core) still reads the git tree only; G3 needs 2j2r in remote-mount's two planners.

_2026-10-24T13:02:20Z_: G3, nested-subgraph half done: cat-harness-tools#743 (ee46bf6, both remote-mount planners resolve nested ids via instanceDirectories), cat-harness#568 (88106da, skill + Tool text), folio-assistant-core#214 (1d644b6, kg:materialize --nodes uses publishedSubgraphDir and falls back to the per-pin package). planHydrated ignores mountDefaults.directories on purpose (hydrated is the step before choosing). Left: node ids (single Tools) with import closure, and kg:materialize byte mode by nested id — cat-harness-tools#744, waiting on four owner decisions (what a Tool brings, one closure walker, granularity, nested-id choice in byte mode). Note: check:tools-closure is an allowlist gate, not a closure computer.

_2026-10-24T15:04:00Z_: G3 done and end-to-end shown (owner chose all four recommendations, 2026-10-24 card): bootstrap-tools#43 (1584c10, one closure walker importClosure), cat-harness#581 (8747b00, overrides.<instance>.tools), cat-harness-tools#751 (46c1625, tool-closure.ts; T1 = hydrated metadata, three Tools by id, each with definition + implementation + closure, all modules load), folio-assistant-core#216 (f53b0d0, nested subgraph by parent id, materialised by path). Pending owner pick: should a Tool closure narrow OTHER mount entries it touches (A as built / B recommended / C opt-in field). Left: concern names (sdlc expansion) and writing the review choice back to the mount entry.

_2026-10-29T07:55:00Z_ — Claimed by Lane E of the 2026-10-29 drain ("Fix KG mounts and publication", https://claude.ai/code/session_01Qmmkt6hTCZSkeyx315exLo), taking over from the README regen thread.

_2026-10-29T08:45:00Z_ — Lane E (https://claude.ai/code/session_01Qmmkt6hTCZSkeyx315exLo): concern names done, cat-harness-tools#798 (d76fa26) + cat-harness#664 (b396d93): an id that is a concern code expands to the members each grouping kind declares at the pin, locked as `<dir id>/<code>`. Choice written back done, cat-harness-tools#799 (e6f5b51) + cat-harness#666 (c7c5bdd): `mount:remote --choose <harness>[:<instance>] --directories … --tools …` writes `overrides.<instance>`, pin and consent untouched. Every box is ticked; the bean stays open only for the owner's pick on Tool closures narrowing other entries (A/B/C, re-asked in the Lane E thread).
