---
# folio-assistant-riit
title: CONTRIBUTIONS AND VALIDATORS AS KG NODES (owner 2026-10-04)
status: in-progress
type: feature
priority: normal
created_at: 2026-10-04T17:42:33Z
updated_at: 2026-10-04T18:51:01Z
parent: folio-assistant-fs43
---

Owner, 2026-10-04, on the audit's open question (should `*/contributions.ts` become declared nodes?): **option 2, all of it as nodes, "+ validators need to be in KG too"**.

## What exists, measured 2026-10-04
- `schemas/contributions.ts` defines the contribution shapes in TypeScript: BlockKindContribution, AdapterContribution, ToolContribution, QaCheckerContribution, RendererContribution and PipelinePluginContribution. A dependency names one `contributes` module in its config, and `loadContributions` imports and calls it (smart-base and folio-assistant-sci do).
- A validator is today a STRING on a kind, e.g. `fhir-harness:schemas/ig-ast.ts#AstManifestSchema`, resolved by `schemas/kind-validator.ts` `parseValidatorRef`. It is not a node.

## The rule
Every contribution is a node in the contributing harness's KG, declared like `kinds/`, and every FUNCTION it needs is a reference `<harness>:<path>#<export>`. A validator is a node too: what it validates (a `$schema` family), the reference to its Zod export, and its owner. A kind's `nodeSchemas` then names validator NODES rather than carrying path strings.

## Done when
- [x] the owner agrees the node shapes for a validator and for each contribution type (one proposal, with the open choices put to them)
- [x] validators are nodes, and the validator names its family (ruling 2): 71 in cat-harness, 9 fhir-harness, 8 folio-assistant-core, 1 cat-openapi. The one exception is `models`: its code is in bootstrap-tools, another repository, so its string stays until bootstrap-tools declares the node
- [ ] block kinds and adapters are nodes (sod4 #1 lands here: the paper block kinds first)
- [ ] checkers, renderers, pipeline plugins and MCP tools are nodes referencing their code
- [ ] `contributions.ts` modules are gone, or reduced to the code the nodes reference

Raised by the audit, folio-assistant-sod4.

## 2026-10-04: the proposal, and the owner's three rulings

The proposal is `cat-harness/docs/proposals/contributions-as-nodes-2026-10-04.md`. The owner's rulings, each the recommended option:
1. one graph per contribution type;
2. a validator node names the `$schema` family it validates, and a kind lists only its families;
3. locale headings live in the translation graph, so a block-kind node carries only its English heading.

The order: validators, then block kinds and the adapter (sod4 #1), then checkers, renderers and pipeline plugins, then MCP tools, then delete the contributions.ts modules.


## 2026-10-04: step 2a — block kinds are discovered nodes (sod4 #1)

Owner rulings this step:
- Where the nodes live: *"2. Owners now"*. The 9 document kinds are in `folio-assistant-core/block-kinds/` and the 7 math kinds in `folio-assistant-sci/block-kinds/`. cat-harness's schemas read them upward through discovery; the alternative was keeping them in cat-harness until the schemas move.
- *"kinds need to be discoverable"* and *"not centrally managed"*.

What changed:
- `folio-block-kind/v1` (`schemas/block-kind-node.ts`) carries `kind`, `adapter`, `profile`, `builder?`, `labelPrefix`, `prefixEnforced`, `provable`, `folioType`, `docoType?`, `heading`, `headingPlural` and `indexRank?`.
- `block-kinds` is a meta-kind in BASE, with an avatar and the validator node `cat-harness/validators/block-kind-node.json`.
- `block-kinds.ts` DISCOVERS the kinds, and `BLOCK_KINDS` is no longer a literal. A kind two files declare is refused, naming both. A checkout with none is refused.
- `BlockKind` is now `Block["kind"]`, the TYPE read from code. The compile-time list proof is gone with the list. `block-kind-nodes.test.ts` checks that the typed kinds (BlockSchema's union members) equal the discovered kinds.
- Tables now read off the nodes:
  - `BLOCK_KINDS`, `MATH_BLOCK_KINDS` and `DOCUMENT_BLOCK_KINDS` (from `profile`), and `PAPER_BLOCK_KINDS`.
  - The builder map; `LABEL_PREFIXES` and `KNOWN_LABEL_PREFIXES`; `PROVABLE_LABEL_PREFIXES`.
  - jsonld's `BLOCK_KIND_TO_FOLIO_TYPE` and `BLOCK_KIND_TO_DOCO_TYPE`, and `KIND_PREFIXES`.
  - The English `KIND_HEADINGS`.
  - generate-index's plural headings, its INDEXED_KINDS and its reading order (`indexRank`).
- Behaviour kept: `prose` was never in LABEL_PREFIXES, so `prefixEnforced: false`. `figure` had no English heading row and fell back to "Figure", which the node now states.

Left, and why:
- **2b:** the five non-English heading locales move to the translation graph (owner's option 1).
- The per-kind Zod schemas and `BlockSchema`'s union are CODE in cat-harness/schemas/constraints.ts (option 3, not taken).
- About 6 pipeline audits spell `"thm:"`-style prefixes inline: conditional-class-banner-audit, audit-wiring, conjectural-propagation-audit and others.
- `CONTENT_ADAPTERS` and `ADAPTER_COMPANION_ROLES` belong to the adapter-node step.
