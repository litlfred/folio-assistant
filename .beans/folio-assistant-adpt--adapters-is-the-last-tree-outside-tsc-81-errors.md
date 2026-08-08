---
# folio-assistant-adpt
title: 'adapters/** is the last tree outside tsc — 81 errors, including the MCP server'
status: completed
type: task
priority: high
created_at: 2026-08-08T01:10:00Z
updated_at: 2026-08-08T01:10:00Z
---

Claimed by session `3bada08b` on branch `claude/agent-4673-validation-9hffrd`.

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


## Resolved — 81 -> 0, and `adapters/**` is in `include`

Every tree is now compiled. A green `bun run typecheck` finally means what it
says.

**62 of the 81 were mine, and they were ReferenceErrors.** Commit `958c29e`
("lint: drain no-unused-vars 111 -> 0") stripped the `e` binding from 38 catch
blocks in `server.ts` whose bodies use it — `String(e)`, or the already-correct
`e instanceof Error ? e.message : String(e)`. Every one throws at the moment
its catch fires, i.e. exactly when something else has already gone wrong.
Confirmed zero were broken before that commit. `tsc` caught the equivalent
mistake in covered files at the time; these shipped because `adapters/**` was
not in the program, and they are now on `main`.

Three further defects, none mine, all invisible for the same reason:

- `resolveOutline(paperId, branch)` — no such function has ever existed; it is
  `resolvePaperOutline`. A ReferenceError on every request reaching it, so the
  MCP server's chapter-number auto-derivation has never run. From `109a4ff`.
- `--http` mode imported the SDK's NODE transport, whose
  `handleRequest(req: IncomingMessage, res: ServerResponse, body?)` was being
  handed a Bun `Request` and nothing else. The SDK ships
  `WebStandardStreamableHTTPServerTransport`, whose signature is
  `handleRequest(req: Request): Promise<Response>` — exactly what the `/mcp`
  route already called. Switched.
- `preview.ts` passed `detached: true` to `spawnSync`, which has no such
  option and blocks until the child exits — so opening a viewer would hold the
  tool call open for as long as the window stayed up. Now a detached `spawn`
  with `unref()`.

Interface-vs-reality drift, same family as the `macros` lie found earlier:
`ResolvedSection` never declared `subsections` though the resolver builds and
reads them; `ResolvedChapter` never declared `dir` or `tabLabel` and typed
`number` as required when appendices get `undefined`; `ChapterOutline` the
same. `ResolvedBlock.lean` omitted `sorryFree` — a real `LeanRef` field that
`render-latex` says "wins outright" for proof status — so the server dropped
it, and two response builders picked fields explicitly and lost it while a
third kept it. `ch._dir` was read and assigned nowhere at all.

Two `resolvePaper(id)` call sites dereferenced a `ResolvedPaper | null`
straight into `.chapters`, where every other handler in the file 404s.

VERIFIED BY RUNNING BOTH MODES after 40+ edits to that file: HTTP `/mcp`
returns a real `tools/list`, and stdio `initialize` returns a proper protocol
response.

## The `<Block>` narrowing: DONE

Annotating the block imports cost 27 errors across ten fields. Ten narrowing
accessors (`bLean`, `bProofs`, `bTex`, …) using the `in` operator — real checks,
not casts — plus `withSource` for the one spread that widened a required `ref`
to optional.

A blanket regex over `blk.<field>` over-applied to loops where `blk` is a
`ResolvedBlock` (which declares those fields directly), so those were reverted
by line range. That is the third time in this session a blanket replace has
over-reached; the lesson is not learned by writing it down, only by measuring
after.

**`blk.status` was a phantom.** Nine sites read it, including
`if (blk.status === "proved" || blk.status === "mathlib_ok") provedCount++`.
There is no block-level `status`: the schema says `FormalizationStatus` is
"derived at build time from .lean file content. NOT stored in content block .ts
manifests". So the MCP server's proof-status counters have always been 0, and
its `status` response field always `undefined`. Now derived from the block's
`lean` via `leanStatusBucket`, exported from `render-latex.ts` so there is one
mapping rather than two.

Measured live: 3124 blocks now report `stubbed: 2128, drafted: 967,
compiled: 29`. Note what that means — it reflects what the MANIFESTS declare
(`lean.validation` / `sorryFree`), not the build. The paper's 692/704
sorry-free figure comes from `lean-coverage.ts` inspecting real `.lean` files,
which is precisely why the schema keeps build-derived status out of manifests.

## And the server was rooted in the wrong repo

Found by trying to verify the above against the folio: `paths.ts` set
`REPO_ROOT = resolve(import.meta.dir, "../..")`, the PLATFORM. Every constant
derives from it — `CONTENT_DIR`, `CHAPTERS_DIR`, `MAIN_TEX`, `LEAN_DIR`,
`BUILD_DIR`, `TODOS_DIR` — and all are folio concepts that do not exist there.
Run from the qou checkout it answered `Paper not found` for every paper, and
its git operations ran against the platform repo rather than the content
branches it exists to switch between.

Seventh instance of this defect class, after `q-usage-audit`, `validate`,
`validate-bib`, `export-json`, `readme-metadata` and `refresh-authors-note`.
Fixed with `findContentRepoRoot()`; the server now reports
`repo: /workspace/qou` and serves 35 chapters / 3124 blocks.
