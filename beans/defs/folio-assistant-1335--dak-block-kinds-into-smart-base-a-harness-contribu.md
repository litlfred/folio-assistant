---
# folio-assistant-1335
title: 'DAK block kinds into smart-base: a harness contributes its content adapter and block kinds to core (dak-blocks.ts, DAK entries of block-kinds.ts)'
status: completed
type: task
priority: normal
created_at: 2026-10-01T17:45:13Z
updated_at: 2026-10-02T15:26:21Z
parent: folio-assistant-n3ni
---

Split off stage D (bean kg83) of the smart-* separation (#1767), owner 2026-10-01: 'Split: move 2 now, bean the rest'.

Stage D moved dak.ts and dak-content-type.ts (and their tests) into smart-base/schemas/. dak-blocks.ts could NOT follow, measured 2026-10-01: core's own content model knows DAK —
- cat-harness/schemas/block-kinds.ts: CONTENT_ADAPTERS = ['paper', 'dak'], DAK_BLOCK_KINDS, DAK_COMPONENTS, DAK_COMPONENT_FIELDS, ALL_BLOCK_KINDS spread
- cat-harness/schemas/index.ts barrel: export * from './dak-blocks.js'
- readers: schemas/jsonld.ts (DAK_KINDS_WITHOUT_DOCO_TYPE), content/pipeline/qa-criteria-registry.ts (adapters: ['dak']), schemas/translation-tools.ts (contentType 'dak'), scripts/gen-dak-components-figure.ts
Moving dak-blocks.ts alone makes core import smart-base, which check:partition:edges refuses.

The mechanism is bean zlmp's: registration that walks the resolved stack, so CONTENT_ADAPTERS stops being a compile-time union. This bean is the DAK instance of it.

## Done when
- [x] a harness can contribute a content adapter and its block kinds to core at registration time, with no core import of the harness
- [x] dak-blocks.ts and the DAK entries of block-kinds.ts live in smart-base; core's barrel no longer re-exports them
- [x] jsonld, qa-criteria-registry, translation-tools and gen-dak-components-figure read DAK kinds through the registration
- [x] check:partition:edges 0 new edges; kg-export Schema node ids unchanged except for the moved paths

## Summary of Changes

Landed on main through merge train #1876 (c6d7d740) from #1855: the dak adapter, its 21 block kinds and the five DAK checkers are smart-base's contribution (smart-base/contributions.ts) through ContributionRegistry; core's CONTENT_ADAPTERS is ["paper"]; reference parsing accepts contributed label prefixes. Design: cat-harness/docs/proposals/dak-kinds-contribution-2026-10-02.md.
