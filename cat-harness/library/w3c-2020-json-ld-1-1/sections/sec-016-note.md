---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-016-note
section_title: "Note"
section_number: null
pages: 9-9
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Although not discussed in this specification, parallel work using YAML Ain’t Markup Language (YAML™) Version 1.2 [YAML] and binary
representations such as Concise Binary Object Representation (CBOR) [RFC7049] could be used to map into the internal representation, allowing the
JSON-LD 1.1 API [JSON-LD11-API] to operate as if the source was a JSON document.
This section is non-normative.
JSON-LD specifies a number of syntax tokens and keywords that are a core part of the language. A normative description of the keywords is given in
§ 9.16 Keywords.
:
The separator for JSON keys and values that use compact IRIs.
@base
Used to set the base IRI against which to resolve those relative IRI references which are otherwise interpreted relative to the document. This keyword
is described in § 4.1.3 Base IRI.
@container
Used to set the default container type for a term. This keyword is described in the following sections:
§ 4.3 Value Ordering,
§ 4.6.1 Data Indexing,
§ 4.6.2 Language Indexing,
§ 4.6.3 Node Identifier Indexing,
§ 4.6.4 Node Type Indexing
§ 4.9 Named Graphs,
§ 4.9.3 Named Graph Indexing, and
§ 4.9.2 Named Graph Data Indexing
@context
