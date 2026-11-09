---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-154-issue-335-type-coercion-node-conversion-coerce-k
section_title: "Issue 335: Type Coercion / Node Conversion: @coerce keyword or similar defer-future-version"
section_number: null
pages: 91-91
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Type Coercion / Node Conversion: @coerce keyword or similar.
This section is non-normative.
A context may contain a @version entry which is used to set the processing mode.
An expanded term definition can now have an @context property, which defines a context used for values of a property identified with such a
term.
Example 166: HTTP Request with profile requesting an expanded document
GET /ordinary-json-document.json HTTP/1.1
Host: example.com
Accept: application/ld+json;profile=http://www.w3.org/ns/json-ld#expanded
Example 167: HTTP Request with profile requesting a compacted document
GET /ordinary-json-document.json HTTP/1.1
Host: example.com
Accept: application/ld+json;profile=http://www.w3.org/ns/json-ld#compacted
Example 168: HTTP Request with profile requesting a compacted document with a reference to a compaction context
GET /ordinary-json-document.json HTTP/1.1
Host: example.com
Accept: application/ld+json;profile="http://www.w3.org/ns/json-ld#flattened http://www.w3.org/ns/json-ld#compacted"
