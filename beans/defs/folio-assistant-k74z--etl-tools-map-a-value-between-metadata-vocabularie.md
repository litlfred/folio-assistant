---
# folio-assistant-k74z
title: 'ETL TOOLS: map a value between metadata vocabularies by source and target content type'
status: in-progress
type: task
priority: normal
created_at: 2026-09-23T21:33:31Z
updated_at: 2026-10-02T15:29:14Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-23, choosing to keep a glossary scheme's name in both skos:prefLabel and dcterms:title from one source (bean sl9u): 'this is going to be common pattern... need Tools for this type of ETL procedure depending on source / target content type and other metadata'.

## The pattern
One value, several target vocabularies. Today every such mapping is a hand-written line in a generator (glossary-export's prefLabel -> title is one). The mapping depends on the SOURCE content type (a lane, a bean, a library item, a requirement) and the TARGET (SKOS, Dublin Core, schema.org, a JSON Schema, a navbar tile), and on other metadata (language, licence, which fields a consumer reads).

## Check first
- smart-base crosswalks (bean cpmo) are a DOMAIN instance of the same shape; reuse its lessons, do not import its vocabulary into the harness.
- The Tool-node conventions (tools/index.ts, d308) — an ETL mapping is a Tool, declared as a KG node.
- The requirements schema just added (bootstrap/schemas/requirement.ts, #1164): a mapping would be one way a harness maps an outside standard onto it, ABOVE bootstrap.

## Done when
- [ ] the hand-written mappings in generators are inventoried (source type, target vocabulary, field)
- [ ] a declarative mapping shape is proposed in docs/proposals/, with options, and put to the owner
- [ ] one generator (glossary-export) moved onto it as the worked example, with its test still green

_2026-10-02T14:12Z_ — Claimed by claude/k74z-vocab-mapping (session https://claude.ai/code/session_01CVVoavPoCHMLA7AASxG8cH).

_2026-10-02T15:15Z_ — Owner ruling, 2026-10-02, verbatim: "1 ... needs to support FHIR Concept Maps downstream". Further, same day, verbatim: "more so, that existing FHIR Concept Maps are representable, (dont need injection of mapping standard -> fhir stds)". Option 1 chosen; the ConceptMap reading is being confirmed with the owner (work held).

_2026-10-02T15:29Z_ — Owner clarification, 2026-10-02, verbatim: "we still want to able to produce FHIR ConceptMaps, just we dont need to assume injective map onto FHIR conceptmaps... may be lossy. but should be injective on the inverse image of FHIR ConceptMaps into mapping stadard." Formally, with C = FHIR ConceptMaps and M = folio-vocab-mapping/v1 tables: iota: C -> M represents every ConceptMap; pi: M -> C may be lossy but reports every loss; pi∘iota = id_C. Built in schemas/vocab-mapping.ts and schemas/vocab-mapping-fhir.ts; holds on all 174 HL7 ConceptMap examples (R4 80, R5 94). glossary-export moved onto 5 tables in vocab-mappings/, output byte-identical for cat-harness and bootstrap.
