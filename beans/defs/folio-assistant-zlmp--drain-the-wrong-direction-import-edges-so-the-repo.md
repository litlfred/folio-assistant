---
# folio-assistant-zlmp
title: Drain the wrong-direction import edges so the repo split can cut
status: in-progress
type: task
created_at: 2026-09-18T21:55:40Z
updated_at: 2026-09-19T00:54:54Z
---


## The measurement

`bun run check:partition`. A wrong-direction edge is a lower layer importing
from a higher one; after a cut each is a **circular dependency between
repositories**, so the number has to reach zero.

| | edges | unassigned |
|---|---|---|
| start, 2026-09-18 | 51 | 4 |
| after `lean-packages` | 44 | 4 |
| after `markdown-ast` | 43 | 4 |
| after judging the last six | 49 | 0 |
| after four harness-owned schemas | 41 | 0 |
| after splitting the MCP server | **35** | **0** |

**The count rose at the end because the measurement improved.** Thirteen edges
were excluded while one endpoint was unjudged — the tool says so itself: "these
are not cross-edges — they are edges this tool declined to judge. Do not read
them as clean." Six of the thirteen are wrong-direction. 49 is the first
number that means what it says.

## Landed

- **`schemas/lean-packages.ts` → core** (−7). The `lean.ref` grammar belongs
  wherever the field does, and the field is on `BlockBase` in core. Its
  `DEFAULT_LEAN_PACKAGES` — three qou-family folios hardcoded in the platform —
  is gone; `leanPackagesConfigured()` now separates "nobody has said" from
  "there are none".
- **`content/pipeline/markdown-ast.ts`** (−2 core→sci). The remark pipeline,
  the AST cache and `collectReferencedTerms` were inside a 1,935-line LaTeX
  renderer. `leanStatusBucket` — a pure three-way switch with no LaTeX in it —
  moved next to the `lean` field it classifies.
- **Six modules judged**, unassigned 0: `src/mcp/project.ts`,
  `check-tools.ts`, `kg-export.ts`, `harness-schema-export.ts`,
  `sync-docs-harness.ts`, `check-workflows.ts` — all harness.

## The finding that governs the rest

**The composition mechanism already exists and is half-wired.**
`schemas/contributions.ts` (`ContributionRegistry`, Phase 0.1 of #223) walks
the dependency tree at load time, registers what each dependency adds,
**throws on a collision rather than resolving by load order**, and treats a
diamond re-registration as a no-op. It carries `blockKinds`, `adapter` and
`tools`.

It does **not** carry QA checkers or renderers, and there is **no singleton** —
`schemas/harness-config.ts:465` constructs one per call. So a pipeline module
has nothing to consult, and wires the other layer in directly instead:

```ts
// content/pipeline/qa-sweep.ts:444 — core hardcoding smart-base
const checker = AUTOMATED_CHECKERS[criterionId] ?? DAK_AUTOMATED_CHECKERS[criterionId];
```

The same shape is what `content/pipeline/build.ts` and `validate.ts` do with
`renderChapter` and `validateLatexAst`: core calling the science layer directly
because there is no seam to call through.

So the remaining edges are substantially **one defect, repeated** — behaviour
that predates the registry and was wired point-to-point. Extending the registry
to carry checkers and renderers, and giving the pipeline a resolved-tree
instance to consult, is the fix for most of what is left. That is the same
thing as "all renderings should be able to fire up in a dependency tree".

## Still to do

- Extend `FolioContribution` with QA checkers and renderers; give the pipeline
  a registry resolved from the dependency tree to consult.
- Rewire `qa-sweep.ts` (core→base, 2), `build.ts` and `validate.ts`
  (core→sci, the remainder).
- The `adapters/mcp-server/*` cluster — 33 harness→core edges, the largest
  group and not yet investigated.
- `adapters/document/resolver.ts` declares `class PaperResolver`. The file is
  classified core by its `adapters/document/` path while its contents are the
  paper resolver. Noticed while draining; not yet acted on.

## Done when

`check:partition` reports 0 wrong-direction edges and 0 unassigned, with the
full gate battery green — and the re-analysis says whether the cut can be made.

## Update — 51 → 35, and the misclassification seam is exhausted

Two more tranches, both pure classification, nothing moved or rewired:

**Four harness-owned schemas** (−8). Grouping the 33 harness→core edges by
TARGET showed 21 of them pointing into `schemas/`, a directory claimed
wholesale by a core prefix rule while holding schemas from all three layers.
`tool.ts` and `tool-types.ts` (Tools are a harness graph kind), `kg-node.ts`
(the KG is harness) and `harness-config.ts` (the harness by name) were being
imported BY the harness that owns them. `jsonld.ts` and `types.ts` were
checked the same way and stay core — both are about the content BLOCK model.

**The MCP server** (−6). `adapters/mcp-server/` was harness by prefix, but
`server.ts` opens "QOU Paper Writing Assistant — MCP Server" and offers PDF
rendering, content validation, a Lean LSP proxy and a content viewer. It is a
CONTENT server. Split: core for the server, graph tools, validate, git, paths
and preferences; sci for `render.ts`, `lean.ts`, `preview.ts` (each needs TeX
or a Lean toolchain); harness for `check-deps.ts`. core→sci rose 12 → 16 in
the process, because `server.ts` is core now and still reaches for
`render-latex` — the edge moved rather than vanished, and saying so matters.

**All 16 edges drained so far were misclassification** — modules read by the
directory they sit in rather than by what they are for. That is now
exhausted: everything remaining is architectural.

## The blocker, stated once

**A composition root imports every layer, because that is its job.
`check:partition` measures imports, not intent.** Three independent clusters
have landed on this:

- `content/pipeline/qa-sweep.ts` — `AUTOMATED_CHECKERS[id] ?? DAK_AUTOMATED_CHECKERS[id]`
- `content/pipeline/build.ts` and `validate.ts` — calling `renderChapter` / `validateLatexAst`
- `adapters/mcp-server/server.ts` — wiring core and sci tools into one server

Three is not a coincidence; it is a missing concept in the model. The split
has to choose:

- **A** — a declared composition root, exempt from the partition rule. Honest,
  but exemptions grow.
- **B** — no built-ins: `dak` and the paper renderer become real dependencies
  with `contributes` modules, so the registry is the only path. Cleanest end
  state, most upheaval, and `CONTENT_ADAPTERS` stops being a compile-time
  union.
- **C** — built-ins self-register at the CLI entry point, pushing the edges to
  the outermost layer where they arguably belong.

Read: **B** as the destination, **C** as the step that reaches it without a
flag day. Not decided — it shapes the split, so it is the owner's call.

## Landed toward it

`ContributionRegistry` now carries `qaCheckers` under the rules it already
applied to block kinds, adapters and tools: registration walks the resolved
dependency tree, a collision throws naming both contributors rather than
resolving by load order, a diamond re-registration is a no-op, and an
unimplemented criterion returns `undefined` rather than a default pass.
`CheckerHit` / `CheckerResult` moved to `schemas/block-qa.ts` beside
`CheckerPaths` so the registry can type a contributed checker without
importing the pipeline.

The seam exists. What it is missing is a decision about who registers a
BUILT-IN adapter's contributions.

## Watch out for

Twice in one session CI went red on a collision invisible locally: main's MCP
projector read `ToolDefinition.summary` while this branch renamed it to
`description`, and main's `graph-kind-docs.test.ts` imported
`schemas/agent-harness.js` after this branch renamed it to `cat-harness.ts`.
CI builds the PR MERGED WITH MAIN — 1829 tests across 134 files locally, 1883
across 138 there. Merge main before trusting a local green.

_2026-09-19T00:54:54Z_ — The feedback cluster: 10 -> 6, and the reason the obvious fix failed twice. Measured at d26a96fd — reclassifying src/core/feedback.ts, src/routes/feedback.ts and src/routes/relevance.ts to core ALONE gives 11 edges, not 6, because src/server.ts, src/index.ts and src/routes/chat.ts then cross the line to MOUNT them: five new edges replace four. Content handlers mounted by a harness composition root cross whichever side holds them. That is why moving them was recommended and measured worse twice before the mechanism was understood. The fix is two steps and only works in this order. (1) src/route-groups.ts — routes resolved by VARIABLE specifier from a declaration, like tool-groups, qa-checker-discovery and render-discovery; each route module exports a mount* factory that casts what it needs out of an opaque services bag, so the cast lives in the layer that owns the type. Edge-neutral by itself, still 10, which is the expected result since all five route modules were harness. Order is behaviour here unlike the tool groups, because dispatch is first-match-wins, so the declaration order is asserted by test. (2) The reclassification, now a net win: four modules to core (the store plus the feedback, relevance and glossary routes), 10 -> 6. Three imports had to go first or the move would have traded four edges for three: the adapter now takes feedbackDir and builds its OWN FeedbackStore rather than being handed one by src/index.ts (a directory is a path, a store is content; ContentAdapter declares getFeedbackStore?(): unknown, so the harness declares the slot and the content layer fills it); the server's getFeedbackStore() was deleted rather than retyped because nothing called it; and handleChatPost's _feedbackStore parameter was deleted because it was never read — harmless while the store was the harness's, a wrong-direction import bought with nothing once it became core's, now pinned by a test. Six remain, unrelated to each other: harness-config -> contributions, schemas/index.ts -> dak-blocks, check-workflow-refs -> translation-tools, src/types.ts -> FeedbackItem/PaperMacro, corpus-gate -> qa-utils and -> block-module. PR #316.
