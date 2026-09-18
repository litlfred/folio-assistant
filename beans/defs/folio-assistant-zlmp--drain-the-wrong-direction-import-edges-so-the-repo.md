---
# folio-assistant-zlmp
title: Drain the wrong-direction import edges so the repo split can cut
status: in-progress
type: task
created_at: 2026-09-18T21:55:40Z
updated_at: 2026-09-18T21:55:40Z
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
| after judging the last six | **49** | **0** |

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
