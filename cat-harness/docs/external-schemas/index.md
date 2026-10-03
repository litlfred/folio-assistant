---
title: "External schemas"
description: "The specifications this repository depends on — the edition of each, what would move if one bumped, and the terms it actually branches on."
renders:
  - cat-harness/external-schemas
rendered-by: external-schemas-viewer
---
<style>
.xs-tag{display:inline-block;padding:.05rem .4rem;border-radius:3px;font-size:.72rem;
  font-weight:600;white-space:nowrap;border:1px solid currentColor}
.xs-ok{color:#0d6e5e}
.xs-na{color:#5b5f66}
.xs-missing{color:#a8200f}
.xs-grid{display:flex;flex-wrap:wrap;gap:.75rem;margin:1rem 0}
.xs-stat{flex:1 1 8rem;border:1px solid rgba(128,128,128,.35);border-radius:6px;padding:.5rem .7rem}
.xs-stat b{display:block;font-size:1.25rem;line-height:1.2}
.xs-stat span{font-size:.75rem;opacity:.75}
</style>

A specification here is **referenced, not held**: the edition is named and
the terms this repository actually acts on are materialised into the graph,
but the document itself stays at the authority. That split is the owner's:
*"dont need to materalize, but should reference specific version being
used"*, and *"some schema that is operational should be in KG"*.

So each record answers three questions — **which edition**, **what here
depends on it**, and **which of its terms this repository branches on**.

<div class="xs-grid">
<div class="xs-stat"><b>22</b><span>specifications</span></div>
<div class="xs-stat"><b>106</b><span>operative terms in the graph</span></div>
<div class="xs-stat"><b>216</b><span>declared uses</span></div>
<div class="xs-stat"><b>0</b><span>declarations naming no record</span></div>
</div>

## The specifications

| specification | authority | edition | how it is used |
|---|---|---|---|
| **[DCMI Metadata Terms](#dcmi-terms)**<br>`dcmi-terms` | DCMI | [2020-01-20](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/2020-01-20/) | `reads` — this repository parses documents written in it |
| **[HL7 FHIR](#hl7-fhir)**<br>`hl7-fhir` | HL7 | [unpinned](https://hl7.org/fhir/) | `reads` — this repository parses documents written in it |
| **[Handle System Overview (RFC 3650), with its namespace (RFC 3651) and protocol (RFC 3652)](#ietf-handle-system)**<br>`ietf-handle-system` | IETF | [2003-11](https://www.rfc-editor.org/rfc/rfc3650) | `conforms` — this repository's artefacts are valid against it |
| **[Business Process Model and Notation (BPMN)](#omg-bpmn-2.0)**<br>`omg-bpmn-2.0` | OMG | [2.0](https://www.omg.org/spec/BPMN/2.0/) | `conforms` — this repository's artefacts are valid against it |
| **[Diagram Definition (DD)](#omg-dd-1.0)**<br>`omg-dd-1.0` | OMG | [1.0](https://www.omg.org/spec/DD/1.0/) | `conforms` — this repository's artefacts are valid against it |
| **[Decision Model and Notation (DMN)](#omg-dmn-1.3)**<br>`omg-dmn-1.3` | OMG | [1.3](https://www.omg.org/spec/DMN/1.3/) | `conforms` — this repository's artefacts are valid against it |
| **[Schema.org](#schema-org)**<br>`schema-org` | other | [unpinned](https://schema.org/) | `conforms` — this repository's artefacts are valid against it |
| **[SPAR Ontologies: DoCO, DEO and CiTO](#spar-doco-deo-cito)**<br>`spar-doco-deo-cito` | other | [unpinned](http://www.sparontologies.net/) | `conforms` — this repository's artefacts are valid against it |
| **[SPDX License List](#spdx-license-list)**<br>`spdx-license-list` | other | [3.29.0](https://spdx.org/licenses/) | `reads` — this repository parses documents written in it |
| **[Metadata Vocabulary for Tabular Data](#w3c-csvw)**<br>`w3c-csvw` | W3C | [2015-12-17](https://www.w3.org/TR/tabular-metadata/) | `conforms` — this repository's artefacts are valid against it |
| **[ODRL Information Model 2.2](#w3c-odrl)**<br>`w3c-odrl` | W3C | [2018-02-15](https://www.w3.org/TR/odrl-model/) | `conforms` — this repository's artefacts are valid against it |
| **[OWL 2 Web Ontology Language Document Overview (Second Edition)](#w3c-owl2)**<br>`w3c-owl2` | W3C | [2012-12-11](https://www.w3.org/TR/owl2-overview/) | `conforms` — this repository's artefacts are valid against it |
| **[The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model](#w3c-prov-jsonld)**<br>`w3c-prov-jsonld` | W3C | [2024-08-25](https://www.w3.org/submissions/2024/SUBM-prov-jsonld-20240825/) | `conforms` — this repository's artefacts are valid against it |
| **[PROV-O: The PROV Ontology](#w3c-prov-o)**<br>`w3c-prov-o` | W3C | [2013-04-30](https://www.w3.org/TR/prov-o/) | `conforms` — this repository's artefacts are valid against it |
| **[RDF Calendar — an application of the Resource Description Framework to iCalendar Data](#w3c-rdf-calendar)**<br>`w3c-rdf-calendar` | W3C | [2005-09-29](https://www.w3.org/TR/rdfcal/) | `conforms` — this repository's artefacts are valid against it |
| **[RDF 1.1 Concepts and Abstract Syntax](#w3c-rdf)**<br>`w3c-rdf` | W3C | [2014-02-25](https://www.w3.org/TR/rdf11-concepts/) | `conforms` — this repository's artefacts are valid against it |
| **[RDF Schema 1.1](#w3c-rdfs)**<br>`w3c-rdfs` | W3C | [2014-02-25](https://www.w3.org/TR/rdf-schema/) | `conforms` — this repository's artefacts are valid against it |
| **[SKOS Simple Knowledge Organization System Reference](#w3c-skos)**<br>`w3c-skos` | W3C | [2009-08-18](https://www.w3.org/TR/2009/REC-skos-reference-20090818/) | `conforms` — this repository's artefacts are valid against it |
| **[Web Annotation Vocabulary](#w3c-web-annotation)**<br>`w3c-web-annotation` | W3C | [2017-02-23](https://www.w3.org/TR/annotation-vocab/) | `conforms` — this repository's artefacts are valid against it |
| **[XML Schema Definition Language (XSD) 1.1 Part 2: Datatypes](#w3c-xsd11-datatypes)**<br>`w3c-xsd11-datatypes` | W3C | [2012-04-05](https://www.w3.org/TR/xmlschema11-2/) | `conforms` — this repository's artefacts are valid against it |
| **[W3C XML Schema Definition Language (XSD) 1.1 Part 1: Structures](#w3c-xsd11-structures)**<br>`w3c-xsd11-structures` | W3C | [2012-04-05](https://www.w3.org/TR/xmlschema11-1/) | `conforms` — this repository's artefacts are valid against it |
| **[WHO SMART Guidelines base IG](#who-smart-base)**<br>`who-smart-base` | other | [v1.0.0](https://smart.who.int/base/) | `reads` — this repository parses documents written in it |

## Who declares each specification

A user declares the specification it depends on; the record names no user.
That is data-modelling step 8 — the dependent holds the pointer — and it is
why this list cannot drift from the code: a file that stops declaring stops
being listed. Four forms are read: a `@conformsTo` tag, a `conformsTo:`
front-matter list, an `xmlns` binding, and a graph kind whose typing module
declares the spec (bean `u63y`).

Every declaration names a record on this page.

## Namespaces the corpus uses against the ones it declares

Read from the BPMN and DMN files themselves — **5** namespace IRI(s)
are in use. Derived rather than listed, so a diagram that adopts a new
vocabulary shows up here instead of going unnoticed.

Every namespace the corpus declares is covered by a record above.

**25 declared and not in use.** Not a defect on its own: a
record may cover a namespace only some artefacts carry. It is here because
a registry nobody prunes is one that stops describing the repository.

- `http://hl7.org/fhir/`
- `http://purl.org/dc/dcam/`
- `http://purl.org/dc/elements/1.1/`
- `http://purl.org/dc/terms/`
- `http://purl.org/spar/cito/`
- `http://purl.org/spar/deo/`
- `http://purl.org/spar/doco/`
- `http://smart.who.int/base/StructureDefinition/`
- `http://www.omg.org/spec/BPMN/20100524/MODEL#`
- `http://www.w3.org/1999/02/22-rdf-syntax-ns#`
- `http://www.w3.org/2000/01/rdf-schema#`
- `http://www.w3.org/2001/XMLSchema#`
- `http://www.w3.org/2001/XMLSchema-instance`
- `http://www.w3.org/2002/07/owl#`
- `http://www.w3.org/2002/12/cal/ical#`
- `http://www.w3.org/2004/02/skos/core#`
- `http://www.w3.org/ns/csvw#`
- `http://www.w3.org/ns/oa#`
- `http://www.w3.org/ns/odrl/2/`
- `http://www.w3.org/ns/prov#`
- `https://hdl.handle.net/`
- `https://openprovenance.org/ns/provext#`
- `https://schema.org/`
- `https://spdx.org/licenses/`
- `https://www.omg.org/spec/DMN/20191111/DMNDI/`

## Each specification

### DCMI Metadata Terms {#dcmi-terms}

`dcmi-terms` — DCMI, edition [2020-01-20](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/2020-01-20/) — `reads`, meaning this repository parses documents written in it.

**Namespaces.**

- `http://purl.org/dc/elements/1.1/`
- `http://purl.org/dc/terms/`
- `http://purl.org/dc/dcam/`

**Note.** `reads`, not `conforms`: these records describe SOMEBODY ELSE'S metadata — DSpace's — so a DCMI revision is a compatibility question rather than a migration. THE TRANSCRIPTION CAME FIRST AND THAT WAS THE DEFECT. `dublin-core.ts` was written from ONE captured IRIS record and carries the prefix string `dc` with no namespace URI and no edition, so it recorded what one deployment SPELLS rather than what the standard DEFINES — and a transcription with no cited edition cannot say whether a field it lacks is missing or simply not in that edition. The operative terms below are derived from the catalogue records, so they are what IRIS actually sends; DSpace also mints `dcterms`, `local` and other prefixes this repository has not met. A term absent here is UNDECLARED, not unsupported.

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/scripts/kg-export.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/kg-export.ts) | `@conformsTo` tag |
| [`cat-harness/scripts/ns-export.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/ns-export.ts) | `@conformsTo` tag |
| [`cat-harness/scripts/todo-graph.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/todo-graph.ts) | `@conformsTo` tag |
| [`folio-assistant-core/schemas/dublin-core-render.ts`](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-core/schemas/dublin-core-render.ts) | `@conformsTo` tag |
| [`folio-assistant-core/schemas/dublin-core.ts`](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-core/schemas/dublin-core.ts) | `@conformsTo` tag |
| `folio-dublin-core/v1 nodes` | through the module that types it ([`folio-assistant-core/schemas/dublin-core.ts`](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-core/schemas/dublin-core.ts)) |
| `folio-dublin-core/v1 nodes` | through the module that types it ([`folio-assistant-core/schemas/dublin-core.ts`](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-core/schemas/dublin-core.ts)) |
| [`who-iris/skills/iris-dspace.md`](https://github.com/litlfred/folio-assistant/blob/main/who-iris/skills/iris-dspace.md) | `conformsTo:` front matter |

**Operative terms (22).** The terms this repository acts on —
derived by the tooling from the corpus, never hand-listed, and deliberately
a subset of the edition rather than a transcription of it.

| term | what it means here |
|---|---|
| `dc.contributor.author` | derived from the corpus; what this repository does with it is not yet described |
| `dc.coverage.spatial` | derived from the corpus; what this repository does with it is not yet described |
| `dc.date.accessioned` | derived from the corpus; what this repository does with it is not yet described |
| `dc.date.available` | derived from the corpus; what this repository does with it is not yet described |
| `dc.date.created` | derived from the corpus; what this repository does with it is not yet described |
| `dc.date.issued` | derived from the corpus; what this repository does with it is not yet described |
| `dc.description` | derived from the corpus; what this repository does with it is not yet described |
| `dc.description.abstract` | derived from the corpus; what this repository does with it is not yet described |
| `dc.description.tableofcontents` | derived from the corpus; what this repository does with it is not yet described |
| `dc.identifier.govdoc` | derived from the corpus; what this repository does with it is not yet described |
| `dc.identifier.isbn` | derived from the corpus; what this repository does with it is not yet described |
| `dc.identifier.uri` | derived from the corpus; what this repository does with it is not yet described |
| `dc.language` | derived from the corpus; what this repository does with it is not yet described |
| `dc.language.iso` | derived from the corpus; what this repository does with it is not yet described |
| `dc.publisher` | derived from the corpus; what this repository does with it is not yet described |
| `dc.subject.mesh` | derived from the corpus; what this repository does with it is not yet described |
| `dc.subject.meshqualifier` | derived from the corpus; what this repository does with it is not yet described |
| `dc.subject.other` | derived from the corpus; what this repository does with it is not yet described |
| `dc.title` | derived from the corpus; what this repository does with it is not yet described |
| `dc.title.release` | derived from the corpus; what this repository does with it is not yet described |
| `dc.type` | derived from the corpus; what this repository does with it is not yet described |
| `who.relation.languageVersion` | derived from the corpus; what this repository does with it is not yet described |

### HL7 FHIR {#hl7-fhir}

`hl7-fhir` — HL7, edition [unpinned](https://hl7.org/fhir/) — `reads`, meaning this repository parses documents written in it.

**Namespaces.**

- `http://hl7.org/fhir/`

**Note.** No FHIR version is declared anywhere in this repository (measured 2026-09-23), and the namespace is version-independent. `reads`: the platform parses FHIR artefacts other instances ingest; it does not claim its own documents are FHIR resources.

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/schemas/jsonld.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/jsonld.ts) | `@conformsTo` tag |
| [`cat-harness/schemas/vocab-mapping-fhir.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/vocab-mapping-fhir.ts) | `@conformsTo` tag |
| [`cat-harness/schemas/vocab-mapping.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/vocab-mapping.ts) | `@conformsTo` tag |
| `vocab-mapping graph` | through the module that types it ([`cat-harness/schemas/vocab-mapping.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/vocab-mapping.ts)) |

**Operative terms (1).** The terms this repository acts on —
derived by the tooling from the corpus, never hand-listed, and deliberately
a subset of the edition rather than a transcription of it.

| term | what it means here |
|---|---|
| `fhir:ValueSet` | derived from the corpus; what this repository does with it is not yet described |

### Handle System Overview (RFC 3650), with its namespace (RFC 3651) and protocol (RFC 3652) {#ietf-handle-system}

`ietf-handle-system` — IETF, edition [2003-11](https://www.rfc-editor.org/rfc/rfc3650) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `https://hdl.handle.net/`

**Note.** The persistent identifiers DSpace mints (`<prefix>/<suffix>`, e.g. WHO IRIS's 10665/332098), written as IRIs through the global HTTP resolver https://hdl.handle.net/. Emitted by schemas/prov-jsonld.ts for PROV `prov:used`: owner decision 2026-10-01 (option A) links a catalogue item at its Handle, the identifier that outlives the publishing host, rather than at the host's own item URL. folio-assistant-core's catalogue schema (HandleSchema, handleIri) applies the same rule to catalogue records. The RFCs are Informational and define the identifier system; the hdl.handle.net proxy is the resolver its operators run, not a namespace in the vocabulary sense.

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/schemas/prov-jsonld.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/prov-jsonld.ts) | `@conformsTo` tag |

**No operative terms.** This repository conforms to the specification
without branching on any of its terms, so none is materialised into the
graph. That is a determined zero, not an unfilled field.

### Business Process Model and Notation (BPMN) {#omg-bpmn-2.0}

`omg-bpmn-2.0` — OMG, edition [2.0](https://www.omg.org/spec/BPMN/2.0/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `http://www.omg.org/spec/BPMN/20100524/MODEL`
- `http://www.omg.org/spec/BPMN/20100524/MODEL#`
- `http://www.omg.org/spec/BPMN/20100524/DI`

**Note.** The `20100524` in every namespace is BPMN 2.0's release date and is how the edition is identified in an instance document — the diagrams have carried it since the first one was drawn, and until 2026-09-20 nothing in this repository said which specification that was. `conforms` rather than `reads`: these are OUR instance documents, so a version bump is a migration of the corpus rather than a compatibility question. NO XSD IS HELD and none is fetched — `referenced`, per the owner's "dont need to materalize, but should reference specific version being used". That means nothing validates a diagram STRUCTURALLY against OMG's schema; `check:workflows` and `kg:audit` check the things this repository cares about (lanes bind declared roles, activities name skills) and are not a substitute for it. The `MODEL#` form is the RDF spelling of the same namespace: OMG publishes no RDF vocabulary for BPMN, so a graph that states a sequence flow's `sourceRef`/`targetRef` or a node's `incoming`/`outgoing` (kg-export, and bootstrap-tools' `export-graph.ts`) names BPMN's own attribute by appending `#` to its XML namespace — the model's name for the relation, rather than a second one minted here (owner, 2026-09-30, bean `xsqm`).

**What depends on it.**

| user | declared by |
|---|---|
| `cat-harness/processes/content/*.bpmn (4)` | `xmlns` binding |
| `cat-harness/processes/kg/*.bpmn (5)` | `xmlns` binding |
| `cat-harness/processes/library/*.bpmn (14)` | `xmlns` binding |
| `cat-harness/processes/process/*.bpmn (12)` | `xmlns` binding |
| `cat-harness/processes/sdlc/*.bpmn (23)` | `xmlns` binding |
| `cat-harness/processes/ui/*.bpmn (4)` | `xmlns` binding |
| [`cat-harness/scripts/kg-export.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/kg-export.ts) | `@conformsTo` tag |
| [`cat-harness/scripts/render-bpmn.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/render-bpmn.ts) | `@conformsTo` tag |
| [`cat-harness/src/workflow/process-model.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/src/workflow/process-model.ts) | `@conformsTo` tag |
| `fhir-harness/processes/content/*.bpmn (2)` | `xmlns` binding |
| `folio-assistant-core/processes/conduct/*.bpmn (1)` | `xmlns` binding |
| `folio-assistant-core/processes/content/*.bpmn (6)` | `xmlns` binding |
| `folio-assistant-core/processes/library/*.bpmn (1)` | `xmlns` binding |
| `folio-assistant-core/processes/ui/*.bpmn (3)` | `xmlns` binding |
| `folio-assistant-sci/processes/content/*.bpmn (2)` | `xmlns` binding |
| `smart-base/methodologies/processes/*.bpmn (1)` | `xmlns` binding |
| `smart-base/processes/content/*.bpmn (1)` | `xmlns` binding |

**Operative terms (22).** The terms this repository acts on —
derived by the tooling from the corpus, never hand-listed, and deliberately
a subset of the edition rather than a transcription of it.

| term | what it means here |
|---|---|
| `bpmn:callActivity` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:collaboration` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:definitions` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:documentation` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:endEvent` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:exclusiveGateway` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:extensionElements` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:flowNodeRef` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:import` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:incoming` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:lane` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:laneSet` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:outgoing` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:parallelGateway` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:participant` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:process` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:sequenceFlow` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:serviceTask` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:startEvent` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:task` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:timerEventDefinition` | derived from the corpus; what this repository does with it is not yet described |
| `bpmn:userTask` | derived from the corpus; what this repository does with it is not yet described |

### Diagram Definition (DD) {#omg-dd-1.0}

`omg-dd-1.0` — OMG, edition [1.0](https://www.omg.org/spec/DD/1.0/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `http://www.omg.org/spec/DD/20100524/DC`
- `http://www.omg.org/spec/DD/20100524/DI`

**Note.** Separate from BPMN even though the release date matches: DD is its own OMG specification and BPMN's DI namespace builds on it. Recording them as one would make a DD bump invisible. `DD/.../DC` is Diagram Common — NOT Dublin Core, which is `dcmi-terms` in this registry and shares nothing with it but a two-letter prefix. That collision is exactly why a namespace URI is the identity here and a prefix is not.

**What depends on it.**

| user | declared by |
|---|---|
| `cat-harness/processes/content/*.bpmn (4)` | `xmlns` binding |
| `cat-harness/processes/kg/*.bpmn (5)` | `xmlns` binding |
| `cat-harness/processes/library/*.bpmn (14)` | `xmlns` binding |
| `cat-harness/processes/process/*.bpmn (12)` | `xmlns` binding |
| `cat-harness/processes/sdlc/*.bpmn (23)` | `xmlns` binding |
| `cat-harness/processes/ui/*.bpmn (4)` | `xmlns` binding |
| [`cat-harness/scripts/render-bpmn.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/render-bpmn.ts) | `@conformsTo` tag |
| `fhir-harness/processes/content/*.bpmn (2)` | `xmlns` binding |
| `folio-assistant-core/processes/conduct/*.bpmn (1)` | `xmlns` binding |
| `folio-assistant-core/processes/content/*.bpmn (6)` | `xmlns` binding |
| `folio-assistant-core/processes/library/*.bpmn (1)` | `xmlns` binding |
| `folio-assistant-core/processes/ui/*.bpmn (3)` | `xmlns` binding |
| `folio-assistant-sci/processes/content/*.bpmn (2)` | `xmlns` binding |
| `smart-base/methodologies/processes/*.bpmn (1)` | `xmlns` binding |
| `smart-base/processes/content/*.bpmn (1)` | `xmlns` binding |

**No operative terms.** This repository conforms to the specification
without branching on any of its terms, so none is materialised into the
graph. That is a determined zero, not an unfilled field.

### Decision Model and Notation (DMN) {#omg-dmn-1.3}

`omg-dmn-1.3` — OMG, edition [1.3](https://www.omg.org/spec/DMN/1.3/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `https://www.omg.org/spec/DMN/20191111/MODEL/`
- `https://www.omg.org/spec/DMN/20191111/DMNDI/`

**Note.** The decision tables under processes/decisions/ that BPMN gateways compute from. Added 2026-09-27 when the knowledge graph began linking each process graph to the standards its files declare; until then the DMN namespaces went unregistered because namespacesInUse read only the top of processes/.

**What depends on it.**

| user | declared by |
|---|---|
| `cat-harness/processes/kg/decisions/*.dmn (3)` | `xmlns` binding |
| `cat-harness/processes/sdlc/decisions/*.dmn (2)` | `xmlns` binding |
| `folio-assistant-core/processes/conduct/decisions/*.dmn (2)` | `xmlns` binding |
| `folio-assistant-core/processes/content/decisions/*.dmn (2)` | `xmlns` binding |
| `folio-assistant-sci/processes/content/decisions/*.dmn (1)` | `xmlns` binding |

**No operative terms.** This repository conforms to the specification
without branching on any of its terms, so none is materialised into the
graph. That is a determined zero, not an unfilled field.

### Schema.org {#schema-org}

`schema-org` — other, edition [unpinned](https://schema.org/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `https://schema.org/`

**Note.** No release is pinned: schema.org publishes continuously under one namespace. Used for one property in kg-export. Recorded 2026-09-23 (bean 2j09).

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/scripts/kg-export.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/kg-export.ts) | `@conformsTo` tag |
| [`cat-harness/scripts/todo-graph.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/todo-graph.ts) | `@conformsTo` tag |

**Operative terms (4).** The terms this repository acts on —
derived by the tooling from the corpus, never hand-listed, and deliberately
a subset of the edition rather than a transcription of it.

| term | what it means here |
|---|---|
| `schema:WebPage` | derived from the corpus; what this repository does with it is not yet described |
| `schema:codeRepository` | derived from the corpus; what this repository does with it is not yet described |
| `schema:softwareVersion` | derived from the corpus; what this repository does with it is not yet described |
| `schema:text` | derived from the corpus; what this repository does with it is not yet described |

### SPAR Ontologies: DoCO, DEO and CiTO {#spar-doco-deo-cito}

`spar-doco-deo-cito` — other, edition [unpinned](http://www.sparontologies.net/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `http://purl.org/spar/doco/`
- `http://purl.org/spar/deo/`
- `http://purl.org/spar/cito/`

**Note.** No edition is pinned: each namespace is a purl.org redirect to the ontology's current release. Recorded 2026-09-23 (bean 2j09) so the dependency is named; pinning an edition is a later decision.

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/schemas/jsonld.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/jsonld.ts) | `@conformsTo` tag |

**Operative terms (7).** The terms this repository acts on —
derived by the tooling from the corpus, never hand-listed, and deliberately
a subset of the edition rather than a transcription of it.

| term | what it means here |
|---|---|
| `cito:cites` | derived from the corpus; what this repository does with it is not yet described |
| `deo:Conclusion` | derived from the corpus; what this repository does with it is not yet described |
| `deo:Introduction` | derived from the corpus; what this repository does with it is not yet described |
| `doco:Figure` | derived from the corpus; what this repository does with it is not yet described |
| `doco:Formula` | derived from the corpus; what this repository does with it is not yet described |
| `doco:Section` | derived from the corpus; what this repository does with it is not yet described |
| `doco:Table` | derived from the corpus; what this repository does with it is not yet described |

### SPDX License List {#spdx-license-list}

`spdx-license-list` — other, edition [3.29.0](https://spdx.org/licenses/) — `reads`, meaning this repository parses documents written in it.

**Namespaces.**

- `https://spdx.org/licenses/`

**Note.** The identifiers a `licence.json` `id` (and an `intake.json` licence) may use, as an SPDX licence expression: a listed licence or exception id, or a `LicenseRef-`. Adopted for VALIDATION ONLY on the owner's ruling 2026-10-03 (bean sd5v): 'go ahead with licence-id validation, that's it for now' — no SPDX documents are produced. The ids are snapshotted beside this record in spdx-license-list.terminology.json; move this pin, fetch github.com/spdx/license-list-data at tag v<version>, and re-run scripts/pin-spdx-license-list.ts to update both together. Authority is `other` because the list is published by the SPDX Legal Team of The Linux Foundation, not by a standards body this registry names.

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/schemas/spdx-license-expression.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/spdx-license-expression.ts) | `@conformsTo` tag |

**No operative terms.** This repository conforms to the specification
without branching on any of its terms, so none is materialised into the
graph. That is a determined zero, not an unfilled field.

### Metadata Vocabulary for Tabular Data {#w3c-csvw}

`w3c-csvw` — W3C, edition [2015-12-17](https://www.w3.org/TR/tabular-metadata/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `http://www.w3.org/ns/csvw#`

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/schemas/jsonld.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/jsonld.ts) | `@conformsTo` tag |

**Operative terms (1).** The terms this repository acts on —
derived by the tooling from the corpus, never hand-listed, and deliberately
a subset of the edition rather than a transcription of it.

| term | what it means here |
|---|---|
| `csvw:TableGroup` | derived from the corpus; what this repository does with it is not yet described |

### ODRL Information Model 2.2 {#w3c-odrl}

`w3c-odrl` — W3C, edition [2018-02-15](https://www.w3.org/TR/odrl-model/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `http://www.w3.org/ns/odrl/2/`

**Note.** Added when the bean 2j09 JSON-LD scan found ODRL bound in cat-harness/policies/folio-defaults.jsonld (#1181) with no record. `conforms`: that file is an ODRL policy document, by the rule the owner approved 2026-09-23 for namespaces this instance's documents are written in.

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/schemas/odrl.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/odrl.ts) | `@conformsTo` tag |
| `policies graph` | through the module that types it ([`cat-harness/schemas/odrl.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/odrl.ts)) |

**Operative terms (14).** The terms this repository acts on —
derived by the tooling from the corpus, never hand-listed, and deliberately
a subset of the edition rather than a transcription of it.

| term | what it means here |
|---|---|
| `odrl:annotate` | derived from the corpus; what this repository does with it is not yet described |
| `odrl:derive` | derived from the corpus; what this repository does with it is not yet described |
| `odrl:display` | derived from the corpus; what this repository does with it is not yet described |
| `odrl:eq` | derived from the corpus; what this repository does with it is not yet described |
| `odrl:execute` | derived from the corpus; what this repository does with it is not yet described |
| `odrl:invalid` | derived from the corpus; what this repository does with it is not yet described |
| `odrl:isAnyOf` | derived from the corpus; what this repository does with it is not yet described |
| `odrl:isNoneOf` | derived from the corpus; what this repository does with it is not yet described |
| `odrl:modify` | derived from the corpus; what this repository does with it is not yet described |
| `odrl:neq` | derived from the corpus; what this repository does with it is not yet described |
| `odrl:perm` | derived from the corpus; what this repository does with it is not yet described |
| `odrl:prohibit` | derived from the corpus; what this repository does with it is not yet described |
| `odrl:translate` | derived from the corpus; what this repository does with it is not yet described |
| `odrl:use` | derived from the corpus; what this repository does with it is not yet described |

### OWL 2 Web Ontology Language Document Overview (Second Edition) {#w3c-owl2}

`w3c-owl2` — W3C, edition [2012-12-11](https://www.w3.org/TR/owl2-overview/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `http://www.w3.org/2002/07/owl#`

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/scripts/code-lists.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/code-lists.ts) | `@conformsTo` tag |
| [`cat-harness/scripts/glossary-export.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/glossary-export.ts) | `@conformsTo` tag |
| [`cat-harness/scripts/ns-export.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/ns-export.ts) | `@conformsTo` tag |

**Operative terms (3).** The terms this repository acts on —
derived by the tooling from the corpus, never hand-listed, and deliberately
a subset of the edition rather than a transcription of it.

| term | what it means here |
|---|---|
| `owl:Ontology` | derived from the corpus; what this repository does with it is not yet described |
| `owl:deprecated` | derived from the corpus; what this repository does with it is not yet described |
| `owl:sameAs` | derived from the corpus; what this repository does with it is not yet described |

### The PROV-JSONLD Serialization: A JSON-LD Representation for the PROV Data Model {#w3c-prov-jsonld}

`w3c-prov-jsonld` — W3C, edition [2024-08-25](https://www.w3.org/submissions/2024/SUBM-prov-jsonld-20240825/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `https://openprovenance.org/ns/provext#`

**Note.** A W3C Member Submission (King's College London; editors Luc Moreau, Dong Huynh) — acknowledged by W3C, NOT endorsed. Adopted by owner decision 2026-10-01 (beans jcet, 9y9j) because W3C publishes no JSON-LD context for PROV-O; PROV itself stays pinned by w3c-prov-o. The text is held at library/w3c-2024-prov-jsonld and its context.jsonld beside it, pinned by sha256 in schemas/prov-jsonld.ts and served offline; provext# is the Submission's own extension namespace, which that context binds.

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/schemas/prov-jsonld.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/prov-jsonld.ts) | `@conformsTo` tag |

**No operative terms.** This repository conforms to the specification
without branching on any of its terms, so none is materialised into the
graph. That is a determined zero, not an unfilled field.

### PROV-O: The PROV Ontology {#w3c-prov-o}

`w3c-prov-o` — W3C, edition [2013-04-30](https://www.w3.org/TR/prov-o/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `http://www.w3.org/ns/prov#`

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/schemas/jsonld.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/jsonld.ts) | `@conformsTo` tag |
| [`cat-harness/scripts/kg-export.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/kg-export.ts) | `@conformsTo` tag |

**Operative terms (3).** The terms this repository acts on —
derived by the tooling from the corpus, never hand-listed, and deliberately
a subset of the edition rather than a transcription of it.

| term | what it means here |
|---|---|
| `prov:Entity` | derived from the corpus; what this repository does with it is not yet described |
| `prov:alternateOf` | derived from the corpus; what this repository does with it is not yet described |
| `prov:wasDerivedFrom` | derived from the corpus; what this repository does with it is not yet described |

### RDF Calendar — an application of the Resource Description Framework to iCalendar Data {#w3c-rdf-calendar}

`w3c-rdf-calendar` — W3C, edition [2005-09-29](https://www.w3.org/TR/rdfcal/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `http://www.w3.org/2002/12/cal/ical#`

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/scripts/todo-graph.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/todo-graph.ts) | `@conformsTo` tag |

**No operative terms.** This repository conforms to the specification
without branching on any of its terms, so none is materialised into the
graph. That is a determined zero, not an unfilled field.

### RDF 1.1 Concepts and Abstract Syntax {#w3c-rdf}

`w3c-rdf` — W3C, edition [2014-02-25](https://www.w3.org/TR/rdf11-concepts/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `http://www.w3.org/1999/02/22-rdf-syntax-ns#`

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/scripts/code-lists.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/code-lists.ts) | `@conformsTo` tag |
| [`cat-harness/scripts/ns-export.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/ns-export.ts) | `@conformsTo` tag |
| [`folio-assistant-core/schemas/dublin-core-render.ts`](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-core/schemas/dublin-core-render.ts) | `@conformsTo` tag |

**Operative terms (2).** The terms this repository acts on —
derived by the tooling from the corpus, never hand-listed, and deliberately
a subset of the edition rather than a transcription of it.

| term | what it means here |
|---|---|
| `rdf:JSON` | derived from the corpus; what this repository does with it is not yet described |
| `rdf:Property` | derived from the corpus; what this repository does with it is not yet described |

### RDF Schema 1.1 {#w3c-rdfs}

`w3c-rdfs` — W3C, edition [2014-02-25](https://www.w3.org/TR/rdf-schema/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `http://www.w3.org/2000/01/rdf-schema#`

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/scripts/glossary-export.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/glossary-export.ts) | `@conformsTo` tag |
| [`cat-harness/scripts/kg-export.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/kg-export.ts) | `@conformsTo` tag |
| [`cat-harness/scripts/ns-export.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/ns-export.ts) | `@conformsTo` tag |

**Operative terms (5).** The terms this repository acts on —
derived by the tooling from the corpus, never hand-listed, and deliberately
a subset of the edition rather than a transcription of it.

| term | what it means here |
|---|---|
| `rdfs:Class` | derived from the corpus; what this repository does with it is not yet described |
| `rdfs:comment` | derived from the corpus; what this repository does with it is not yet described |
| `rdfs:isDefinedBy` | derived from the corpus; what this repository does with it is not yet described |
| `rdfs:label` | derived from the corpus; what this repository does with it is not yet described |
| `rdfs:seeAlso` | derived from the corpus; what this repository does with it is not yet described |

### SKOS Simple Knowledge Organization System Reference {#w3c-skos}

`w3c-skos` — W3C, edition [2009-08-18](https://www.w3.org/TR/2009/REC-skos-reference-20090818/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `http://www.w3.org/2004/02/skos/core#`

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/schemas/jsonld.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/jsonld.ts) | `@conformsTo` tag |
| [`cat-harness/schemas/vocab-mapping.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/vocab-mapping.ts) | `@conformsTo` tag |
| [`cat-harness/schemas/vocabulary.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/vocabulary.ts) | `@conformsTo` tag |
| [`cat-harness/scripts/glossary-export.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/glossary-export.ts) | `@conformsTo` tag |
| [`cat-harness/scripts/ns-export.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/ns-export.ts) | `@conformsTo` tag |
| `vocab-mapping graph` | through the module that types it ([`cat-harness/schemas/vocab-mapping.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/vocab-mapping.ts)) |

**Operative terms (22).** The terms this repository acts on —
derived by the tooling from the corpus, never hand-listed, and deliberately
a subset of the edition rather than a transcription of it.

| term | what it means here |
|---|---|
| `skos:Collection` | A glossary's `members` (folio-glossary/v1): external concepts this folio lists without copying them, emitted by folio-assistant-core/schemas/glossary.ts#toSkos. |
| `skos:Concept` | A MEANING, and the authoritative object for one. Minted per declared ROLE, never per lane name — 85 lane names resolve to 36 roles, so a concept per name would mint 85 terms for 36 meanings. |
| `skos:ConceptScheme` | The glossary document IS the scheme; there is no separate `…#scheme` IRI, because that would name a set that already has a name and would not dereference (`blv9`). |
| `skos:OrderedCollection` | derived from the corpus; what this repository does with it is not yet described |
| `skos:altLabel` | The other names one concept is drawn under. `build-pipeline` is labelled ten ways across the corpus; nine are altLabels, which is what makes "Reviewer / SME" findable as "Reviewer" rather than a rival entry. |
| `skos:broadMatch` | Declared as one of the four mapping predicates `vocabulary-authority` names, and NOT YET emitted by anything: `check:term-mapping` resolves label equality, which cannot establish that one concept is broader than another. Recorded as available rather than used, so a reader does not infer from its presence that a hierarchy has been computed. |
| `skos:broader` | A glossary term's `broader`: a local term id or an external IRI, emitted as a link (folio-glossary/v1). |
| `skos:changeNote` | Retirement. A term whose defining role is gone is deprecated and dated in the ledger, never deleted — a derived document has no memory, so the ledger is what makes "reported and never deleted" implementable. |
| `skos:closeMatch` | A candidate matched through a concept's `altLabel` rather than its `prefLabel` — the right idea under another name. It is the `concept`-but-not-`exact` case, and the asymmetry is the whole reason `check:term-mapping` records the two states as a pair rather than one boolean. |
| `skos:definition` | What the term MEANS, taken from the role's authored `description` — one author, one place to fix. Absent by design on a lane whose performer varies, which is honest rather than indistinguishable from a lane nobody bound. |
| `skos:exactMatch` | A candidate glossary term matched to a concept by its `prefLabel` — the `exact` half of `check:term-mapping`'s pair. Also what an authored term carries to an external vocabulary (`policy` to ODRL's), which is how a match against a local concept reports the external IRI behind it rather than only an in-repo id. |
| `skos:hiddenLabel` | a role's former names (`formerNames` in roles.json), emitted by glossary-export: findable by a reader holding an old name, never offered as current |
| `skos:inScheme` | Binds a concept to its instance's glossary document. Each concept's `inScheme` names that document's own published URL, so a preview that publishes the graph without the glossary serves a 404ing scheme IRI — which `check:invocation-parity` refuses. |
| `skos:member` | The external concept IRIs of a glossary's `members` Collection. |
| `skos:memberList` | derived from the corpus; what this repository does with it is not yet described |
| `skos:narrowMatch` | The SKOS rendering of FHIR R5's `source-is-broader-than-target` in a vocabulary mapping table (`SKOS_MATCH_FOR`, schemas/vocab-mapping.ts, bean k74z): `A skos:narrowMatch B` says B is narrower. |
| `skos:notation` | The CODE. `TermGloss`'s prefixed name (`cat:FshGutsNode`) already WAS this, which is why the "coded glossary" requirement was satisfied by data that existed rather than by new authoring. |
| `skos:note` | The status of a glossary term that is not `authored` (`candidate`, or `could-not-extract` with its reason), so a SKOS-only reader can tell it is not a curated definition (bean `lqo9`). |
| `skos:prefLabel` | The one name a concept is published under. AUTHORITATIVE for a concept's name — where a node is both a resource and a concept, `dcterms:title` is the derived copy and this is the source. |
| `skos:related` | A glossary term's `related`: a local term id or an external IRI. |
| `skos:relatedMatch` | The fourth mapping predicate, and like `broadMatch` not yet emitted. Relatedness is a judgement no label comparison can reach, so it waits for an adjudication step (bean `2i5f`) rather than being approximated. |
| `skos:scopeNote` | What a lane is accountable for IN ONE PROCESS. Carried on the LaneUsage node, never the concept: of 26 lane names appearing in more than one diagram, 26 of 26 document themselves differently per occurrence, so ten unattributed notes on one concept would read as ten contradictions. Stored verbatim, because the note is a `.pot` msgid. |

### Web Annotation Vocabulary {#w3c-web-annotation}

`w3c-web-annotation` — W3C, edition [2017-02-23](https://www.w3.org/TR/annotation-vocab/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `http://www.w3.org/ns/oa#`

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/schemas/jsonld.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/jsonld.ts) | `@conformsTo` tag |

**No operative terms.** This repository conforms to the specification
without branching on any of its terms, so none is materialised into the
graph. That is a determined zero, not an unfilled field.

### XML Schema Definition Language (XSD) 1.1 Part 2: Datatypes {#w3c-xsd11-datatypes}

`w3c-xsd11-datatypes` — W3C, edition [2012-04-05](https://www.w3.org/TR/xmlschema11-2/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `http://www.w3.org/2001/XMLSchema#`

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/schemas/jsonld.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/jsonld.ts) | `@conformsTo` tag |
| [`cat-harness/scripts/kg-export.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/scripts/kg-export.ts) | `@conformsTo` tag |

**No operative terms.** This repository conforms to the specification
without branching on any of its terms, so none is materialised into the
graph. That is a determined zero, not an unfilled field.

### W3C XML Schema Definition Language (XSD) 1.1 Part 1: Structures {#w3c-xsd11-structures}

`w3c-xsd11-structures` — W3C, edition [2012-04-05](https://www.w3.org/TR/xmlschema11-1/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `http://www.w3.org/2001/XMLSchema-instance`

**Note.** Added for bean 7eak. The Dublin Core XML rendering (folio-assistant-core/schemas/dublin-core-render.ts) puts `xsi:type="dcterms:<Scheme>"` on an element to name its encoding scheme. That is how DCMI's Guidelines for implementing Dublin Core in XML (2003-04-02) carry W3CDTF, URI, RFC4646 and MESH. The `xsi` namespace is defined in Part 1 (Structures) §2.7, not in Part 2 (Datatypes), which `w3c-xsd11-datatypes` already pins. So this is a separate record and not an extra namespace on that one.

**What depends on it.**

| user | declared by |
|---|---|
| [`folio-assistant-core/schemas/dublin-core-render.ts`](https://github.com/litlfred/folio-assistant/blob/main/folio-assistant-core/schemas/dublin-core-render.ts) | `@conformsTo` tag |

**No operative terms.** This repository conforms to the specification
without branching on any of its terms, so none is materialised into the
graph. That is a determined zero, not an unfilled field.

### WHO SMART Guidelines base IG {#who-smart-base}

`who-smart-base` — other, edition [v1.0.0](https://smart.who.int/base/) — `reads`, meaning this repository parses documents written in it.

**Namespaces.**

- `http://smart.who.int/base/StructureDefinition/`

**Note.** Tracks the canonical smart-base's sushi-config.yaml declares (http://smart.who.int/base); its logical models publish under StructureDefinition/. `reads`: the platform references those models; it does not publish them. PINNED 2026-09-30 to v1.0.0 (sushi-config `version: 1.0.0`, `releaseLabel: release` — a published release, not a ci-build), on the owner's ruling that `check:term-mapping`'s fhir half asserts a published IG AT A VERSION. Its terminology is snapshotted beside this record in who-smart-base.terminology.json; move the pin and re-run scripts/pin-smart-base-terminology.ts to update both together.

**What depends on it.**

| user | declared by |
|---|---|
| [`cat-harness/schemas/jsonld.ts`](https://github.com/litlfred/folio-assistant/blob/main/cat-harness/schemas/jsonld.ts) | `@conformsTo` tag |

**No operative terms.** This repository conforms to the specification
without branching on any of its terms, so none is materialised into the
graph. That is a determined zero, not an unfilled field.
