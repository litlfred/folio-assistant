---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-035-415-compact-iris
section_title: "Compact IRIs"
section_number: 4.1.5
pages: 22-23
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
    "@version": 1.1,
    "@base": "http://example/document",
    "@vocab": "#"
  },
  "@id": "http://example.org/places#BrewEats",
  "@type": "Restaurant",
  "name": "Brew Eats"
  ...
}
Result
Example 30: Using "#" as the vocabulary mapping (expanded)
Expanded (Result) 
Statements 
Turtle Open in playground
[{
  "@id": "http://example.org/places#BrewEats",
  "@type": ["http://example/document#Restaurant"],
  "http://example/document#name": [{"@value": "Brew Eats"}]
}]
4.1.5 Compact IRIs §
Input
Example 31: Prefix expansion
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "foaf": "http://xmlns.com/foaf/0.1/"
    ...
  },
  "@type": "foaf:Person",
  "foaf:name": "Dave Longley",
  ...
}
Input
Example 32: Using vocabularies
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@version": 1.1,
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "foaf": "http://xmlns.com/foaf/0.1/",
    "foaf:homepage": { "@type": "@id" },
    "picture": { "@id": "foaf:depiction", "@type": "@id" }
  },
  "@id": "http://me.markus-lanthaler.com/",
  "@type": "foaf:Person",
  "foaf:name": "Markus Lanthaler",
  "foaf:homepage": "http://www.markus-lanthaler.com/",
When operating explicitly with the processing mode for JSON-LD 1.0 compatibility, terms may be chosen as compact IRI prefixes when compacting
only if a simple term definition is used where the value ends with a URI gen-delim character (e.g, /, # and others, see [RFC3986]).
In JSON-LD 1.1, terms may be chosen as compact IRI prefixes when expanding or compacting only if a simple term definition is used where the
value ends with a URI gen-delim character, or if their expanded term definition contains a @prefix entry with the value true. If a simple term
definition does not end with a URI gen-delim character, or a expanded term definition contains a @prefix entry with the value false, the term will
not be used for either expanding compact IRIs or compacting IRIs to compact IRIs.
