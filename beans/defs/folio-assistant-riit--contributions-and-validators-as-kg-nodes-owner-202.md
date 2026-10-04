---
# folio-assistant-riit
title: CONTRIBUTIONS AND VALIDATORS AS KG NODES (owner 2026-10-04)
status: todo
type: feature
created_at: 2026-10-04T17:42:33Z
updated_at: 2026-10-04T17:42:33Z
parent: folio-assistant-fs43
---

Owner, 2026-10-04, on the audit's open question (should `*/contributions.ts` become declared nodes?): **option 2, all of it as nodes, "+ validators need to be in KG too"**.

## What exists, measured 2026-10-04
- `schemas/contributions.ts` defines the contribution shapes in TypeScript: BlockKindContribution, AdapterContribution, ToolContribution, QaCheckerContribution, RendererContribution and PipelinePluginContribution. A dependency names one `contributes` module in its config, and `loadContributions` imports and calls it (smart-base and folio-assistant-sci do).
- A validator is today a STRING on a kind, e.g. `fhir-harness:schemas/ig-ast.ts#AstManifestSchema`, resolved by `schemas/kind-validator.ts` `parseValidatorRef`. It is not a node.

## The rule
Every contribution is a node in the contributing harness's KG, declared like `kinds/`, and every FUNCTION it needs is a reference `<harness>:<path>#<export>`. A validator is a node too: what it validates (a `$schema` family), the reference to its Zod export, and its owner. A kind's `nodeSchemas` then names validator NODES rather than carrying path strings.

## Done when
- [ ] the owner agrees the node shapes for a validator and for each contribution type (one proposal, with the open choices put to them)
- [ ] validators are nodes, and kinds name them
- [ ] block kinds and adapters are nodes (sod4 #1 lands here: the paper block kinds first)
- [ ] checkers, renderers, pipeline plugins and MCP tools are nodes referencing their code
- [ ] `contributions.ts` modules are gone, or reduced to the code the nodes reference

Raised by the audit, folio-assistant-sod4.
