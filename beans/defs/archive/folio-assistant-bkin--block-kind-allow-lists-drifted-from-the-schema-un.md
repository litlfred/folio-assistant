---
# folio-assistant-bkin
title: 'Block-kind allow-lists drifted from the schema union — `table`/`algorithm` invisible'
status: completed
type: bug
priority: high
created_at: 2026-08-07T22:50:00Z
updated_at: 2026-08-07T22:50:00Z
---

Claimed by session `3bada08b` on branch `claude/agent-4673-validation-9hffrd`.

`schemas/types.ts` defines the block discriminated union `Block` with **15**
members. Five independent hand-maintained lists enumerate those kinds, and
**all five carry the same 13** — every one is missing `algorithm` and `table`:

| site | purpose |
|---|---|
| `content/pipeline/qa-utils.ts` `readBlockManifest` | the QA pipeline's block discovery |
| `content/pipeline/conjectural-propagation-sweep.ts` | conjectural-status propagation |
| `content/pipeline/audit-status-sections.ts` | status-section audit |
| `content/pipeline/migrate-cites.ts` | citation migration (dormant) |
| `src/blocks/registry.ts` | viewer render registry |

`readBlockManifest` returns `undefined` for an unrecognised builder, and
`walkBlocks` skips anything it returns `undefined` for. Measured on the qou
corpus: **461 blocks — `table` (445) and `algorithm` (16)** — are never
yielded, so they are never swept, never audited, and carry no sidecar. That is
~13% of the corpus structurally excluded from QA, silently.

Thirty of them do have sidecars, carrying 315 recorded criterion entries from
before the drift. Those are inert twice over: `walkBlocks` never reaches the
blocks, and `loadQaReport` rejects the files anyway because they predate the
`$schema: "block-qa/v1"` marker and it returns `undefined` for anything
without it — the same value it returns for a file that does not exist.

Fix: one exported `BLOCK_KINDS` constant beside the union, with a
compile-time exhaustiveness assertion so `tsc` fails if the two drift again,
and every consumer derived from it.

## Resolved

`BLOCK_KINDS` + `BLOCK_KIND_ALT` in `schemas/types.ts`, with a compile-time
mutual-exhaustiveness assertion against `Block["kind"]`. Verified it bites by
deleting `"table"` — `tsc` fails with TS2322 `Type 'true' is not assignable to
type 'never'`. All five consumers now derive from it.

Measured on qou: `walkBlocks` yields **3079 -> 3541** blocks.

Two things had to be fixed for that to be safe rather than destructive:

- `loadQaReport` rejected any sidecar lacking the `$schema` marker, returning
  the same `undefined` as for a missing file. Once the 30 previously-unreachable
  blocks became reachable, the next sweep would have bootstrapped empty reports
  over their 315 recorded entries. It now accepts on SHAPE and warns, and a
  corrupt sidecar warns instead of reading as absent. Verified on a real block:
  17 entries in, 18 out (one appended), marker written.

- Widening tsconfig to cover `schemas/**` immediately caught a ReferenceError
  shipped in 958c29e — see bean `folio-assistant-tsca`.
