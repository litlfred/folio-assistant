---
# folio-assistant-lqo9
title: 'GLOSSARY: a coded, versioned glossary content kind in core, a defined-terms index in docs/ from every KG asset, translatable — roast first'
status: todo
type: feature
priority: normal
tags:
    - roast
created_at: 2026-09-20T18:03:45Z
updated_at: 2026-09-20T18:03:45Z
parent: folio-assistant-0lmb
---

Owner, 2026-09-20 (session_017PqeiS4JYySSWGAYLedmus), queued for a ROAST before anything is built:

> justthedocs docs/ rendering should include an index of all defined terms extracted from KG assets in the docs/ (e.g. a bpmn diagram swimlane has title/description). make translatable like all assets. make coded-glossary content kind that can be used in KG extraction and visualisation, re-used when looking at asset metadata. glossary can also be a content asset in a paper, document, L1 asset etc. so should be in core asset there. i want (but realistically can't require) coded and versioned glossary assets so those should be in schema. any good standards for this glossary maintenance? i know dcat? others pros cons/recommendations. what fits well with KG?

## The ask, as four separable pieces

1. **A defined-terms index in the docs/ rendering** — every KG asset that carries a title/description pair (BPMN lanes and activities, DMN decisions, roles, skills, Tool nodes, schema fields with descriptions) contributes its terms; one page indexes them with a link back to the asset.
2. **A `glossary` content kind in core** — a glossary is a content asset in its own right (a paper's glossary, a document's, an L1 asset's), so the kind lives in folio-assistant-core's schemas, not in a renderer.
3. **Coded and versioned, in the schema** — each term carries a notation (code) and the glossary carries a version; wanted, not required, so both are optional fields with a QA axis that reports coverage rather than a gate that refuses.
4. **Translatable like every asset** — labels and definitions go through the existing gettext pipeline; the term's IRI stays stable across languages.

## Standards — what fits a knowledge graph, and what does not

| standard | what it is for | fit here |
|---|---|---|
| **SKOS** (W3C) | concept schemes: `skos:Concept`, `prefLabel`/`altLabel` per language, `definition`, `scopeNote`, `notation` (the code), `broader`/`related`, `skos:Collection` | **Recommended core.** Native RDF/JSON-LD, so it drops into the existing `@context`; `notation` is exactly "coded"; multilingual labels are first-class; the thesaurus standard ISO 25964 was designed to be carried by it. |
| **schema.org `DefinedTerm` / `DefinedTermSet`** | lightweight web vocabulary for glossary entries | **Recommended as the rendered projection** of the same nodes — the docs index emits it in JSON-LD so the page is indexable; too thin to be the authoring model (no notes, no relations). |
| **Dublin Core Terms** | provenance and versioning metadata on the asset (`dcterms:hasVersion`, `modified`, `source`, `license`) | **Use on the glossary asset itself** — already in the instance's vocabulary (who-iris records are qualified Dublin Core). |
| **FHIR `CodeSystem` / `ValueSet`** | coded, versioned terminologies with per-language designations | **The export for WHO SMART Guideline folios.** A SKOS ConceptScheme maps to a CodeSystem one-to-one (concept ↔ concept, notation ↔ code, prefLabel ↔ display, altLabel ↔ designation, Collection ↔ ValueSet). Do not author in it: it carries clinical-terminology machinery a paper never uses. |
| **DCAT** | catalogues of datasets and their distributions | **Not a term model.** Right for describing the glossary as a published dataset in a catalogue (the who-iris catalogue-by-reference already speaks this shape), wrong for defining what a term is. |
| **ISO 25964** | thesaurus construction and interoperability | The rules; SKOS is its carrier. Read for the relation semantics, do not implement separately. |
| **TBX (ISO 30042)** | terminology interchange for translators | Heavy XML; only worth an exporter if a translation vendor asks for it. gettext already covers this instance's pipeline. |
| **OWL** | formal ontologies with reasoning | Overkill; definitions here are prose, not axioms. |
| **SKOS-XL** | labels as resources, so a label can carry provenance | Reach for it only if a translated label needs its own audit trail; otherwise plain SKOS. |

**Recommendation:** SKOS for the model (with `notation` for the code and `dcterms` on the scheme for version and provenance), schema.org `DefinedTerm` as the rendered JSON-LD, FHIR CodeSystem as a generated export for guideline folios, DCAT only where the glossary is listed in a catalogue. Versioning at two levels: the scheme carries `owl:versionInfo`/`dcterms:hasVersion` and a `skos:changeNote` log; a concept carries `dcterms:modified`. Translation keeps the concept IRI stable and treats `prefLabel`/`definition` per language as the translatable strings the existing `.pot` extraction already handles for BPMN labels.

## Roast questions (to answer before building)

- Extraction vs authoring: a term extracted from a BPMN lane's description is not a curated definition. Does the index show extracted candidates in a third state ("undefined, seen in N assets") distinct from authored entries?
- Where does a term's IRI live — under the instance namespace (`ns/`) or under the asset that first defined it? Moving the asset must not move the term.
- One glossary per instance or per content asset, and how does a paper's glossary reuse a core term without copying its definition?
- Coverage axis: which asset kinds MUST contribute terms for the index to be called complete, and what does "could not extract" look like?
- Does the coded/versioned field pair become a QA criterion (report) or a profile rule (refuse)? The owner's words: wanted, not required.

## Done when

- [ ] The roast above is held and its answers recorded here
- [ ] `glossary` exists as a content kind in core with optional `notation` and scheme-level version fields, validated by schema
- [ ] The docs/ rendering carries a defined-terms index built from KG assets, with extracted-vs-authored distinguished
- [ ] Labels and definitions are extracted to `.pot` like BPMN labels and render per locale
- [ ] The standards choice above is recorded as a decision (or overturned with reasons)

Related: `0lmb` (content model), `zzmr` (KG structure and publication), `bzyu` (translation pipeline), the who-iris catalogue work on PR #477, the existing `glossary-build` skill (folio-core) — check what it already does before adding a second mechanism.
