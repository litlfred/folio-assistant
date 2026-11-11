---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-051-warning
section_title: "Warning"
section_number: null
pages: 34-34
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
JSON-LD is intended to allow native JSON to be interpreted through the use of a context. The use of JSON literals creates blobs of data which are
not available for interpretation. It is for use only in the rare cases that JSON cannot be represented as JSON-LD.
When a term is defined with @type set to @json, a JSON-LD processor will treat the value as a JSON literal, rather than interpreting it further as
JSON-LD. In the expanded document form, such JSON will become the value of @value within a value object having "@type": "@json".
When transformed into RDF, the JSON literal will have a lexical form based on a specific serialization of the JSON, as described in Compaction
algorithm of [JSON-LD11-API] and the JSON datatype.
The following example shows an example of a JSON Literal contained as the value of a property. Note that the RDF results use a canonicalized form
of the JSON to ensure interoperability between different processors. JSON canonicalization is described in Data Round Tripping in [JSON-LD11-
API].
Example 61: Example demonstrating the context-sensitivity for @type
{
  ...
  "@id": "http://example.org/posts#TripToWestVirginia",
  "@type": "http://schema.org/BlogPosting",  ← This is a node type
  "http://purl.org/dc/terms/modified": {
    "@value": "2010-05-29T14:17:39+02:00",
    "@type": "http://www.w3.org/2001/XMLSchema#dateTime"  ← This is a value type
  }
  ...
}
Example 62: Example demonstrating the context-sensitivity for @type (statements)
Compacted (Input) 
Turtle Open in playground
Subject
Property
Value
Value Type
http://example.org/posts#TripToWestVirginia rdf:type
schema:BlogPosting
http://example.org/posts#TripToWestVirginia dcterms:modified 2010-05-29T14:17:39+02:00 xsd:dateTime
