---
layout: default
title: 'Glossary terms'
parent: Skill instructions
---

{: .note }
> Generated from [`cat-harness/skills/folio-core/glossary-terms.md`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/skills/folio-core/glossary-terms.md) — do not edit here.
>
> [✎ Edit this page's source](https://github.com/litlfred/folio-assistant/edit/main/cat-harness/skills/folio-core/glossary-terms.md){: .fa-edit-source }

{% raw %}
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

**A term is minted by the instance that owns its source.** Owner,
2026-09-24: *"make sure all glossary terms properly localed to ihris so [no]
collision w/ other subgraphs. general rule/skill"*. A scheme and its terms live
in the namespace of the instance whose root holds the SOURCE ASSET, not of the
instance whose `glossary/` directory holds the file:
- In a folio with sub-instances, that is the sub-instance
  (`instanceNs(<sub-stub>)`, under the folio's own publication root). It is
  never the root instance, even when the `glossary/` directory is declared at
  the root. In ihris, a term drawn from `ihris-manage` is minted in
  `ihris-manage`'s namespace, not `ihris`'s.
- A code list extended by several packages belongs to the instance that
  DEFINES it. Say so with the scheme's own `source` (a repository path in that
  instance). Each term's `source` still points at the package that
  contributed it.
- A scheme whose terms are sourced in several instances and that names no
  defining `source` is refused, never guessed: split it, one scheme per
  instance. `folio-assistant-core/glossary/` holds two `platform` schemes for
  that reason, core's and cat-harness's.
- No two instances share a namespace, and a scheme IRI is unique across every
  instance.

`check:glossary` enforces all of this (`schemeOwner` and `collect` in
`glossary-page.ts`, and the checks in `glossary.test.ts`). An extracted term
follows the same rule, because `glossary-extract.ts` mints it in the namespace
of the instance whose root holds the asset. When a check fails, fix the
generator or split the authored scheme. Never edit the output.

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

`bun run glossary:page` writes the index, `docs/glossary/index.md` (the
authored terms with A–Z and a filter box, the counts, the sources, schema.org
`DefinedTermSet` JSON-LD, and a link to every asset type's page), one page per
asset type at `docs/glossary/<type>/index.md` (skills, tools, bpmn-activities,
dmn-decisions, schema-fields: that type's extracted terms, with A–Z and a
filter box), and one SKOS JSON-LD file per scheme under
`docs/assets/glossary/`. Each term is on exactly one page. `bun run
check:glossary` is the gate: it fails on a document that does not validate, on
a stale page, and on a page over its size budget (64 KB for the index, 1 MB
for an asset type's page).

**A page over budget is split further, never given a bigger budget.** The
owner chose *"Split per asset type"* (2026-09-24) when extraction took the
single page to 1.4 MB; the budgets are what keeps that choice true.

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
- Extracted terms are on their asset type's page, never on the index, and
  each carries the "candidate, extracted" badge. Only authored terms go into
  the schema.org `DefinedTermSet`, which is on the index.

## Not here

A clinical code system is FHIR `CodeSystem`/`ValueSet`, not a glossary (bean
`lqo9`, "convergence stops at SKOS"). A glossary term may `exactMatch` a
clinical concept; it does not become one.
{% endraw %}
