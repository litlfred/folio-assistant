---
# folio-assistant-z4mq
title: Zod modules are tool KG nodes that maintain the public JSON-LD / JSON Schema
status: todo
type: task
created_at: 2026-09-18T22:22:06Z
updated_at: 2026-09-18T22:22:06Z
---


## The requirement, in the author's words (2026-09-18)

> make sure schema skills and tools as separated well. the zod(.ts) should be
> tool KG nodes that implement maintaining a json-ld/json schema for public
> authoritative. it is the CODING convention of cat-harness that the zod/.ts
> toolchain is used to maintain INTERNAL the json schema. it is a REQUIREMENT
> that any instance of cat-harness is able to render its json-ld.

It restates, for the code, the split the author gave on 2026-09-18:

> external = The JSON-LD is definitional.
> internal = (maintenance of code/schemas) zod/typescript is definitional and
> json-ld is downstream.

## What follows from it

1. **Three graph kinds, cleanly separated.** `schemas`, `kg` (skills, roles,
   workflows) and `tools` are distinct. `schemas/` currently declares
   `graphs: ["schemas", "kg"]` and its files do **not** declare what they are —
   `@module` names the path, four files carry none, and three `.test.ts` files
   sit in the declared directory without being schema nodes. That is bean
   `xxxb`, and it is the same defect this bean has to fix one level up.

2. **A zod module is a TOOL node, not only a schema node.** Its job — the thing
   it *does* — is maintain the authoritative JSON Schema / JSON-LD. Today that
   relation is nowhere declared: `bun run kg:schema`
   (`scripts/harness-schema-export.ts`) and `bun run kg:export`
   (`scripts/kg-export.ts`) know which zod module feeds which artefact, and the
   knowledge lives in those scripts rather than in the graph.

3. **Rendering JSON-LD is a conformance requirement of every instance**, not a
   convenience of this one. Needs a check that an arbitrary cat-harness
   instance — including one whose `cat-harness.json` declares directories this
   repo does not have — can render its JSON-LD, and a "could not determine"
   third state that is never reported as a pass.

## Done when

- A zod module declares itself a tool node and names the artefact it maintains,
  so `kg:export` reads the relation from the graph instead of carrying it.
- `schemas/`, `skills/` and `tools/` each hold one declared kind, or the
  multi-kind ones carry in-file declarations (the `$schema` convention the
  workflow instances already use).
- A check fails when an instance cannot render its JSON-LD, and reports
  "could not determine" separately from "rendered".

## Not in scope here

The `tools/<stub>` / `skills/<stub>` per-instance layout convention
(separate ask, same session) and the marker-naming decision (`79t3`).

## Done already (2026-09-18, `claude/festive-galileo-s7ibx0`)

Author's follow-up: *"json-ld render should include metadata (timestamp,
commit sha)."* — done in `73d2c9e4`. `scripts/kg-export.ts` now emits
`sourceCommit` (`prov:wasDerivedFrom`, the commit's web URL),
`sourceCommitSha`, `sourceCommitAt`, `sourceTreeDirty` and
`sourceCommitUnavailable`, all declared in `@context` so they survive
expansion to RDF. Four states kept distinct: clean, dirty (SHA rides with the
flag), no-git (reason, never a placeholder), and status-unanswerable
(`sourceTreeDirty` absent rather than `false`).

Provenance deliberately does NOT go in `problems`, whose contract is "sources
that could not be read" — a dirty checkout is the normal state of a
developer's machine, and routing it there would make `problems: []` fail on
every local run.

**What remains for this bean is unchanged**: the zod modules declaring
themselves TOOL nodes that maintain the JSON-LD, and rendering JSON-LD being a
checked conformance requirement of an arbitrary instance rather than a thing
this repo happens to do.
