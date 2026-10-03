---
# folio-assistant-zlmp
title: Drain the wrong-direction import edges so the repo split can cut
status: in-progress
type: task
priority: normal
created_at: 2026-09-18T21:55:40Z
updated_at: 2026-09-22T18:19:04Z
parent: folio-assistant-vke6
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

_2026-09-19T00:41:16Z_ — Re-measured 2026-09-19 on main at 17dc1e6 — GENUINELY LIVE, do not treat as stale. 'bun run check:partition' reports 16 wrong-direction edges (agentic-harness -> folio-assist-core 11, folio-assist-core -> folio-asst-sci 4, folio-assist-core -> smart-base 1), down from the 49 this bean last recorded, against a target of 0. Also 3 modules unassigned, where the bean's table records 0 — the tool declines to judge 4 edges touching them and says so rather than counting them clean. PR #304 ('Drain the wrong-direction imports to 10') is open on this.

_2026-09-19T00:54:54Z_ — The feedback cluster: 10 -> 6, and the reason the obvious fix failed twice. Measured at d26a96fd — reclassifying src/core/feedback.ts, src/routes/feedback.ts and src/routes/relevance.ts to core ALONE gives 11 edges, not 6, because src/server.ts, src/index.ts and src/routes/chat.ts then cross the line to MOUNT them: five new edges replace four. Content handlers mounted by a harness composition root cross whichever side holds them. That is why moving them was recommended and measured worse twice before the mechanism was understood. The fix is two steps and only works in this order. (1) src/route-groups.ts — routes resolved by VARIABLE specifier from a declaration, like tool-groups, qa-checker-discovery and render-discovery; each route module exports a mount* factory that casts what it needs out of an opaque services bag, so the cast lives in the layer that owns the type. Edge-neutral by itself, still 10, which is the expected result since all five route modules were harness. Order is behaviour here unlike the tool groups, because dispatch is first-match-wins, so the declaration order is asserted by test. (2) The reclassification, now a net win: four modules to core (the store plus the feedback, relevance and glossary routes), 10 -> 6. Three imports had to go first or the move would have traded four edges for three: the adapter now takes feedbackDir and builds its OWN FeedbackStore rather than being handed one by src/index.ts (a directory is a path, a store is content; ContentAdapter declares getFeedbackStore?(): unknown, so the harness declares the slot and the content layer fills it); the server's getFeedbackStore() was deleted rather than retyped because nothing called it; and handleChatPost's _feedbackStore parameter was deleted because it was never read — harmless while the store was the harness's, a wrong-direction import bought with nothing once it became core's, now pinned by a test. Six remain, unrelated to each other: harness-config -> contributions, schemas/index.ts -> dak-blocks, check-workflow-refs -> translation-tools, src/types.ts -> FeedbackItem/PaperMacro, corpus-gate -> qa-utils and -> block-module. PR #316.

## Re-measured and mapped, 2026-09-19 (main at `87e4c63`)

**6 wrong-direction edges, 0 unassigned** — down from the 49 recorded above,
and from 16 when I measured earlier the same day. `check:partition:edges` names
every one:

| # | from (lower layer) | to (higher layer) | kind |
|---|---|---|---|
| 1 | `schemas/harness-config.ts` | `schemas/contributions.ts` | value import |
| 2 | `schemas/index.ts` | `schemas/dak-blocks.ts` | barrel `export *` |
| 3 | `scripts/check-workflow-refs.ts` | `schemas/translation-tools.ts` | **already dynamic** `await import()` |
| 4 | `src/types.ts` | `schemas/types.ts` | **`import type` only**, re-exported |
| 5 | `src/workflow/corpus-gate.ts` | `content/pipeline/qa-utils.ts` | value import |
| 6 | `src/workflow/corpus-gate.ts` | `content/pipeline/block-module.ts` | value import |

**None of the six is a misplaced file.** Each is either a layer-classification
decision or a dependency inversion. That is worth stating plainly, because the
count has fallen steadily so far by moving things, and the remainder will not
yield to that.

### A hypothesis, tested and disproved — do not retry it

`schemas/contributions.ts` looked misfiled. Its own doc comment says it exists
*for* the five-repo split — it is the mechanism by which a dependency
contributes block kinds, adapters and tools, written because `folio-asst-sci`
must own the math kinds. Registering contributions reads as harness work; only
what gets registered is core's. So I hand-triaged it to `harness` and re-ran.

**The count went UP, 6 -> 7.** Edge 1 disappeared and two replaced it:

    schemas/contributions.ts (agentic-harness) -> schemas/block-qa.ts (folio-assist-core)
    schemas/contributions.ts (agentic-harness) -> schemas/block-kinds.ts (folio-assist-core)

Because `contributions.ts:57-58` imports `CheckerPaths`/`CheckerResult` and
`ADAPTER_BLOCK_KINDS`/`CONTENT_ADAPTERS`. **The contribution mechanism is
expressed in core's own vocabulary, so it cannot sit above core.** Edge 1 is
therefore genuine, not misfiling: the harness config loader really does depend
on a core-typed registry. Reverted.

### What each remaining edge would actually take

- **1** — dependency inversion. `harness-config` should not know about
  contributions; the registry is passed in, or the loader splits in two.
- **2** — a barrel aggregating across a layer boundary. Either `schemas/index.ts`
  stops re-exporting `dak-blocks`, which changes a public import path, or
  `dak-blocks` is not smart-base. A classification call.
- **3** — already lazy, so it costs nothing at runtime. Invert by passing the
  translation config in, or reclassify the script as folio-layer.
- **4** — `import type` only, and the comment above it records that this edge is
  the FIX for a previously drifted hand-written copy. Undoing it reintroduces
  that drift. The real answer is that `FeedbackItem` belongs in the lower layer
  and core should import it — an inversion, not a deletion.
- **5, 6** — the largest. `checkCorpusGate` reads block manifests, so a
  harness-layer gate depends on core's content handling. Inversion means the
  readers become parameters, changing the signature of a shipped gate that
  `scripts/check-corpus-gate.ts` and `scripts/tests/corpus-gate.test.ts` call.

### Why this stops here

Every remaining edge is an architecture decision about where the five-repo
split cuts, and that is #223's owner's call. The counter exists to surface these
decisions; driving it to zero by reclassifying modules until the number looks
right would defeat it — as the disproved hypothesis above shows, a plausible
reclassification can make things worse while looking like progress.

## Edges 5 and 6 drained, 2026-09-19 — 6 -> 4

Owner asked for the `corpus-gate` inversion. Done, and it took **both** halves;
either alone does nothing.

**The inversion.** `labelFor` was the only consumer of the two core imports, so
it moved out of `src/workflow/corpus-gate.ts` and became a required
`CorpusGateOptions.labelFor: LabelForPath`. Required rather than defaulted: a
default would have to import the content pipeline in the gate, which is the
dependency the parameter exists to remove. `scripts/check-corpus-gate.ts` and
`scripts/tests/corpus-gate.test.ts` supply the real resolver — a stub in the
test would have left the production path uncovered.

**Measured after the inversion alone: still 6.** The two edges simply moved
from `corpus-gate.ts` to `check-corpus-gate.ts`, both harness. This is the same
trap as the disproved `contributions.ts` hypothesis above, and worth stating:
**inverting a dependency does not remove a cross-layer edge if the new holder
sits in the same layer.**

**The classification.** `scripts/check-corpus-gate.ts` was triaged `harness` on
"editing-process authorisation gate". `AGENTS.md` says it runs **in a folio
repo**, from that repo's pre-commit hook or CI, and the triage question is
whether a script reads PLATFORM or CONTENT — this one reads changed content
blocks. Enforcing a harness-defined process does not make the enforcer harness,
any more than a linter belongs to the language it checks. Re-triaged to core.

**Together: 6 -> 4.** `agentic-harness -> folio-assist-core` fell 5 -> 3.

Verified: `bun run check:partition` reports 4 with 0 unassigned; `bun test`
2114 / 0 fail; tsc and eslint clean; `check-corpus-gate.ts` still runs.

### Remaining 4

| from | to | what it needs |
|---|---|---|
| `schemas/harness-config.ts` | `schemas/contributions.ts` | inversion — the registry is passed in, or the loader splits |
| `schemas/index.ts` | `schemas/dak-blocks.ts` | barrel crossing a layer; drop the re-export or reclassify `dak-blocks` |
| `scripts/check-workflow-refs.ts` | `schemas/translation-tools.ts` | already lazy; invert or reclassify the script |
| `src/types.ts` | `schemas/types.ts` | `import type` only, and **this edge is the fix** for a drifted `FeedbackItem`; the answer is to move the type down, not delete the import |


## RE-MEASURED 2026-09-20, after #477 — the count is now 0

`bun run check:partition --edges` on `main` at `4cdd77d7d8`:

```
Partition — 679 modules, 1534 internal import edges
  agentic-harness    163   folio-assist-core  177   folio-asst-sci  40
  smart-kg             0   smart-base           6   (test material) 293
  unassigned           0
Wrong-direction edges: 0
Edges touching an unassigned module: 0
```

The bean's body records **4** remaining, measured 2026-09-19 and each named
with its fix (`harness-config.ts`→`contributions.ts`,
`schemas/index.ts`→`dak-blocks.ts`, `check-workflow-refs.ts`→
`translation-tools.ts`, `src/types.ts`→`schemas/types.ts`). All four are
gone, and `unassigned` is 0 as well, so this is not the vacuous reading the
tool warns about — a classification gap would show there rather than as a
clean edge count.

**This matters beyond the bean.** `vke6` names this as the gate for the whole
cut: *"a lower layer importing from a higher one becomes a circular
dependency BETWEEN REPOSITORIES the moment the cut happens, so that count has
to reach zero before anything else here is safe."* On this measurement the
gate is clear and `wggr` / `b5f0` / `zmdo` are no longer waiting on it.

Recorded rather than resolved: this bean belongs to another session, and
`bean-coordination` says never resolve a sibling's. Whoever owns it should
check the four fixes actually landed (rather than the edges being hidden by a
re-classification under #477's new instances) and then close it.

_Recorded by session_017PqeiS4JYySSWGAYLedmus._

## VERIFIED 2026-09-21 — the zero is real, and the cut is still not free

The entry above asked whoever owns this bean to check that the four fixes
actually landed *"rather than the edges being hidden by a re-classification
under #477's new instances"*, and then close it. Both halves done.

### Re-measured

`bun run check:partition` on `main` at `6ab8f037`: **785 modules, 1756 internal
edges, 0 wrong-direction, 0 unassigned, 0 unresolved.** The tree has grown by
106 modules and 222 edges since the `4cdd77d7d8` reading above, so this is not
that measurement repeated.

### The four, one at a time

Checked with the tool's own module map (`analyse().modules`, instance-relative
keys) rather than by re-running the summary — the summary is the number under
test, so reading the answer off it would be circular.

| # | edge | what changed | verdict |
|---|---|---|---|
| 1 | `schemas/harness-config.ts` → `schemas/contributions.ts` | the **import is gone**; `harness-config.ts` now imports only `zod`, `node:fs`, `node:path`, `./content-type`, `./cat-harness` and a side-effect `./folio-graph-kind` | drained at the dependency |
| 2 | `schemas/index.ts` → `schemas/dak-blocks.ts` | `export * from "./dak-blocks.js"` is **still there**; `dak-blocks` is now `core (triage)`, not `base` | **reclassified** — and legitimately |
| 3 | `scripts/check-workflow-refs.ts` → `schemas/translation-tools.ts` | the `await import()` is **still there**; `translation-tools` is now `harness (rule)`, so both endpoints are harness | **reclassified** — and legitimately |
| 4 | `src/types.ts` → `schemas/types.ts` | the import is **gone**, replaced by `TodoRef` / `MacroDef` — structural subsets, neither a copy nor an import (bean `jcmx`) | drained at the dependency |

Two of the four went by reclassification, which is exactly what this bean asked
to be ruled out. Both survive the check, because the question is not *whether*
a module was reclassified but whether the reclassification carries evidence:

- **`dak-blocks` → core** cites the core's own declaration: `schemas/block-kinds.ts`
  (core) declares `CONTENT_ADAPTERS = ["paper", "dak"]` and `DAK_BLOCK_KINDS`, so
  the module defining those schemas cannot live in another repository from the
  union that names them. *"The classification was wrong, not the import."* What
  stays `smart-base` is the L2/L3 **authoring skills**. This was one of the two
  options this bean itself named for edge 2.
- **`translation-tools` → harness** cites the owner's cut of 2026-09-19 —
  *"f-a-core has high level processes only, no tooling"* — and is **measured
  against the alternative**: assigning the seven unassigned modules alone took
  wrong-direction edges 5 → 15; this ordering gives 4 and 0 unassigned.

`src/types.ts` deserves one note, because this bean recorded its edge as *"the
FIX for a drifted `FeedbackItem`; the answer is to move the type down, not
delete the import"* — and the import was in fact deleted. It did **not** go back
to the copy. The file now declares `TodoRef` and `MacroDef`, which name only
what a harness signature needs and are satisfied structurally by the richer core
types; the drift incident is kept in a comment because the hazard is permanent,
and generics were tried first and dropped on a measurement (nothing in the repo
reads a field off `.todos` or `.macros` through these shapes).

### The re-analysis this bean's "Done when" also asks for

**`check:partition` counts BUILD-TIME edges. A variable specifier is
deliberately not an edge** — `repo-partition` counts `import("./literal")` and
not `import(variable)`, and `qa-checker-discovery`, `render-discovery`,
`route-groups` and the tool groups all use that on purpose. The reasoning is
sound (*"the edge disappears exactly when the target stops being hardcoded"*),
but for a repository **split** it has a consequence the zero does not show: the
target still has to exist at runtime, and after the cut it exists **in another
package**.

Measured, by resolving each declaration and asking the partition tool for the
target's layer:

| resolver | layer | target | target layer | scope |
|---|---|---|---|---|
| `content/pipeline/qa-checker-discovery.ts` | core | `qa-checkers-cost.ts` | **sci** | 2 criteria |
| `content/pipeline/qa-checker-discovery.ts` | core | `qa-checkers-dak.ts` | **base** | 5 criteria |
| `content/pipeline/render-discovery.ts` | core | `render-latex.ts` | **sci** | the paper render target |
| `src/server.ts` route groups | harness | `src/routes/{feedback,glossary,relevance}.ts` | **core** | 3 routes |
| `src/server.ts` tool groups | harness | `src/tools/translation.ts` | **core** | 1 group |

The other 7 checker modules are core, same layer as their resolver, and
`render-markdown.ts` is core — so this is 5 declarations, not a systemic leak.

**This is the same blocker this bean already states, now with a number.** The
three clusters it named — `AUTOMATED_CHECKERS[id] ?? DAK_AUTOMATED_CHECKERS[id]`,
`renderChapter`/`validateLatexAst`, and the MCP server wiring — did not go away;
they became variable-specifier lookups, which is a real improvement (the
build-time dependency is gone and the target is now declared data) and is not
the same as the dependency being gone. The A/B/C decision recorded above is
still what stands between this zero and a safe cut.

**One thing the route and tool declarations already do that the others do not**:
they carry an explicit `layer:` field per entry, so a reader can see from the
declaration which mounts cross the line. `QaCriterionDefinition.source_file` and
the render-target declarations carry no such field, which is why the table above
had to be computed rather than read. Making that symmetric would let the cut be
*planned* from the declarations instead of rediscovered — proposed, not done,
because it is part of the same owner decision.

### Status

The **build-time gate this bean exists for is clear**: 0 wrong-direction, 0
unassigned, `bun run gates` 85 of 85. `wggr` / `b5f0` / `zmdo` are not waiting
on it. Left `in-progress` rather than completed for one reason: the "Done when"
also asks whether the cut can be made, and the honest answer is *not yet* — five
declared runtime edges cross layers, and who registers a built-in adapter's
contributions (A / B / C above) is still the owner's open call.

### The A/B/C decision is settled — `rfev`

Owner, 2026-09-21: **C now, B as the destination.** Built-ins self-register at
the outermost layer, and each converts to a real `contributes` dependency one
at a time rather than on a flag day. Carried into `folio-assistant-rfev`, which
also records the first thing that had to be fixed before any registration was
possible: a contributed QA checker had no source file, so it could not be
freshness-hashed, and every one would have arrived with verdicts that can never
go stale.

### One of the five runtime edges is drained, and one entry above is stale

`rfev`'s vertical slice moved `qa-checkers-cost.ts` into `folio-assistant-sci`,
which now contributes its two checkers through the repository's first
dependency edge. `qa-checker-discovery` resolves **no sci path** any more: a
contributed checker arrives as a function, so the contributor imported its own
module and core names nothing. Four of the five remain.

**Stale entry, corrected:** the table above records `build.ts` as *core*
calling `renderChapter` in sci. `build.ts` is classified **sci** today, and so
are all four importers of `render-latex.ts`. That changes what draining the
renderer edge costs — moving `render-latex.ts` alone would trade one runtime
edge for four cross-instance imports, the same trap this bean records twice.
The sci cluster is 39 modules and moves as a unit, under `zmdo` / `wggr`.

`qa-checkers-dak.ts` is blocked on something simpler: there is no `smart-base`
instance in this checkout at all.


## RE-MEASURED 2026-09-22 on `main` at `b7f8945b` — still zero, and the gate battery has grown

_Stream 1/3 (`upgd`)._ `bun run check:partition`, run rather than quoted:

    Partition — 920 modules, 2045 internal import edges
      agentic-harness  226   folio-assist-core  224   folio-asst-sci  39
      smart-kg  0   smart-base  7   (test material) 424   unassigned  0
    Wrong-direction edges: 0
    Edges touching an unassigned module: 0

`bun run gates` — **123 of 123, exit 0**, 10,270 tests across 398 files. This
bean's §Status records "85 of 85"; the set has grown by 38 gates since and is
still clean, which is a stronger result than the one recorded.

**Nothing here changes this bean's own verdict.** §Status is right that the
build-time gate is clear while the "can the cut be made" half is not, and it is
right about why: the declared runtime edges, and the A/B/C registration
question — now settled as **C now, B as the destination** and carried into
`rfev`, with one of the five runtime edges already drained.

### What the re-verification is FOR: this bean is not on the critical path

`upgd`, the stream claim, states the path as **`wggr` → `zlmp` → `rnfl`**. That
ordering is wrong, and **this bean already says so** in its own §Status:

> `wggr` / `b5f0` / `zmdo` are **not waiting on it**.

`vuip` states the path differently again — *"wggr, then b5f0 / zkgs, then
zmdo"* — so the two statements of the same path disagree with each other and
one of them disagrees with the bean it names. Anything sequenced behind `zlmp`
is sequenced behind a box that is open for descendant work (`rfev`) and is
gating nobody.

Left `in-progress`, unchanged, for exactly the reason §Status gives. What is
withdrawn is its position in the path, not its status.
