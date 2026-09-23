---
# folio-assistant-0ytk
title: 'CODE LISTS: closed sets of codes as SKOS nodes, each code with a definition and a source'
status: in-progress
type: feature
created_at: 2026-09-23T19:29:49Z
updated_at: 2026-09-23T19:29:49Z
parent: folio-assistant-zzmr
---

Owner, 2026-09-23, on the adjudication answers bean bvuk had written into diagrams as bare strings: "we need an expandable option, not just declared in code. list of codes and corresponding narrative desc and source should be part of a node/asset. can we use existing tools for new Skills?" Chosen: all of adjudication answers, JSON-LD namespaces (2j09), our own namespaces; published through the existing SKOS tooling; one PR.

## Done when
- [x] folio-code-list/v1 shape (schemas/code-list.ts), new graph kind `code-list` (content), declared directory cat-harness/code-lists/
- [x] six lists: five adjudication answer sets + own-namespaces (9 IRIs, 2 retired)
- [x] <folio:adjudication list="…"> — the engine refuses codes that differ from the list's active codes, an unknown list, a list with no codes
- [x] schemas/namespaces.ts (and core's DSPACE_NS) read their values from own-namespaces.json
- [x] SKOS export: glossary-export writes <stub>-code-lists.jsonld beside the glossary
- [x] gate code-lists:check; skill code-lists; tests code-list.test.ts
- [x] 2j09 JSON-LD scan, owner-approved levels, 11 new external-schema records
