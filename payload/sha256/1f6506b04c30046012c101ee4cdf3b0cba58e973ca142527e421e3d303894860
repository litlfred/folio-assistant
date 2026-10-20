---
# folio-assistant-mo75
$schema: bean/1.0.0
title: 'NAMED SUBGRAPH MOUNTS: hydrated metadata first, then a chosen set (nested ids, node sets, concern names) — the nn8e follow-up'
status: todo
type: feature
priority: normal
created_at: 2026-10-09T11:22:06Z
updated_at: 2026-10-16T10:50:00Z
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
- [ ] G1: Tool nodes exported as a named subgraph with `index.jsonld` + `index.hydrated.jsonld` (`subgraph:jsonld:check`)
- [ ] G2: a mount entry or override can ask for `hydrated: true` — the named subgraph's `index.hydrated.jsonld` at the pin, no files
- [ ] G3: `overrides.<instance>.directories` and `kg:materialize` accept NESTED subgraph ids and NODE ids, resolved through `resolveDirectories` / the hydrated index; code nodes bring their import closure (`check:tools-closure`)
- [ ] concern names: `"sdlc"` at the top level expands to its kind-first members (`docs/sdlc`, `skills/sdlc`, `processes/sdlc`, `scripts/sdlc`), derived from the `concern-groups/v1` declarations, checked by `check:concern-groups`
- [ ] the CHOICE made in review is written back to the mount entry (the choice, never the state), so a fresh clone replays it; `index.lock.json` records what it resolved to
- [ ] package exports derived from declared `code` subgraphs, checked (owner 2026-10-14, option 1) — litlfred/cat-harness-tools#198 (`scripts/package-exports.ts`; also declares `tools/`)
- [ ] end to end: "load tools metadata, review, materialize three Tools" from a downstream checkout

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
