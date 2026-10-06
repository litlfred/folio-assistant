---
title: "Vocabulary mappings as declared ETL"
kind: proposal
issue: 1872
bean: folio-assistant-k74z
summary: >-
  One value, several target vocabularies, today written as a hand-made line in
  each generator. An inventory of 59 such mappings across 17 files, each with
  file:line, plus five places where two generators disagree or a condition is
  only implicit. Four options were put to the owner, who chose option 1 on
  2026-10-02: mapping tables as KG data, applied by one in-process Tool, and
  interoperating with FHIR ConceptMaps (representable in, producible out,
  round-trip exact). Built, with glossary-export moved onto it and its output
  byte-identical.
---

# Vocabulary mappings as declared ETL

**Status:** decided 2026-10-02 (option 1) and built. See
[Decision](#decision). Bean `folio-assistant-k74z`, issue #1872. The inventory
was measured on `origin/main` at `13620da` (2026-10-02).

## The ask

Owner, 2026-09-23, on deciding to keep a glossary scheme's name in **both**
`skos:prefLabel` and `dcterms:title` from one source (bean `sl9u`):

> this is going to be common pattern... need Tools for this type of ETL
> procedure depending on source / target content type and other metadata

The pattern is **one value, several target vocabularies**. Which mapping
applies depends on:

- the **source** content type (a role, a lane, a code list, a glossary term, a
  library item, a catalogue record, an engine step);
- the **target** vocabulary (SKOS, Dublin Core, schema.org, PROV-O, RDFS, a
  navbar tile);
- **other metadata**: the language a string is in, the licence, whether the
  node is also a document, and which fields a consumer reads.

[`vocabulary-authority`](../../skills/kg/kg-core/vocabulary-authority.md)
already states the rule, and nothing implements it yet: *"Every other
vocabulary that carries it is a RENDERING, reached by a **declared mapping
with stated equivalence**."* No such declaration exists. Every mapping below
is a line of code.

## 1. Inventory: the hand-written mappings

Scope: every generator in `cat-harness/`, `folio-assistant-core/` and
`bootstrap-tools/` that writes a value into a published vocabulary or a UI
surface. Found by grepping for vocabulary keys (`skos:`, `dcterms:`,
`schema:`, `prov:`, `rdfs:`) and for the context aliases (`prefLabel`,
`title`, `definition`, …), then reading each hit. The domain instances
(`smart-*`, `who-*`, `fhir-harness`) were grepped too and hold none in a TypeScript generator. A row is one source type → one target, at one site. Some rows carry
several fields. Line numbers are at `13620da`.

**Relation key:** *copy* means the value is moved unchanged; *fan-out* means
one source value is written to two or more predicates; *transform* means the
value is changed on the way; *conditional* means a guard decides whether, or
which predicate.

### Swimlane glossary: `cat-harness/scripts/glossary-export.ts`

| # | source type | source field | target | relation | site |
|---|---|---|---|---|---|
| 1 | role | `title` | `skos:prefLabel` | copy | `glossary-export.ts:511` |
| 2 | role | `description` | `skos:definition` | copy, if present | `:512` |
| 3 | role + its lanes | lane names ∪ `otherNames`, minus `title` | `skos:altLabel` | transform (merge, dedupe, sort) | `:499-505`, `:513` |
| 4 | role | `formerNames[].name` | `skos:hiddenLabel` | transform | `:506`, `:514` |
| 5 | role | `id` | `skos:notation` | copy | `:515` |
| 6 | role | `actedUpon` | `cat:actedUpon` | copy, if true | `:521` |
| 7 | lane occurrence | lane `name` | `rdfs:label` (deliberately not `prefLabel`) | copy, if named | `:477` |
| 8 | lane occurrence | `<bpmn:documentation>` | `skos:scopeNote` | copy, **verbatim** (it is a `.pot` msgid) | `:479` |
| 9 | lane occurrence | diagram path | `dcterms:source` | copy | `:480` |
| 10 | variable-performer lane | lane name, falling back to lane id | `skos:prefLabel` **and** `skos:notation` | fan-out | `:539`, `:546`, `:551` |
| 11 | ledger entry (retired) | `prefLabel` | `skos:prefLabel` | copy | `:591` |
| 12 | ledger entry (retired) | `retiredOn` ≠ null | `owl:deprecated` true | conditional | `:596` |
| 13 | ledger entry (retired) | `retiredOn`, rename target | `skos:changeNote` (template) + `dcterms:isReplacedBy` | conditional, transform | `:600-601` |
| 14 | ledger entry (live) | `formerLabels` | `skos:hiddenLabel` | transform (merge) | `:615` |
| 15 | glossary scheme | `${stub} swimlane glossary` | `skos:prefLabel` **and** `dcterms:title` | **fan-out: the `sl9u` line** | `:684-685` |
| 16 | (document) | JSON key → IRI table | `@context` | 20 key bindings | `:646-670` |

### Vocabulary: `cat-harness/scripts/ns-export.ts`

| # | source type | source field | target | relation | site |
|---|---|---|---|---|---|
| 17 | vocabulary term | name | `rdfs:label` **and** `skos:prefLabel` | fan-out | `ns-export.ts:269`, `:276` |
| 18 | vocabulary term | gloss | `rdfs:comment` **and** `skos:definition` | fan-out | `:270`, `:277` |
| 19 | vocabulary term | `<prefix>:<name>` | `skos:notation` | transform | `:282` |
| 20 | vocabulary term | `replacedBy` | `owl:deprecated` + `dcterms:isReplacedBy` | conditional | `:295` |
| 21 | graph typology | name, gloss, id | label + prefLabel, comment + definition, notation | fan-out ×2 | `:307-311` |
| 22 | layer scheme | `folio-assistant ${l} vocabulary` | `skos:prefLabel` **and** `dcterms:title` | fan-out (the `sl9u` rule again) | `:351-352` |
| 23 | bootstrap vocabulary | `label` | `rdfs:label` **and** `skos:prefLabel` | fan-out | `:358` |

### Code lists: `cat-harness/schemas/code-list.ts`, `cat-harness/scripts/code-lists.ts`

| # | source type | source field | target | relation | site |
|---|---|---|---|---|---|
| 24 | code list | `id`, `title`, `description` | `skos:notation`, `skos:prefLabel`, `skos:definition` | copy | `code-list.ts:179-181` |
| 25 | code list | `source` `{href}` or `{note}` | `dcterms:source` as a link **or** a literal; the note also goes to `skos:changeNote` | transform (shape picks the range) | `:182-183` |
| 26 | code | `code`, `label`, `definition` | `skos:notation`, `skos:prefLabel`, `skos:definition` | copy | `:189-191` |
| 27 | code | `value` | `rdf:value` | copy, if present | `:192` |
| 28 | code | `status` = retired | `owl:deprecated` | conditional | `:194` |
| 29 | code-lists document | literal `"Code lists"` | `dcterms:title` | constant | `code-lists.ts:66` |

### Authored and extracted glossaries: `folio-assistant-core`

| # | source type | source field | target | relation | site |
|---|---|---|---|---|---|
| 30 | glossary (`folio-glossary/v1`) | `title` | `skos:prefLabel` (no `dcterms:title`) | copy | `schemas/glossary.ts:202` |
| 31 | glossary | `description` | `skos:definition` | copy | `:203` |
| 32 | glossary | `hasVersion`, `modified`, `source`, `license` | `dcterms:hasVersion`, `dcterms:modified`, `dcterms:source`, `dcterms:license` | copy | `:204-207` |
| 33 | glossary term | `prefLabel`, `definition` | `skos:prefLabel`, `skos:definition` | transform (language-tagged per locale, bean `c592`) | `:215`, `:218` |
| 34 | glossary term | `altLabel`, `notation`, `scopeNote` | the SKOS properties of the same name | copy | `:217`, `:219-220` |
| 35 | glossary term | `exactMatch` / `closeMatch` / `broadMatch` / `narrowMatch` | `skos:*Match` | copy | `:223` |
| 36 | glossary term | `requires`, `isDefinedBy`, `source` | `dcterms:requires`, `rdfs:isDefinedBy`, `dcterms:source` | copy | `:227-229` |
| 37 | glossary term | `status` ≠ authored | `skos:note` (template `status: reason`) | conditional, transform | `:230` |
| 38 | glossary term (authored only) | label, definition, notation | **schema.org** `DefinedTerm` `name`, `description`, `termCode` | copy, conditional | `scripts/glossary-page.ts:957-959` |
| 39 | JSON Schema `$defs` entry | key (camelCase split), `description`, `uses`, `isDefinedBy` | glossary `prefLabel`, `definition`, `requires`, `isDefinedBy` | transform | `scripts/glossary-page.ts:281`, `:290-293` |
| 40 | paper defined term | extracted label (or the slug, de-hyphenated), slug, location, block, text | `prefLabel`, `notation`, `scopeNote`, `source`, `definition` | transform | `scripts/build-glossary.ts:332-337` |
| 41 | paper | `title` | glossary `title` (template `${title}: glossary`) | transform | `scripts/build-glossary.ts:345` |

### Terminology matching (PR #1837): `cat-harness/scripts/check-term-mapping.ts`

| # | source type | source field | target | relation | site |
|---|---|---|---|---|---|
| 42 | authored glossary term | `prefLabel` hit or `altLabel` hit | `skos:exactMatch` or `skos:closeMatch` respectively | conditional: **which label matched picks the predicate** | `check-term-mapping.ts:128`, `:130` |
| 43 | pinned FHIR code | `display` hit | `skos:closeMatch`, never exact | conditional | `:204` |

### Dublin Core (PR #1841 and the intake)

| # | source type | source field | target | relation | site |
|---|---|---|---|---|---|
| 44 | DSpace qualified field | `dc.<element>.<qualifier>` | DCMI term, plus `range`, a syntax scheme, a vocabulary scheme | **already a declarative table:** `DCTERMS_MAP`, 30 entries, with documented absences | `folio-assistant-core/schemas/dublin-core-render.ts:120-151` |
| 45 | upload form | `title`, `type`, `normativeLevel`, `domain`, `format` | `dc.title`, `dc.type`, `dc.type.normativeLevel`, `dc.subject`, `dc.format` | copy (the module header restates it as a table) | `folio-assistant-core/adapters/document/intake-records.ts:92-96` |

### Library items: `cat-harness/content/pipeline/gen-library-jsonld.ts`

| # | source type | source field | target | relation | site |
|---|---|---|---|---|---|
| 46 | library item: structure, tabular record or `referenced.json` | `metadata.title`, `shape.title` or `identity.title`, falling back to the doc id | `dcterms:title` (via `jsonld.ts:599`) | copy with fallback, three times | `gen-library-jsonld.ts:344`, `:568`, `:588` |
| 47 | library item | licence file | `meta.licence` inside an `@json` literal, so it is **not** `dcterms:license` (as inventoried; since D4, 2026-10-03, it is `dcterms:license` by the `licence-naming` table) | copy into an opaque literal | `:573`, `:600`; `cat-harness/schemas/jsonld.ts:643` |

### Knowledge graph: `cat-harness/scripts/kg-export.ts`, `fsh-guts-export.ts`, `cat-harness/schemas/vocabulary.ts`

| # | source type | source field | target | relation | site |
|---|---|---|---|---|---|
| 48 | (document) | `name`, `title`, `description`, `summary` | `rdfs:label`, `dcterms:title`, `dcterms:description`, `rdfs:comment` | context bindings | `kg-export.ts:241`, `:249-251` |
| 49 | role | `id`, `title`, `description` | `rdfs:label`, `dcterms:title`, `dcterms:description` | copy | `kg-export.ts:2034-2036` |
| 50 | skill, tool, asset, subgraph | `title`, `description` | `dcterms:title`, `dcterms:description` | copy, four times | `:1017-1018`, `:1784-1785`, `:2139-2140`, `:2176-2177` |
| 51 | schema module | `summary` | `dcterms:title` | copy (a summary written into the title slot) | `:1865` |
| 52 | minted term | `replacedBy` | a standard property (`dcterms:isPartOf`, `dcterms:type`, `dcterms:conformsTo`, …) | **already a declarative table:** 10 entries | `vocabulary.ts:294`, `:305`, `:342`, `:395`, `:421`, `:461`, `:475-478` |
| 53 | FSH guts node | `name`, `description`, `body` | `rdfs:label`, `rdfs:comment`, `schema:text` | context bindings | `fsh-guts-export.ts:230-231`, `:241` |

### Provenance: `cat-harness/src/workflow/prov-record.ts`, `cat-harness/schemas/prov-jsonld.ts`

| # | source type | source field | target | relation | site |
|---|---|---|---|---|---|
| 54 | engine step + verdict | time, actor, role, `process#node`, target | `prov:startedAtTime`, `prov:agent`, `prov:hadRole`, `prov:hadPlan`, `prov:used` | copy, transform (plan stem) | `prov-record.ts:52-58` |
| 55 | PROV-O activity | `prov:*` keys | PROV-JSONLD `startTime`, `endTime`, `used`, `Association.agent/role/plan` | transform (address-book resolution; an unresolved value is reported) | `prov-jsonld.ts:245-265` |

### Language and UI surfaces

| # | source type | source field | target | relation | site |
|---|---|---|---|---|---|
| 56 | any graph string with a catalogue translation | the string | `{"@value", "@language": locale}`; a string with no translation stays untagged | conditional on **language** metadata | `cat-harness/scripts/kg-locale-export.ts:306` |
| 57 | instance declaration | `title` (falling back to `name`), `description` | navbar tile `title`, `label`, `description` | copy with fallback, fan-out | `cat-harness/scripts/harness-tiles.ts:1174-1178` |
| 58 | instance declaration (duplicate title) | `title`, `name` | tile `label` = `${title} (${name})` | conditional, transform | `:1450` |
| 59 | visualisation | `title` | graph tile `title` | copy | `cat-harness/scripts/graph-tiles.ts:272` |

**Totals:** 59 rows across 17 files. Two of them (44 and 52) are **already
declarative tables**, 30 and 10 entries long, and they are the precedent for
this proposal rather than something it replaces. Eight rows are **fan-out**
(one value, several predicates). Eleven are **conditional**.

### What the inventory found that one generator could not

These are reported, not fixed: fixing them is what the chosen shape is for.

| | finding | rows |
|---|---|---|
| **D1** | The `sl9u` rule is *"a concept scheme that is also a document carries a derived `dcterms:title`"*. Two emitters apply it (15, 22). Two do not (24, 30), and that is **correct**: their scheme IRIs (`<doc>#<list>`, `<ns>glossary/<id>`) are not documents. But the condition that decides it is written down nowhere, so each new emitter has to rediscover it. | 15, 22, 24, 30 |
| **D2** | `fsh-guts-export.ts:226` says it maps `name` and `description` *"exactly as the main export maps them"*. It does not. kg-export moved `description` to `dcterms:description` (bean `xsqm`), while fsh-guts still writes `rdfs:comment`. The comment went stale when kg-export changed. | 48, 53 |
| **D3** | **The same IRI gets two naming predicates from two generators.** kg-export and glossary-export both mint a role as `makeIri(doc, "role", id)`. kg-export names it `dcterms:title` with `rdfs:label` = the id. glossary-export names it `skos:prefLabel` with `skos:notation` = the id. In a merged graph one node has `rdfs:label "reviewer"` and `skos:prefLabel "Reviewer"`, and `skos:prefLabel` is a sub-property of `rdfs:label`. That is the `sl9u` overlap again, on every role node rather than one, with nothing saying which is authoritative. | 1, 5, 49 |
| **D4** | A licence is `dcterms:license` on a glossary (32) but an opaque `@json` literal on a library item (47), so an RDF reader can see one and not the other. Licence is one of the "other metadata" the owner named. **Ruled 2026-10-03 (owner): move it. Done** (bean `gzkt`): one table, `vocab-mappings/licence-naming.json`, drives both. A library item's manifest now carries the licence as `license` → `dcterms:license`, outside `meta`, written only for a `stated` record. An `unknown` record names no licence. An absent one writes nothing. The authored record stays whole as `licenceRecord` (`@json`), which is what `check:source-licence` reads. | 32, 47 |
| **D5** | A schema module's `summary` goes to `dcterms:title` (51), while every other node type sends `summary` to `rdfs:comment` (48). This may be deliberate, but no comment says so. **Ruled 2026-10-02 (owner): "Make it like the others"** — `summary` → `rdfs:comment`, title = module stem (bean `lodp`). | 48, 51 |

## 2. What to reuse, and what not to

**smart-base crosswalks (bean `cpmo`).** Four FHIR ConceptMaps, held by
reference. Four lessons carry over; the vocabulary does not:

1. **A mapping has a status.** Both crosswalks are `draft` and one is
   incomplete against its own stated scope. A mapping table needs `status`
   for the same reason.
2. **An absence is a row.** ConceptMap has `unmapped`, and `DCTERMS_MAP`
   documents `dc.date.accessioned` as *absent on purpose*. A field that is
   deliberately not mapped must be distinguishable from one nobody got to.
3. **Each row states its equivalence**, as ConceptMap's `equivalence` does.
   Here that is the `vocabulary-authority` split: *authoritative* versus
   *derived copy of*.
4. **Hold by reference.** No FHIR, ConceptMap or smart-base term enters the
   harness. A domain instance's own mappings stay in that instance.

**Tool nodes (bean `d308`, `cat-harness/schemas/tool.ts:414`).** An ETL
mapping is reached through a Tool declared as a KG node. A Tool can run
`inProcess`, and it can declare `maintains` and `downstream`, so "this Tool
keeps `_kg/<stub>-glossary.jsonld` current" is already expressible.

**The requirement schema (`bootstrap-tools/schemas/requirement.ts`, #1164).**
The direction rule: *"A downstream harness that follows a particular standard
maps ITS fields onto these in its own layer — never the other way round."*
So the mapping data lives in the **layer that knows both sides**. That is
`cat-harness` for SKOS, DC and PROV, and never `bootstrap`, which names no
outside vocabulary (`check:bootstrap-concepts`).

**JSON-LD `@context` is not enough on its own.** A context binds one key to one
IRI, and JSON-LD 1.1 gives no way to bind one key to two predicates. It
therefore cannot express fan-out (the `sl9u` case), a condition (rows 12, 42,
56), or a fallback (46, 57). It can be **derived from** a mapping table, which
would also close D2.

## 3. The shape, as four options

All four describe the same thing. A mapping is keyed by
**(source content type, target vocabulary)**, and each row says which source
field goes to which target predicate, with which relation, under which
condition. They differ in **where the rows live** and **whose format they
use**.

The row, written once so the options can be compared:

```ts
// folio-vocab-mapping/v1 (sketch, not yet a schema)
interface VocabMapping {
  $schema: "folio-vocab-mapping/v1";
  id: string;                               // "role→skos"
  source: { contentType: string };          // a declared graph typology or record type: "role", "lane", "code-list"
  target: { vocabulary: string; nodeType?: string }; // "skos", "skos:Concept"
  status: "draft" | "active" | "retired";   // cpmo lesson 1
  rows: Array<{
    from: string;                           // source path: "title", "formerNames[].name"
    to: string;                             // CURIE: "skos:prefLabel"
    authority: "authoritative" | "derived"; // vocabulary-authority; cpmo lesson 3
    derivedFrom?: string;                   // the `to` it copies, e.g. dcterms:title ← skos:prefLabel (sl9u)
    transform?: "copy" | "lang-tagged" | "link-or-literal" | "template" | "merge-dedupe-sort" | "split-camel";
    template?: string;                      // for transform: "template"
    when?: { field: string; present?: true; equals?: unknown };
  }>;
  unmapped?: Array<{ from: string; why: string }>; // cpmo lesson 2
}
```

### Option 1: mapping tables as KG data, applied by one Tool (Recommended)

Each mapping is a JSON node in a new declared graph (`vocab-mappings`, holds
`context`) under `cat-harness/`. One `inProcess` Tool, `vocab-map`, applies a
table to a record. Generators call it instead of writing literals, and each
generator's `@context` is derived from the rows it used. Transforms come from
the closed, named set above. A row that needs anything else stays in code
**and is listed in the table as `transform: "code"` with its file:line**, so
the inventory stays complete. A gate (`check:vocab-mappings`) re-runs this
inventory mechanically and reports D1–D5-style disagreements: the same
(source type, field) going to different predicates in different tables, or a
`derived` row with no `authoritative` sibling.

- **For:** it matches d308 (*"no code, only skills/tools in the KG"*) and is
  exactly `vocabulary-authority`'s "declared mapping with stated equivalence".
  A dependant can inherit or override a table by `id`, like any declared
  directory. The row columns are chosen to line up with SSSOM's
  (`subject` / `predicate` / `object` / `mapping_justification`), so an SSSOM
  export is a later projection, not a rewrite.
- **Against:** it is the largest build. It needs a new graph typology, a schema, a
  gate and the `skill:register` chain. Logic outside the closed set remains
  code, but now visibly so.

### Option 2: typed TypeScript tables (generalise `DCTERMS_MAP`)

A `defineMapping()` helper is zod-typed and lives beside each source schema.
Its rows are the same as above, but `transform` may be a function. A shared
applier runs them, and there is one Tool node per mapping module.

- **For:** it is the smallest step. `DCTERMS_MAP` already has this shape, and
  transforms are typechecked and unrestricted.
- **Against:** mappings stay code, which runs against d308. A function-valued
  row cannot be audited as data, so the D1–D5 check can only compare the rows
  that are plain. A dependant can override a module only by forking it.

### Option 3: adopt published standards (SSSOM + RML/YARRRML)

SSSOM (TSV or JSON) holds the predicate-level equivalences. RML, in its
YARRRML syntax, holds the field-to-predicate ETL.

- **For:** these are published standards with external tooling, and SSSOM's
  `predicate_id` + `mapping_justification` is literally a "stated
  equivalence".
- **Against:** RML needs a mapper engine (Java or Python) that the harness
  does not carry. SSSOM describes term ↔ term, not field → predicate. Neither
  fits the TS/zod gates every other declaration here runs through. This is
  the heaviest option, and it costs a dependency the owner has not chosen.

### Option 4: contexts only (centralise `@context`, lint the fan-out)

Leave the generators as they are. Move every `@context` key binding into one
shared module, and add a lint that flags a node carrying both members of a
`vocabulary-authority` overlap pair (`dcterms:title` / `skos:prefLabel`,
`dcterms:description` / `skos:definition`) without a declared reason.

- **For:** near-zero cost. It fixes D2 outright and makes D3 visible.
- **Against:** a context cannot express fan-out, conditions or fallbacks (§2),
  so the 59 hand-written lines all stay. The bean asks for Tools for exactly
  that ETL, and this option does not provide them.

**Default if no answer: Option 1.**

## Decision

Owner, 2026-10-02, on the four options above, verbatim:

> 1 ... needs to support FHIR Concept Maps downstream

Owner, 2026-10-02, a further statement on the same question, verbatim:

> more so, that existing FHIR Concept Maps are representable, (dont need injection of mapping standard -> fhir stds)

Owner, 2026-10-02, clarifying the two, verbatim:

> we still want to able to produce FHIR ConceptMaps, just we dont need to assume injective map onto FHIR conceptmaps... may be lossy. but should be injective on the inverse image of FHIR ConceptMaps into mapping stadard.

**Option 1 is chosen:** mapping tables as KG data, applied by one in-process
`vocab-map` Tool.

**The ConceptMap requirement, stated formally.** Write C for FHIR ConceptMaps
(R5, and R4 where it differs) and M for `folio-vocab-mapping/v1` tables.

- **ι : C → M** represents a ConceptMap. Every existing ConceptMap must be
  representable. Where a ConceptMap feature needs a field M lacks, M gains
  the field; the feature is not dropped.
- **π : M → C** produces a ConceptMap. It **may be lossy** on M in general,
  because M says things a ConceptMap cannot (a derived target, a transform,
  a JSON key). π **reports** every loss and never drops anything silently.
- **π is injective on ι(C)**, and in fact **π ∘ ι = id_C**: a ConceptMap read
  and then produced comes back equal, field for field after canonical key
  ordering.

### What was built

| | where |
|---|---|
| M, the table schema (zod), plus the relationship tables and the applier | `cat-harness/schemas/vocab-mapping.ts` |
| ι `fromConceptMap` and π `toConceptMap`, R4 and R5 | `cat-harness/schemas/vocab-mapping-fhir.ts` |
| the `vocab-mapping` graph typology and its declared directory | `schemas/graph-typology-registry.ts`, `cat-harness.json` → `cat-harness/vocab-mappings/` |
| the `vocab-map` Tool node (in-process, satisfies `vocabulary-authority`) | `cat-harness/tools/vocab-map.ts` |
| the tests | `scripts/tests/vocab-mapping-fhir.test.ts`; the context-agreement test in `scripts/tests/glossary-export.test.ts` |

**Measured, not argued:**

- **π ∘ ι = id holds on all 174 ConceptMap examples HL7 publishes**: 80 in
  `hl7.fhir.r4.examples@4.0.1` and 94 in `hl7.fhir.r5.examples@5.0.0`. No loss
  is reported on any of them.
- **The passthrough bags do not carry the result.** On those 174 maps no
  group, element, target, unmapped, dependsOn or product key lands in
  `extra`. `metadata` holds only resource description: `contact`, `text`,
  `jurisdiction`, `meta`, `identifier`, the resource `id`, and the R5
  workflow fields.
- **Four of the examples are committed as fixtures, unmodified**, with their
  sha256 and source in `fixtures/conceptmap/provenance.json`: R4 and R5
  `example2` (dependsOn, product, unmapped) and R4 and R5 `101`. A constructed
  R5 map covers what no small example does: `noMap`, `fixed` unmapped,
  `valueSet` sources and targets, `target.property`, and an extension on a
  target. Setting `FHIR_EXAMPLES_DIR` re-runs the whole corpus.

**How M covers what R4 and R5 disagree on.**

- **Relationship.** `relationship` holds the R5 code and is always present.
  An R4 map's `equivalence` is kept verbatim beside it. Six of R4's ten codes
  (`equal`, `subsumes`, `specializes`, `inexact`, `unmatched`, `disjoint`)
  land on a coarser R5 code, so recomputing them would lose them.
- **Versions.** An R5 `canonical|version` is split into `source` and
  `sourceVersion` (`target` and `targetVersion` likewise), which is R4's
  shape, and joined again on output.
- **Unmapped.** R4 `provided` is R5 `use-source-code`, and R4's `url` is R5's
  `otherMap`.
- **dependsOn.** R4's `system` and `display` are kept.
- **Crossing releases is a conversion, and π reports it.** Producing an R4
  map as R5 reports each equivalence R5 cannot say. Producing an R5 `noMap`
  as R4 writes R4's form (a target with equivalence `unmatched`) and reports
  that it did.

**SKOS.** The terminology work already publishes SKOS matches, so the
correspondence is in the schema (`SKOS_MATCH_FOR`):

| R5 relationship | SKOS |
|---|---|
| `equivalent` | `skos:exactMatch` |
| `source-is-narrower-than-target` | `skos:broadMatch` |
| `source-is-broader-than-target` | `skos:narrowMatch` |
| `related-to` | `skos:relatedMatch`; `skos:closeMatch` also reads back as `related-to`, since R5 has no "close" |
| `not-related-to` | none. SKOS has no negative match, so this is left undefined rather than guessed |

**Conditional rows.** None of glossary-export's conditions needed
`dependsOn`. An absent value writes nothing, which is the default, and
"true or nothing" is `transform: "flag"`. A condition on ANOTHER field's
value would be a `dependsOn`, which M already represents. The applier does
not yet evaluate one, and says nothing it cannot do.

### Facts gathered for the ConceptMap question, from the specification itself

These were read from HL7's own packages, not recalled from memory:
`hl7.fhir.r5.core@5.0.0` and `hl7.fhir.r4.examples@4.0.1` /
`hl7.fhir.r5.examples@5.0.0` on the npm registry, all published by
`grahamegrieve`.

- **R5 `ConceptMapRelationship`** (`http://hl7.org/fhir/concept-map-relationship`):
  `related-to`, with children `equivalent`, `source-is-narrower-than-target`
  and `source-is-broader-than-target`; and `not-related-to`.
- **R4 `ConceptMapEquivalence`**: `relatedto`, with children `equivalent`
  (whose child is `equal`), `wider`, `subsumes`, `narrower`, `specializes`
  and `inexact`; and `unmatched`, whose child is `disjoint`.
- **R5 structure a representation must not lose:**
  - map level: `url`, `version`, `status` (1..1), `sourceScope[x]`,
    `targetScope[x]`, `property` (code, uri, type, system) and
    `additionalAttribute`;
  - `group.source` / `group.target` (canonical, 0..1 each);
  - `element.code` / `display` / `valueSet` / `noMap`;
  - `target.code` / `display` / `valueSet` / `relationship` (1..1) /
    `comment`, plus `property` (code + `value[x]`), `dependsOn` and `product`
    (attribute + `value[x]` or `valueSet`);
  - `unmapped.mode` (`use-source-code` / `fixed` / `other-map`) with `code`,
    `display`, `valueSet`, `relationship` and `otherMap`.
- **Invariants that bear on a representation:**
  - cmd-1: `source-is-broader-than-target` and `not-related-to` need a comment
    unless the map is draft;
  - cmd-4: `noMap` excludes `target`;
  - cmd-2, cmd-3 and cmd-8–10 constrain `unmapped` by mode.

## 4. The worked example: glossary-export, done

`glossary-export` now writes its nodes through **five tables** in
`cat-harness/vocab-mappings/`:

| table | node | inventory rows |
|---|---|---|
| `glossary-role-concept` | `skos:Concept` per role | 1–6 |
| `glossary-lane-usage` | `LaneUsage` per lane occurrence | 7–9 |
| `glossary-variable-lane-concept` | `skos:Concept` per variable-performer lane | 10 |
| `glossary-retired-concept` | deprecated `skos:Concept` per retired term | 11–13 |
| `glossary-concept-scheme` | the scheme, whose `dcterms:title` is declared `derived` from `skos:prefLabel` | 15, the `sl9u` line |

Five tables rather than the four sketched here, because the variable-lane
concept is a different node from a role's concept.

The generator keeps its corpus walk, its ledger and its retirement logic,
plus identity (`@id`, `@type`). Only the field-to-predicate lines moved.

**Verified:**

- `_kg/cat-harness-glossary.jsonld`, `_kg/bootstrap-glossary.jsonld` and
  `_kg/cat-harness-code-lists.jsonld` are **byte-identical** before and after
  (`cmp`). Between them the two instances exercise every table: bootstrap has
  the retired and variable-lane nodes, cat-harness the rest.
- `glossary-export.test.ts` passes: 27 existing tests, plus one new test that
  every key a table writes is bound, in the document's `@context`, to that
  table's target and code. That test checks 27 rows, and it is the guard
  against D2-style drift.

**The falsifier did not fire.** 27 rows are declared. Four are
`transform: "code"`, where the value is prepared before mapping:
`altLabel`, `hiddenLabel`, `changeNote` and `isReplacedBy`. Add the
ledger-rename pass that stays in code, and that is 5 of 28, about 18%,
against the "about a third" that would have meant option 2.

## 5. Not decided here, and counted rather than listed

Three further questions follow whichever option is chosen. They are where the
D3 decision goes (fix the role IRI's naming, or declare `skos:prefLabel`
authoritative across both generators), whether D4's licence moves out of
`meta`, and the order in which the other generators migrate. Each is a
separate decision once the shape exists.

**Since decided.** D4 was ruled 2026-10-03 by the owner ("move it") and is
done (bean `gzkt`). See the D4 row in §1.
