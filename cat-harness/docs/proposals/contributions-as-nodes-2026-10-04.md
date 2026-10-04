---
title: "Contributions and validators as KG nodes"
kind: proposal
bean: folio-assistant-riit
summary: >-
  A harness contributes block kinds, an adapter, QA checkers, renderers,
  pipeline plugins and MCP tools by exporting TypeScript from a
  contributions.ts module, and a graph kind names its validators as path
  strings. Owner, 2026-10-04: all of it becomes declared nodes in the
  contributing harness's KG, with code referenced as <harness>:path#export, and
  validators are nodes too. This note proposes the node shapes, one loader for
  all of them, and the order, and puts three choices to the owner.
---

# Contributions and validators as KG nodes

Owner, 2026-10-04, on the audit's open question (bean `sod4`): **every contribution is a node, and "validators need to be in KG too"** (option 2 of 3). The audit ranked one finding first, *"block kinds first"*: the `paper` adapter's 16 block kinds are spread across about seven parallel tables. That finding lands here.

## What exists, measured 2026-10-04

- **Contributions** (`cat-harness/schemas/contributions.ts`). A dependency names one `contributes` module in its `<instance>.config.json`. `loadContributions` imports that module and calls its default export, which returns a `FolioContribution`. That object can carry:
  - `blockKinds[]`: `kind`, `adapter`, `builder?`, `labelPrefix?`, `folioType?`, `docoType?`;
  - `adapter`: `name`, `module`, `companionRoles?`;
  - `tools[]`: `name`, `register(server)`;
  - `qaCheckers[]`: `criterion`, `check(paths)`, `sourceFile`;
  - `renderers[]`: `format`, `adapters`, `render`, `validate?`;
  - `pipelinePlugins[]`: `kind`, `implementation`.

  smart-base and folio-assistant-sci contribute this way. The `paper` adapter's kinds do not: they are tables in cat-harness, which is sod4 #1.
- **Validators** are strings. A kind carries `validator: "fhir-harness:schemas/ig-ast.ts#AstManifestSchema"` or `nodeSchemas: { "<tag>": { validator: "…" } }`, which `schemas/kind-validator.ts` resolves through `parseValidatorRef`. Nothing declares a validator: a kind points at code.
- **The precedent is already built** (bean dmx1, the same day). Graph kinds became `kinds/` nodes (`folio-graph-kind/v1`), loaded lazily on first use across every instance's declared graph, with a name claimed by two files refused. The kind TABLE is now generated from them.

## Proposal

### 1. One node per contribution, in a graph its harness declares

| node | `$schema` | carries | code it references |
|---|---|---|---|
| block kind | `folio-block-kind/v1` | `kind`, `adapter`, `labelPrefix`, `types` (folio and DoCO), `headings` per locale, `profile`, `companions`, `builder` | none: it is data, and it replaces the seven tables |
| adapter | `folio-adapter/v1` | `name`, `companionRoles` | `module: <harness>:path#export` |
| QA checker | `folio-qa-checker/v1` | `criterion`, `sourceFile` | `check: <harness>:path#export` |
| renderer | `folio-renderer/v1` | `format`, `adapters` | `render`, and `validate?`, each a ref |
| pipeline plugin | `folio-pipeline-plugin/v1` | `kind` | `implementation: ref` |
| MCP tool | the existing Tool node in `tools/` | (unchanged) | gains `registrar: ref`, replacing `ToolContribution.register` |
| **validator** | `folio-validator/v1` | `validates` (the `$schema` family), `owner` | `schema: <harness>:path#Export` (the Zod export) |

A reference is the form validators already use, `<harness>:<path>#<export>`, so `parseValidatorRef` becomes the one parser for every reference.

### 2. One loader for every declared node graph

The `kinds/` loader is generalised:
- scan each instance's declaration for directories of a given graph kind;
- parse each JSON file against that kind's node schema;
- refuse a name two files claim, naming both files;
- load lazily, on first use.

Kinds, validators, block kinds and the rest all go through it. Reading the DATA stays synchronous. A function is imported only when a reference is called, which `loadContributions` already does asynchronously.

### 3. Order

1. **Validators**, because kinds already point at them and the move is mechanical: about 60 string references become node ids.
2. **Block kinds and the adapter**: the paper kinds, which is sod4 #1, the owner's first.
3. **QA checkers, renderers and pipeline plugins** from smart-base and folio-assistant-sci.
4. **MCP tools**: a registrar on Tool nodes.
5. **`contributions.ts` modules are deleted**, or reduced to exporting the functions the nodes reference.

## Choices for the owner

1. **Which way a validator's edge points.** The kind names its validator node, as `nodeSchemas` does today. Or the validator names the kind and family it validates, so the edge sits on the thing that knows (`derivedFrom`'s argument).
2. **One graph per contribution type, or one.** Separate graphs (`validators/`, `block-kinds/`, `checkers/`, `renderers/`) give each its own viewer and audit. A single `contributions/` graph of typed nodes means one directory per harness.
3. **Where a block kind's locale headings live.** On the block-kind node, as six fields. Or in the translation graph, where every other localised string already lives.

## What would falsify this

- **A contribution whose data cannot be separated from its code.** For example, a renderer whose `adapters` list is computed at load. Then the node would have to name a function returning data, and the "data as nodes" half would not hold for it.
- **A synchronous reader that needs a referenced FUNCTION at module load.** The loader is lazy and data-only; a reader that needs code at load would pull the dynamic import back into the hot path. The audit found none for validators, which resolve on demand. Each later step must re-measure this for its own contribution type.

## Not in scope

- Building anything before the owner answers the three choices.
- The tables the audit lists that are not contributions (sod4 #2 to #13). Each has its own row on sod4.
