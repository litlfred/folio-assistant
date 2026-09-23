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

## Not here

A clinical code system is FHIR `CodeSystem`/`ValueSet`, not a glossary (bean
`lqo9`, "convergence stops at SKOS"). A glossary term may `exactMatch` a
clinical concept; it does not become one.
