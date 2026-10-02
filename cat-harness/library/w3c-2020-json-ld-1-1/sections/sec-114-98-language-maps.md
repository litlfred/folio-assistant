---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-114-98-language-maps
section_title: "Language Maps"
section_number: 9.8
pages: 77-77
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
An index map allows keys that have no semantic meaning, but should be preserved regardless, to be used in JSON-LD documents. An index map
may be used as a term value within a node object if the term is defined with @container set to @index, or an array containing both @index and @set .
The values of the entries of an index map MUST be one of the following types:
string,
