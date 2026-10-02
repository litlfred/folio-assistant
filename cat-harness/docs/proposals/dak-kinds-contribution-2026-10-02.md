---
title: "DAK block kinds as a smart-base contribution"
kind: proposal
issue: 1767
summary: >-
  Bean 1335, the remainder of stage D of the smart-* separation. Core's content
  model still names DAK — the `dak` adapter, its 21 block kinds, the ten
  components — so dak-blocks.ts cannot leave for smart-base without core
  importing a harness. The registration path already exists (ContributionRegistry,
  loadContributions, and folio-assistant-sci uses it); smart-base becomes its
  first contributor of an ADAPTER and BLOCK KINDS. Measured first: no content in
  the repository uses a DAK block builder, so the move changes how no existing
  folio parses.
---

# DAK block kinds as a smart-base contribution

Owner, 2026-10-01, on stage D: *"Split: move 2 now, bean the rest"* — `dak.ts`
and `dak-content-type.ts` moved to `smart-base/schemas/` in #1795, and the rest
is bean `1335`. Owner, 2026-10-02: write this note and implement now, stacked
on #1830.

## What was measured

- **Core names DAK in 21 TypeScript files** outside smart-base, most heavily
  `cat-harness/schemas/block-kinds.ts` (`CONTENT_ADAPTERS = ["paper", "dak"]`,
  `DAK_BLOCK_KINDS`, `DAK_KIND_BUILDERS`, `DAK_LABEL_PREFIXES`,
  `DAK_COMPONENTS` and its four companion tables), `schemas/dak-blocks.ts`,
  `scripts/gen-dak-components-figure.ts`, `content/pipeline/qa-criteria-registry.ts`,
  `content/pipeline/qa-checkers-dak.ts` and `schemas/jsonld.ts`.
- **The registration path exists and is in use.** `schemas/contributions.ts`
  (`ContributionRegistry`) accepts contributed block kinds, an adapter, QA
  checkers, tools, renderers and pipeline plugins; `loadContributions` walks the
  resolved stack; `qa-sweep` and the MCP server call it.
  `folio-assistant-sci/contributions.ts` already contributes QA checkers and a
  tool. Nothing contributes an adapter or block kinds yet.
- **No content uses a DAK builder.** None of the 21 builder names
  (`healthIntervention(`, `decisionTable(`, …) occurs in any manifest outside
  `cat-harness/`. The DAK kinds are defined and unexercised — which is what
  makes moving them low-risk, and also why the move must not quietly widen
  into "support DAK authoring", which is a different bean.

## The one thing that is not a move

Some of core's DAK uses are **compile-time**: `DakBlockKind`, the `AnyBlockKind`
union, `ADAPTER_BLOCK_KINDS: Record<ContentAdapter, …>`, and
`ALL_BLOCK_BUILDER_ALT`, a regex over every builder name built when the module
loads. Registration happens at runtime, so a runtime contribution cannot feed a
compile-time union. The design therefore narrows core's types to what core
OWNS — the paper adapter — and makes "every kind, including contributed ones" a
runtime question asked of a registry:

| core today | after |
|---|---|
| `CONTENT_ADAPTERS = ["paper", "dak"]` | `["paper"]` — the built-in adapters only |
| `ALL_BLOCK_KINDS`, `AnyBlockKind` | built-in kinds; contributed kinds come from the registry |
| `ADAPTER_BLOCK_KINDS.dak` | the registry's kinds for adapter `dak` |
| `ALL_BLOCK_BUILDER_ALT` (DAK builders included) | built-in builders; a parser handed a registry adds the contributed ones |
| `DAK_*` tables, `dak-blocks.ts`, `qa-checkers-dak.ts`, `gen-dak-components-figure.ts` | `smart-base/` |

`ContributionRegistry`'s refusal to let a contributor redefine a built-in kind
stays as it is — and is what makes the narrowing safe: once `dak` is no longer
built in, smart-base registering it is not a collision.

## smart-base's contribution

`smart-base/contributions.ts`, named by `contributes` in smart-base's config as
folio-assistant-sci's is:

- `adapter: { name: "dak", module: … }`
- `blockKinds`: the 21 DAK kinds, each with its builder name and label prefix —
  so a contributed kind carries what a built-in one carries
- `qaCheckers`: the DAK checkers, moved from `qa-checkers-dak.ts`

## Readers

| reader | today | after |
|---|---|---|
| `schemas/jsonld.ts` | `DAK_KINDS_WITHOUT_DOCO_TYPE` | a contributed kind says whether it has a DoCO type |
| `content/pipeline/qa-criteria-registry.ts` | criteria scoped `adapters: ['dak']` | those criteria come with smart-base's checkers |
| `schemas/translation-tools.ts` | `contentType 'dak'` | unchanged string — a content type is data, not an import |
| `gen-dak-components-figure.ts` | core script | `smart-base/scripts/` — it is DAK's figure; `gen-document-kinds.ts` already imports it from there |

## What would falsify this, and what is out

- **Falsified if** a built-in path needs a DAK kind at compile time for a reason
  other than listing it — a type that must accept a DAK block in core code.
  None was found; if one surfaces, it is reported, not cast around.
- **Out:** making `paper` a contribution too (bean `zlmp`'s wider aim), and any
  DAK authoring support. This moves what exists; it adds nothing.

## Verification

`tsc --noEmit`; `bun test`; `check:partition:edges` with **0 new edges** and the
existing DAK edges gone; kg-export Schema node ids unchanged except for moved
paths; regen at a fixed point.
