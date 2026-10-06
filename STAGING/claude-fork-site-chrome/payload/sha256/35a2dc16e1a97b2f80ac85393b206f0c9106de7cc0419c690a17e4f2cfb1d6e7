---
# folio-assistant-doy3
title: tipLocations/resolveTipLocation read only legacy storage — a source-declared branch subgraph is invisible to branch-store's CLI and StateStore
status: in-progress
type: bug
created_at: 2026-10-03T15:53:53Z
updated_at: 2026-10-03T15:53:53Z
parent: folio-assistant-fs43
---

Found 2026-10-03 while building nij4 (#1997), measured on a fixture: a directory declared `source: { kind: "branch", keyedBy: "tip" }` makes `declaredSubgraph(...).source` a branch, but `tipLocations(root)` returns [] for it and `resolveTipLocation(id)` throws 'declares no storage'. Both walk `resolveDirectories` and read `d.storage` only, while `declaredSubgraph` folds config override → source → legacy storage.

Who is affected: `branch-store mount|push|where --id` (CLI), `StateStore.openFor` (state-store.ts), and anything else that calls these two functions. `state:mount` and `state:push` are NOT affected, because since nij4 they ask `declaredSubgraph`.

Why it matters now: bean 9c7h moves fsh-guts onto a branch. If it declares that move with `source`, which is the current way, every reader through `resolveTipLocation` refuses it.

## Plan
- Rebuild `tipLocations` and `resolveTipLocation` on `declaredSubgraph`, as nij4 did for state-mount (`branchSubgraphs` in state-mount.ts is the shape), and keep `route` keying where `storage` still carries it.

## Done when
- [x] a fixture declaring `source` (no `storage`) resolves through `resolveTipLocation` and `branch-store mount --id`
- [x] the legacy `storage` spelling still resolves (state-mount-per-branch.test.ts declares with `storage` and passes)

## Fixed in #1997 (2026-10-03), folded into nij4's combination
`tipLocations` and `resolveTipLocation` now read each entry's RESOLVED source: `resolveSubgraphSource(entry, subgraphSourceOverrides(instance, root))`, the same resolver `declaredSubgraph` uses, minus its whole-checkout walk. `route` is still read straight off `storage`, because the source union has no `route` member and the resolver would throw on it. That is a latent defect in `resolveSubgraphSource` for whoever does the route-keyed cutover (bean `xsrv`); it is not fixed here.
