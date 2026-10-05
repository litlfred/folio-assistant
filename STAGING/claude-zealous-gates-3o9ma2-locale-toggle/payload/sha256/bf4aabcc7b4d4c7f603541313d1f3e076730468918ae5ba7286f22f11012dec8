---
# folio-assistant-k74z
title: 'ETL TOOLS: map a value between metadata vocabularies by source and target content type'
status: completed
type: task
priority: normal
created_at: 2026-09-23T21:33:31Z
updated_at: 2026-10-02T17:49:13Z
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
- [x] the hand-written mappings in generators are inventoried (source type, target vocabulary, field)
- [x] a declarative mapping shape is proposed in docs/proposals/, with options, and put to the owner
- [x] one generator (glossary-export) moved onto it as the worked example, with its test still green

_2026-10-02T14:12Z_ — Claimed by claude/k74z-vocab-mapping (session https://claude.ai/code/session_01CVVoavPoCHMLA7AASxG8cH).

_2026-10-02T15:15Z_ — Owner ruling, 2026-10-02, verbatim: "1 ... needs to support FHIR Concept Maps downstream". Further, same day, verbatim: "more so, that existing FHIR Concept Maps are representable, (dont need injection of mapping standard -> fhir stds)". Option 1 chosen; the ConceptMap reading is being confirmed with the owner (work held).

_2026-10-02T15:29Z_ — Owner clarification, 2026-10-02, verbatim: "we still want to able to produce FHIR ConceptMaps, just we dont need to assume injective map onto FHIR conceptmaps... may be lossy. but should be injective on the inverse image of FHIR ConceptMaps into mapping stadard." Formally, with C = FHIR ConceptMaps and M = folio-vocab-mapping/v1 tables: iota: C -> M represents every ConceptMap; pi: M -> C may be lossy but reports every loss; pi∘iota = id_C. Built in schemas/vocab-mapping.ts and schemas/vocab-mapping-fhir.ts; holds on all 174 HL7 ConceptMap examples (R4 80, R5 94). glossary-export moved onto 5 tables in vocab-mappings/, output byte-identical for cat-harness and bootstrap.

## Summary of Changes

PR #1873 (issue #1872). All three Done-when items met.

- **Inventory:** 59 hand-written mappings in 17 files, each with file:line, in cat-harness/docs/proposals/vocabulary-mappings-2026-10-02.md, plus five cross-generator findings (D1-D5). D2-D5 are reported, not fixed.
- **Shape:** owner ruled option 1 on 2026-10-02 (three statements, verbatim in the proposal and above). Built as cat-harness/schemas/vocab-mapping.ts (folio-vocab-mapping/v1, ConceptMap-shaped) and cat-harness/schemas/vocab-mapping-fhir.ts (iota fromConceptMap, pi toConceptMap). pi∘iota = id_C on all 174 published HL7 ConceptMap examples (R4 80, R5 94); pi reports every loss.
- **Supporting pieces:** the vocab-mapping graph kind and cat-harness/vocab-mappings/, the vocab-map Tool node, and the vocab-mappings:check gate.
- **Worked example:** glossary-export writes through 5 tables. Its _kg output for cat-harness and bootstrap is byte-identical to main's generator. glossary-export.test.ts is green, with a new test that the tables agree with the @context. 5 of 28 rows need code (falsifier threshold: a third).

Follow-ons, not done here: D3 (one role IRI, two naming predicates across kg-export/glossary-export), D4 (library licence hidden in an @json literal), migrating the other generators, and applier support for dependsOn conditions.
