---
name: glossary-terms
description: >
  Add terms to an instance's glossary: local SKOS terms (folio-glossary/v1) with
  a definition, a code and links to external SKOS concepts, and references to
  whole external schemes. Rendered on the glossary/ page; gated by
  check:glossary.
adapters: [document, paper, dak]
profiles: [document, paper]
consulted: true
graph-kinds:
  - glossary
---

# Glossary terms

The owner, 2026-09-23: *"put glossary into folio-assistant-core"*, *"it should
be part of general pracice w/ glossary/ page. check harnesses"*, and *"can
glossary be refefences to external skos schema?"*. Yes, and that is the
preferred way.

## Where terms go

Core's `glossary` graph kind. Core declares `glossary/` with
`dependents: reproduce`, so every folio built on core has one. Each
`*.glossary.json` is one SKOS concept scheme, `$schema: "folio-glossary/v1"`
(`folio-assistant-core/schemas/glossary.ts`).

## Reference first, define second

| you have | write |
|---|---|
| a term somebody else already defines in SKOS (ISCO-08, an EU authority table, a W3C vocabulary) | a local term with `exactMatch` (or `closeMatch`, `broadMatch`, `narrowMatch`) to the external concept IRI. **Do not copy its definition.** |
| a list of external terms this folio uses | `members`: the external concept IRIs, emitted as a `skos:Collection` |
| a whole external scheme | a `remoteGraphs` entry in the declaration with `graphKinds: ["glossary"]`: known about, not held |
| a term only this folio defines | a local term with `prefLabel`, `definition`, and `notation` for its code |

## Three states, never two (bean `lqo9`)

- `authored`: a person wrote or approved the definition. It must have one.
- `candidate`: extracted from a source and not yet curated. It may have no
  definition, and the page marks it.
- `could-not-extract`: the source names a term the extractor could not read.
  It carries a `reason` a person can act on.

A candidate is never presented as a definition. An extractor writes
candidates; only a person moves one to `authored`.

## IRIs

A term's IRI is `<instance namespace>glossary/<scheme id>/<term id>`, in the
instance's namespace, never the asset's: moving the asset must not move the
term (bean `lqo9`, 2026-09-21).

## Then

`bun run glossary:page` writes `docs/glossary/index.md` (A–Z, a filter box,
schema.org `DefinedTermSet` JSON-LD) and one SKOS JSON-LD file per scheme under
`docs/assets/glossary/`. `bun run check:glossary` is the gate: it fails on a
document that does not validate and on a stale page.

The harness's swimlane-role terms (`swimlane-glossary`, the
[`swimlane-glossary`](swimlane-glossary.md) skill) are one more source the page
links to, not copies of.

## Extracted terms (bean `lqo9`, piece 1)

`glossary:page` also extracts a `candidate` term from every knowledge-graph
asset that carries a title and a description
(`folio-assistant-core/scripts/glossary-extract.ts`): skills, Tool nodes, BPMN
tasks and call activities, DMN decisions, and schema fields with a doc
comment. One scheme per asset type per instance (`kg-skills`, `kg-tools`,
`kg-bpmn-activities`, `kg-dmn-decisions`, `kg-schema-fields`), written to
`generated/<instance>/<type>.glossary.json` inside core's `glossary/`.

- They are generated. Never edit them: fix the asset, then re-run.
- The `kg-` scheme prefix is reserved for them. An authored scheme that takes
  it fails `check:glossary`.
- A definition is the asset's own text, verbatim. An asset with no
  description gives a candidate with no definition.
- To promote one, author a term in a glossary of your own with a definition
  you have checked, `status: authored`, and the same `source`.
- BPMN lanes and roles are not extracted: the swimlane ledger carries them.
- The page shows extracted terms apart from authored ones ("candidate,
  extracted", and a "Show" filter), and only authored terms go into the
  schema.org `DefinedTermSet`.

## Not here

A clinical code system is FHIR `CodeSystem`/`ValueSet`, not a glossary (bean
`lqo9`, "convergence stops at SKOS"). A glossary term may `exactMatch` a
clinical concept; it does not become one.
