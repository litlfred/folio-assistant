---
# folio-assistant-adpt
title: 'adapters/** is the last tree outside tsc — 81 errors, including the MCP server'
status: todo
type: task
priority: high
created_at: 2026-08-08T01:10:00Z
updated_at: 2026-08-08T01:10:00Z
---

`src/**`, `schemas/**`, `content/**` and `scripts/**` are all in
`tsconfig.json`'s `include` and all at zero. `adapters/**` is the last tree
outside it, and the largest: **81 errors**, measured on a clean checkout.

It is not dead code. It holds the MCP server (`adapters/mcp-server/server.ts`),
which is a live service, and `adapters/paper/resolver.ts`.

Reproduce with a throwaway config extending `tsconfig.json` and
`"include": ["adapters/**/*.ts"]`. Anything done in `adapters/` must measure
against the 81 baseline — the project `tsc` is green regardless and says
nothing about this tree.

## The known shape of it

Two errors are `Cannot find name 'e'` (`server.ts:162`, `:211`) — the same
`catch` binding class already fixed twice elsewhere in this repo.

The bulk is the discriminated union. Annotating the block imports as `<Block>`
adds **27 errors**, because the consuming code reads `examples` / `proofs` /
`lean` / `tex` / `caption` across kinds without narrowing. `Block` is the
correct type; the code is what is wrong. That narrowing is the substantial
piece of work here, and it is also what unblocks the largest remaining
`no-explicit-any` bucket (bean `lnt1`): 88 `as any`, dominated by this tree.

Do NOT annotate and revert as I did — that was right only as a holding action.
Narrow properly, then annotate, then drain, then widen `include`.

## Already paid off once

Typing the PAPER imports as `<Paper>` immediately exposed that
`PaperOutline.macros` was declared `Record<string, string>` while
`Paper.macros` is `Record<string, PaperMacro>` — `{ tex, unicode? }` objects,
which is what the viewer reads. Values passed through untouched so nothing
broke, but any consumer doing string work on them would have got
"[object Object]". Fixed; the rest of the tree will have more of these.
