---
name: glossary-terms
description: >
  Add terms to an instance's glossary: local SKOS terms (folio-glossary/v1) with
  a definition, a code and links to external SKOS concepts, and references to
  whole external schemes. Rendered on the glossary/ page; gated by
  check:glossary. Authored terms go to gettext (.pot) for translation; a
  paper's glossary is one more scheme.
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
candidates; only a person moves one to `authored`. A paper's definition block
counts as that person: its author wrote the definition and marked it (see
"A paper's glossary" below).

## Conventions

The owner, 2026-09-24: *"What does folio-assistant do? B should follow. Update
skills so known."* Every folio follows these; none re-decides them.

**The instance namespace.** A term's IRI is
`<instance namespace>glossary/<scheme id>/<term id>`, and the instance
namespace is `<publication root><instance stub>/ns#` (`instanceNs` in
`folio-assistant-core/scripts/glossary-page.ts`; `schemeIri` and `termIri` in
`folio-assistant-core/schemas/glossary.ts`). For example:

| instance | namespace |
|---|---|
| `folio-assistant-core` | `https://litlfred.github.io/folio-assistant/folio-assistant-core/ns#` |
| `ihris` (its own site) | `https://litlfred.github.io/ihris/ihris/ns#` |

The namespace is never the asset's path: moving the asset must not move the
term (bean `lqo9`, 2026-09-21).

**One ConceptScheme per code list.** This follows `schemas/code-list.ts`
(`codeListToSkos`): *"a code is addressable and two lists may share a code
without sharing a concept"*. The same code in two lists gives two concepts.
A relation between them is a SKOS match, never a merge.

**The basis of a match is recorded, never assumed.** A match comes from a
mapping the repository verified, such as a FHIR `ConceptMap` whose
equivalence implies one:
- `equal`/`equivalent` gives `exactMatch`;
- `wider`/`subsumes` gives `broadMatch`;
- `narrower`/`specializes` gives `narrowMatch`;
- nothing else gives a match.

Any other basis needs the owner's explicit acceptance. One example is a
`ValueSet` that binds a local code list to the external code system itself,
so that the local code *is* the external code. When the owner accepts such a
basis:
- the scheme's `description` names the basis and the ruling;
- the builder lists the accepted systems explicitly;
- QA recomputes the matches from the same source.

ihris's ISCO-08 lists to ESCO are the worked example (owner, 2026-09-24,
litlfred/ihris#19). An IRI built from a publisher's pattern but never
dereferenced says so.

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

## Translation: authored terms only (bean `lqo9`, owner 2026-09-24)

`bun run glossary:pot` writes one gettext template per scheme that has an
authored term, to `translations/<locale>/glossary/<instance>--<scheme>.pot`
under cat-harness's declared `translation-sources` directory, beside the BPMN
templates in `processes/`. It is the same pipeline: `formatPot`, the same
timestamp-blind comparison, and the translation status page counts the new
templates with no change of its own. `bun run glossary:pot:check` is the gate.

- Only `authored` terms are extracted: `prefLabel`, each `altLabel`, and the
  `definition`, in the source language (`en` when given per language). A
  `candidate` reaches a template once a person promotes it.
- The term's IRI is the translator comment, never a msgid. It stays the same
  in every language; only labels and definitions are translated.
- `translations/<locale>/glossary.po` is a different file (terminology hints
  for `translation-block-qa`). Do not confuse it with the `glossary/` directory.
- Per-locale rendering of the glossary page is the next step, not built yet.

## A paper's glossary (bean `lqo9`, ruling 2: converge on SKOS)

The paper builder (`content/pipeline/build-glossary.ts`, skill
[`glossary-build`](glossary-build.md)) also writes the paper's terms as one
`folio-glossary/v1` scheme, `paper-<paper directory>`, into the glossary
directory the paper's OWN instance declares. The page picks it up through
`collect()` like any other scheme, so the IRIs are in that instance's
namespace (a sub-instance's for a paper in a sub-instance, never the root's).

| the owning block | its `:defterm` paragraph | status |
|---|---|---|
| `kind: "definition"` | found | `authored`: the author wrote the definition |
| any other kind | found | `candidate`: extracted from a theorem, remark, … |
| any | not found | `could-not-extract`, with the reason |

The definition is the `:defterm` paragraph, verbatim, with directives replaced
by their labels. The slug is the term's `notation`. Never edit the scheme:
edit the paper and re-run the builder. `glossary.json` and `glossary.tex` are
unchanged. An instance that declares no glossary directory gets a notice and
no scheme; add `{ "id": "glossary", "path": "glossary/", "dependents": "reproduce", "graphKinds": ["glossary"] }`.

## Not here

A clinical code system is FHIR `CodeSystem`/`ValueSet`, not a glossary (bean
`lqo9`, "convergence stops at SKOS"). A glossary term may `exactMatch` a
clinical concept; it does not become one.
