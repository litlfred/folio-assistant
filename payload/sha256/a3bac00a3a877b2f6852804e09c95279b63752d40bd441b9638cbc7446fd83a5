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
graph-typologies:
  - glossary
---

# Glossary terms

The owner, 2026-09-23: *"put glossary into folio-assistant-core"*, *"it should
be part of general pracice w/ glossary/ page. check harnesses"*, and *"can
glossary be refefences to external skos schema?"*. Yes, and that is the
preferred way.

## Where terms go

Core's `glossary` graph typology. Core declares `glossary/` with
`dependents: reproduce`, so every folio built on core has one. Each
`*.glossary.json` is one SKOS concept scheme, `$schema: "folio-glossary/v1"`
(`folio-assistant-core/schemas/glossary.ts`).

## Reference first, define second

| you have | write |
|---|---|
| a term somebody else already defines in SKOS (ISCO-08, an EU authority table, a W3C vocabulary) | a local term with `exactMatch` (or `closeMatch`, `broadMatch`, `narrowMatch`) to the external concept IRI. **Do not copy its definition.** |
| a list of external terms this folio uses | `members`: the external concept IRIs, emitted as a `skos:Collection` |
| a whole external scheme | a `remoteGraphs` entry in the declaration with `graphTypologies: ["glossary"]`: known about, not held |
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
| `folio-assistant-core` | `https://litlfred.github.io/folio-assistant-core/v0/ns#` |
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

`bun run cat glossary:page` writes the index, `docs/glossary/index.md` (the
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
[`swimlane-glossary`](../../../../cat-harness/skills/process/process-core/swimlane-glossary.md) skill) are one more source the page
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

## Ordered glossaries — logical order, not A–Z (owner, 2026-09-29)

Some glossaries are read top to bottom: each term is defined only by terms
above it, and never itself. Bootstrap's are the first. Sorting those A–Z
throws away the one property the definitions were written to have.

- **`ordered: true`** on a glossary says its `terms` array IS the order. Each
  term's **`requires`** lists the local ids its definition uses; the schema
  refuses one that is later, itself, or not in the glossary.
  `checkDeclaredOrder` (`schemas/dependency-order.ts`) is the same check for
  any authored order.
- **In SKOS** the order is a `skos:OrderedCollection` (`memberList` as an
  RDF list), each use is `dcterms:requires`, and **`isDefinedBy`** — the
  schema or standard that defines the term — is `rdfs:isDefinedBy`.
- **On the page** an ordered scheme is its own numbered section at the top of
  the index, with its "Uses" links, and is not repeated under the A–Z bar.
- **A schema whose `$defs` carry `uses` IS an ordered glossary**, read by
  `termsOfSchema` in `glossary-page.ts`: the definitions stay in one place,
  the schema, and the glossary cannot drift from it. They are `authored`,
  not `candidate`: a person wrote and approved them in the schema's source,
  and the collector only reads them out. That is not an extractor promoting
  its own output, which the rule above still forbids.
- **The uses list is authored, not inferred.** A text matcher over the
  definitions is a guard that the list and the prose agree (`graph.test.ts`);
  a word can appear without being used as a term.

## Translation: authored terms only (bean `lqo9`, owner 2026-09-24)

`bun run cat glossary:pot` writes one gettext template per scheme that has an
authored term, to `translations/<locale>/glossary/<instance>--<scheme>.pot`
under cat-harness's declared `translation-sources` directory, beside the BPMN
templates in `processes/`. It is the same pipeline: `formatPot`, the same
timestamp-blind comparison, and the translation status page counts the new
templates with no change of its own. `bun run cat glossary:pot:check` is the gate.

- Only `authored` terms are extracted: `prefLabel`, each `altLabel`, and the
  `definition`, in the source language (`en` when given per language). A
  `candidate` reaches a template once a person promotes it.
- The term's IRI is the translator comment, never a msgid. It stays the same
  in every language; only labels and definitions are translated.
- `translations/<locale>/glossary.po` is a different file (terminology hints
  for `translation-block-qa`). Do not confuse it with the `glossary/` directory.

### Translations and the per-locale pages (bean `c592`, owner 2026-09-30)

A translation is a `.po` **beside its template**:
`translations/<locale>/glossary/<instance>--<scheme>.po`. `bun run
glossary:page` reads every such file (`readGlossaryTranslations`, through
`glossary-pot.ts`'s own `potPath`, so the reader and the writer cannot
disagree about where it is) and produces two things:

- **a page per locale**, `docs/<locale>/glossary/index.md`, listing every
  authored term with its translated label, alternative labels and
  definition. An entry with no translation shows the **source text marked
  _(untranslated)_** — never silently English, never dropped — and the page
  states how many terms are fully translated;
- **language-tagged SKOS**: the published `<instance>--<scheme>.skos.jsonld`
  carries `skos:prefLabel` and `skos:definition` once per language
  (`@language`), the source as `en`.

`check:glossary` covers both, stale and orphan alike.

**A translation is UNOFFICIAL until a person signs it off** (issue #206).
Every glossary `.po` says so in its header and records
`Last-Translator: folio-assistant agent (drafted, unofficial)` when an agent
drafted it; every locale page carries `translation_status: unverified`.
Keep code, identifiers and standard names (BPMN, SKOS, ODRL, PROV-O, JSON,
IRI, `$schema`, `needs`) as written, and give each capitalised defined term
ONE rendering per locale across every scheme — a term translated two ways
reads as two concepts.

## Source glossary first (owner, 2026-10-31)

When a folio is written from a source document (a WHO handbook, say), its terms
come from **that source's own glossary** before anyone writes one. Owner, on
the NHWA view: *"dont need to use my words ... words already in nhwa handbook.
most recent edition needs glossary / skos extracted for use."*

1. **Latest edition.** Use the most recent edition in the library. If it
   lacks something an older edition has, use the older one and say so on the
   term.
2. **Verbatim, as candidates.** Extract every glossary entry as a
   `folio-glossary/v1` term, status `candidate`, the definition copied word
   for word with its page. Keep the source's spelling as an `altLabel` when the
   `prefLabel` is normalised.
3. **Read the PDF when the ingest missed it.** A glossary the library entry
   does not hold (a missed section, a missing indicator sheet) is read from the
   PDF, and the scheme says so.
4. **Structure the source gives is kept.** Modules, indicators and the like
   become concepts too, linked (`broader`, `related`) to the glossary terms
   they cite.
5. **Record what the source never defines.** A term the source uses but does
   not define is a `candidate` with no definition and a `scopeNote` saying so,
   not a definition we write.
6. **Place the scheme with the source.** It lives beside the document's
   library entry (for WHO publications, in the WHO publications IG), so every
   folio that cites the source shares one scheme. Example, NHWA handbook 2nd ed.:
   https://github.com/litlfred/who-iris/pull/136
7. **Use the source's words downstream.** Blocks, diagrams and ArchiMate names
   use the source's terms and link to their concepts, not a paraphrase.

A conflict between the source's definition and another scheme's is raised as
an issue on the repository that owns the other scheme, quoting both. Neither
is chosen by the agent.

## Deprecating a term: a change set, decided later

Replacing one term with another (dth-hrh CS-001: "Core Data Element" and
"CDE-HRH" replace "MDS-HRH", because the old term causes confusion and is not
precise) is **proposed, not applied**. The agent records a change set with the
old term, the new term, the reason, and every place the old term appears. It
changes no text and no glossary entry. Later an editor starts an agent review
that decides it (owner, 2026-10-31: *"that is for later when editor kicks off
agent review to decide"*). Once decided:

- the old term stays in the scheme, so old links still resolve, with a
  `scopeNote` saying it is deprecated and why, and `related` to the new term
  (`folio-glossary/v1` has no deprecated status yet; adding one is a schema
  change, not part of this rule);
- the folio's own prose moves to the new term;
- **quoted source text is never changed**: a quote keeps the term it was
  published with.

## A paper's glossary (bean `lqo9`, ruling 2: converge on SKOS)

The paper builder (`folio-assistant-core/scripts/build-glossary.ts`, skill
`glossary-build`) also writes the paper's terms as one
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
no scheme; add `{ "id": "glossary", "path": "glossary/", "dependents": "reproduce", "graphTypologies": ["glossary"] }`.

## Organizations and acronyms (owner, 2026-10-31, option B)

An organization (WHO, HL7, ISO, GS1, a national regulator) is a glossary term
like any other, plus a `focus`: SKOS's `foaf:focus` link from the concept to
the organization, which is typed with W3C ORG. The concept keeps the words:
`prefLabel` is the full name, `notation` is the acronym, and `altLabel` holds
other spellings. The organization keeps the facts about the organization.

```json
{
  "id": "who",
  "prefLabel": "World Health Organization",
  "notation": "WHO",
  "definition": "…quoted from its source…",
  "status": "candidate",
  "focus": { "type": "FormalOrganization", "homepage": "https://www.who.int/", "subOrganizationOf": ["un"] }
}
```

- `type` is a W3C ORG class: `Organization`, `FormalOrganization`,
  `OrganizationalUnit` or `OrganizationalCollaboration`.
- `subOrganizationOf` names a local term that has a `focus`, or an
  organization's IRI. `sameAs` links the same organization in another
  register, such as ROR or Wikidata. Give an identifier only when you have
  checked it; never guess one.
- Without `iri`, the organization's IRI is `<term IRI>/_focus`.

**One home per organization.** An organization that several handbooks
use (WHO, HL7, ISO, GS1, UNICEF, USAID) is defined once, in the shared
reference architecture's organizations scheme. A handbook lists it under
`members` and does not copy it. An organization only one handbook names,
such as a country's regulator, stays in that handbook's glossary.

**An acronym is scoped to its meaning.** Use the document's own expansion,
and check it in context. In the WHO product catalogue handbook, "FDA" is the
Rwanda Food and Drugs Authority, not the US Food and Drug Administration. When
the document's acronym would mislead a reader, record it as a candidate and
raise it in the document's review log. Do not fix the quoted text yourself.

**Finding the acronyms that are missing.** The QA criterion
`acronym-in-glossary` warns, block by block, about an acronym that no
glossary the folio can see holds as a `notation`, `prefLabel` or `altLabel`.
It warns and never fails. For the whole folio, with counts and the expansion
the document gives (its abbreviations table, or "Long Name (ACR)"), run:

```sh
bun run folio-assistant-core/scripts/glossary-acronyms.ts --folio folio
```

Each row is a candidate for a person to decide on. Words set in capitals
(`RESOURCES` in a figure), plural forms (`GTINs`) and the folio's own ids
(`PC-R-05`) are left out.

## Not here

A clinical code system is FHIR `CodeSystem`/`ValueSet`, not a glossary (bean
`lqo9`, "convergence stops at SKOS"). A glossary term may `exactMatch` a
clinical concept; it does not become one.
