---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-063-44-nested-properties
section_title: "Nested Properties"
section_number: 4.4
pages: 43-44
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 88: Nested properties
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@version": 1.1,
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "labels": "@nest",
    "main_label": {"@id": "skos:prefLabel"},
    "other_label": {"@id": "skos:altLabel"},
    "homepage": {"@id": "http://xmlns.com/foaf/0.1/homepage", "@type": "@id"}
  },
  "@id": "http://example.org/myresource",
  "homepage": "http://example.org",
  "labels": {
     "main_label": "This is the main label for my resource",
     "other_label": "This is the other label"
  }
}
Example 89: Nested properties folded into containing object
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
Similarly, term definitions may contain a @nest property referencing a term aliased to @nest which will cause such properties to be nested under that
aliased term when compacting. In the example below, both main_label and other_label are defined with "@nest": "labels", which will cause
them to be serialized under labels when compacting.
