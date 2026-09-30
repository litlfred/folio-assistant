---
# folio-assistant-y5si
title: 'ADAPTERS CLOSURE step 1/2: adapters/paper/ -> folio-assistant-sci/, escape axis unchanged at 2'
status: in-progress
type: task
priority: normal
created_at: 2026-09-30T13:48:40Z
updated_at: 2026-09-30T13:48:55Z
parent: folio-assistant-vke6
---

Owner's Option A ruling on issue #1558 (2026-09-30), step 1 of 2.

Moves `cat-harness/adapters/paper/` (2 files) to `folio-assistant-sci/adapters/paper/`.
`adapters/document/` does NOT move: that is step 2, a separate PR, and doing it
here is what takes the axis through 16.

## Why step 1 is free

`adapters/paper/` reaches out of its own directory ONLY into
`adapters/document/` -- 7 edges (6 in index.ts, 1 in tools/lean.ts:22, the edge
the first plan missed), nothing else. Once paper/ is in sci and document/ stays
in cat-harness, all 7 become DOWNWARD edges, legal transitively via
`allowedFromNeeds` (sci -> core -> cat-harness -> bootstrap).

Escape axis: 2 before, 2 after.

## Must ship in the SAME commit -- each fails silently

- `tsconfig.json` `include` gains `folio-assistant-sci/adapters/**/*.ts` (bean lvoa)
- `folio-assistant-sci.json` declares `adapters/` with graphKinds [code]
- `BUILTIN_ADAPTERS` re-pointed
- `init-folio.ts:199` -- it COMPOSES the adapter path from contentType and
  cannot produce two instances; `init-folio.test.ts:216` pins a substring only

## Done when

- [ ] 2 files moved, 7 specifiers rewritten
- [ ] tsconfig include glob added, PROVED with a planted-type-error probe
- [ ] folio-assistant-sci.json declares adapters/
- [ ] BUILTIN_ADAPTERS re-pointed
- [ ] init-folio.ts reads the path rather than composing it; test pins the full path
- [ ] escape axis re-measured: 2 before, 2 after
- [ ] bun run gates green, compared against origin/main in a clean worktree
