---
title: "External schemas"
description: "The specifications this repository depends on — the edition of each, what would move if one bumped, and the terms it actually branches on."
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
<div class="xs-stat"><b>5</b><span>specifications</span></div>
<div class="xs-stat"><b>53</b><span>operative terms in the graph</span></div>
<div class="xs-stat"><b>15</b><span>declared dependents</span></div>
<div class="xs-stat"><b>0</b><span>dependents that no longer resolve</span></div>
</div>

## The specifications

| specification | authority | edition | how it is used |
|---|---|---|---|
| **[DCMI Metadata Terms](#dcmi-terms)**<br>`dcmi-terms` | DCMI | [2020-01-20](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/2020-01-20/) | `reads` — this repository parses documents written in it |
| **[Business Process Model and Notation (BPMN)](#omg-bpmn-2.0)**<br>`omg-bpmn-2.0` | OMG | [2.0](https://www.omg.org/spec/BPMN/2.0/) | `conforms` — this repository's artefacts are valid against it |
| **[Diagram Definition (DD)](#omg-dd-1.0)**<br>`omg-dd-1.0` | OMG | [1.0](https://www.omg.org/spec/DD/1.0/) | `conforms` — this repository's artefacts are valid against it |
| **[Data Catalog Vocabulary (DCAT) - Version 3](#w3c-dcat-3)**<br>`w3c-dcat-3` | W3C | [2024-08-22](https://www.w3.org/TR/2024/REC-vocab-dcat-3-20240822/) | `cites` — it is referenced, and nothing here is validated against it |
| **[SKOS Simple Knowledge Organization System Reference](#w3c-skos)**<br>`w3c-skos` | W3C | [2009-08-18](https://www.w3.org/TR/2009/REC-skos-reference-20090818/) | `conforms` — this repository's artefacts are valid against it |

## Does every declared dependent still exist?

`usedBy` is the blast radius of a version bump, and it is hand-written. A
path that has since been renamed leaves the record claiming a dependency
that is not there — which reads as a resolved reference in every listing,
the same way a dangling citation does one graph over.

**Three states, and the middle one is not a finding.** A glob or a path with
a note after it names something this cannot open and is written that way on
purpose; reporting it as broken would teach a reader to ignore the column.

Every one of the **9** entries spelled as a path
resolves in this checkout. **6** name a set or
carry a note and were not checked.

## Namespaces the corpus uses against the ones it declares

Read from the BPMN and DMN files themselves — **5** namespace IRI(s)
are in use. Derived rather than listed, so a diagram that adopts a new
vocabulary shows up here instead of going unnoticed.

**1 in use and not declared here** — a vocabulary this
repository writes and has said nothing about.

- `https://litlfred.github.io/folio-assistant/bpmn`

**4 declared and not in use.** Not a defect on its own: a
record may cover a namespace only some artefacts carry. It is here because
a registry nobody prunes is one that stops describing the repository.

- `http://purl.org/dc/elements/1.1/`
- `http://purl.org/dc/terms/`
- `http://www.w3.org/2004/02/skos/core#`
- `http://www.w3.org/ns/dcat#`

## Each specification

### DCMI Metadata Terms

<a id="dcmi-terms"></a>

`dcmi-terms` — DCMI, edition [2020-01-20](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/2020-01-20/) — `reads`, meaning this repository parses documents written in it.

**Namespaces.**

- `http://purl.org/dc/elements/1.1/`
- `http://purl.org/dc/terms/`

**Note.** `reads`, not `conforms`: these records describe SOMEBODY ELSE'S metadata — DSpace's — so a DCMI revision is a compatibility question rather than a migration. THE TRANSCRIPTION CAME FIRST AND THAT WAS THE DEFECT. `dublin-core.ts` was written from ONE captured IRIS record and carries the prefix string `dc` with no namespace URI and no edition, so it recorded what one deployment SPELLS rather than what the standard DEFINES — and a transcription with no cited edition cannot say whether a field it lacks is missing or simply not in that edition. The operative terms below are derived from the catalogue records, so they are what IRIS actually sends; DSpace also mints `dcterms`, `local` and other prefixes this repository has not met. A term absent here is UNDECLARED, not unsupported.

**What depends on it.**

| entry | |
|---|---|
| `folio-assistant-core/schemas/dublin-core.ts` | <span class="xs-tag xs-ok">resolves</span> |
| `who-iris/catalogue/records/*.dc.json` | <span class="xs-tag xs-na">not a path</span> |
| `who-iris/skills/iris-dspace.md` | <span class="xs-tag xs-ok">resolves</span> |

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

### Business Process Model and Notation (BPMN)

<a id="omg-bpmn-2.0"></a>

`omg-bpmn-2.0` — OMG, edition [2.0](https://www.omg.org/spec/BPMN/2.0/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `http://www.omg.org/spec/BPMN/20100524/MODEL`
- `http://www.omg.org/spec/BPMN/20100524/DI`

**Note.** The `20100524` in every namespace is BPMN 2.0's release date and is how the edition is identified in an instance document — the diagrams have carried it since the first one was drawn, and until 2026-09-20 nothing in this repository said which specification that was. `conforms` rather than `reads`: these are OUR instance documents, so a version bump is a migration of the corpus rather than a compatibility question. NO XSD IS HELD and none is fetched — `referenced`, per the owner's "dont need to materalize, but should reference specific version being used". That means nothing validates a diagram STRUCTURALLY against OMG's schema; `check:workflows` and `kg:audit` check the things this repository cares about (lanes bind declared roles, activities name skills) and are not a substitute for it.

**What depends on it.**

| entry | |
|---|---|
| `processes/*.bpmn` | <span class="xs-tag xs-na">not a path</span> |
| `src/workflow/ — the engine that executes them` | <span class="xs-tag xs-na">not a path</span> |
| `scripts/render-bpmn.ts — the published SVGs` | <span class="xs-tag xs-na">not a path</span> |

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

### Diagram Definition (DD)

<a id="omg-dd-1.0"></a>

`omg-dd-1.0` — OMG, edition [1.0](https://www.omg.org/spec/DD/1.0/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `http://www.omg.org/spec/DD/20100524/DC`
- `http://www.omg.org/spec/DD/20100524/DI`

**Note.** Separate from BPMN even though the release date matches: DD is its own OMG specification and BPMN's DI namespace builds on it. Recording them as one would make a DD bump invisible. `DD/.../DC` is Diagram Common — NOT Dublin Core, which is `dcmi-terms` in this registry and shares nothing with it but a two-letter prefix. That collision is exactly why a namespace URI is the identity here and a prefix is not.

**What depends on it.**

| entry | |
|---|---|
| `processes/*.bpmn — the BPMNDI layout every diagram carries` | <span class="xs-tag xs-na">not a path</span> |
| `scripts/render-bpmn.ts — bpmn-js reads DI to place shapes` | <span class="xs-tag xs-na">not a path</span> |

**No operative terms.** This repository conforms to the specification
without branching on any of its terms, so none is materialised into the
graph. That is a determined zero, not an unfilled field.

### Data Catalog Vocabulary (DCAT) - Version 3

<a id="w3c-dcat-3"></a>

`w3c-dcat-3` — W3C, edition [2024-08-22](https://www.w3.org/TR/2024/REC-vocab-dcat-3-20240822/) — `cites`, meaning it is referenced, and nothing here is validated against it.

**Namespaces.**

- `http://www.w3.org/ns/dcat#`

**Note.** REFERENCE ONLY — owner, 2026-09-23, on bean 4sim: 'Reference only'. Pinned so that the day a glossary or terminology RELEASE is described (a dcat:Dataset per published graph document, a dcat:Distribution per serialisation), the edition is already chosen and named, not guessed. Nothing in this repository emits a DCAT term today, so there are no operative terms. DCAT is also one more TARGET vocabulary for the ETL Tools of bean k74z.

**What depends on it.**

| entry | |
|---|---|
| `beans/defs/folio-assistant-4sim--dcat-describe-a-release-of-the-glossary-terminolog.md` | <span class="xs-tag xs-ok">resolves</span> |

**No operative terms.** This repository conforms to the specification
without branching on any of its terms, so none is materialised into the
graph. That is a determined zero, not an unfilled field.

### SKOS Simple Knowledge Organization System Reference

<a id="w3c-skos"></a>

`w3c-skos` — W3C, edition [2009-08-18](https://www.w3.org/TR/2009/REC-skos-reference-20090818/) — `conforms`, meaning this repository's artefacts are valid against it.

**Namespaces.**

- `http://www.w3.org/2004/02/skos/core#`

**What depends on it.**

| entry | |
|---|---|
| `cat-harness/scripts/glossary-export.ts` | <span class="xs-tag xs-ok">resolves</span> |
| `cat-harness/scripts/ns-export.ts` | <span class="xs-tag xs-ok">resolves</span> |
| `cat-harness/schemas/jsonld.ts` | <span class="xs-tag xs-ok">resolves</span> |
| `cat-harness/schemas/vocabulary.ts` | <span class="xs-tag xs-ok">resolves</span> |
| `cat-harness/glossary/glossary-ledger.json` | <span class="xs-tag xs-ok">resolves</span> |
| `bootstrap/glossary/glossary-ledger.json` | <span class="xs-tag xs-ok">resolves</span> |

**Operative terms (9).** The terms this repository acts on —
derived by the tooling from the corpus, never hand-listed, and deliberately
a subset of the edition rather than a transcription of it.

| term | what it means here |
|---|---|
| `skos:Concept` | A MEANING, and the authoritative object for one. Minted per declared ROLE, never per lane name — 85 lane names resolve to 36 roles, so a concept per name would mint 85 terms for 36 meanings. |
| `skos:ConceptScheme` | The glossary document IS the scheme; there is no separate `…#scheme` IRI, because that would name a set that already has a name and would not dereference (`blv9`). |
| `skos:altLabel` | The other names one concept is drawn under. `build-pipeline` is labelled ten ways across the corpus; nine are altLabels, which is what makes "Reviewer / SME" findable as "Reviewer" rather than a rival entry. |
| `skos:changeNote` | Retirement. A term whose defining role is gone is deprecated and dated in the ledger, never deleted — a derived document has no memory, so the ledger is what makes "reported and never deleted" implementable. |
| `skos:definition` | What the term MEANS, taken from the role's authored `description` — one author, one place to fix. Absent by design on a lane whose performer varies, which is honest rather than indistinguishable from a lane nobody bound. |
| `skos:inScheme` | Binds a concept to its instance's glossary document. Each concept's `inScheme` names that document's own published URL, so a preview that publishes the graph without the glossary serves a 404ing scheme IRI — which `check:invocation-parity` refuses. |
| `skos:notation` | The CODE. `TermGloss`'s prefixed name (`cat:FshGutsNode`) already WAS this, which is why the "coded glossary" requirement was satisfied by data that existed rather than by new authoring. |
| `skos:prefLabel` | The one name a concept is published under. AUTHORITATIVE for a concept's name — where a node is both a resource and a concept, `dcterms:title` is the derived copy and this is the source. |
| `skos:scopeNote` | What a lane is accountable for IN ONE PROCESS. Carried on the LaneUsage node, never the concept: of 26 lane names appearing in more than one diagram, 26 of 26 document themselves differently per occurrence, so ten unattributed notes on one concept would read as ten contradictions. Stored verbatim, because the note is a `.pot` msgid. |
