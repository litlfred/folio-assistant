---
# folio-assistant-k74z
title: 'ETL TOOLS: map a value between metadata vocabularies by source and target content type'
status: todo
type: task
created_at: 2026-09-23T21:33:31Z
updated_at: 2026-09-23T21:33:31Z
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
