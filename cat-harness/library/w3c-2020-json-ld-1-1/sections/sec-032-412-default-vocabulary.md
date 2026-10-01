---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-032-412-default-vocabulary
section_title: "Default Vocabulary"
section_number: 4.1.2
pages: 20-21
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 24: Using a default vocabulary
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@vocab": "http://example.com/vocab/"
  },
  "@id": "http://example.org/places#BrewEats",
  "@type": "Restaurant",
  "name": "Brew Eats"
  ...
}
Input
Example 25: Using the null keyword to ignore data
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
     "@vocab": "http://example.com/vocab/",
     "databaseId": null
  },
  "@id": "http://example.org/places#BrewEats",
  "@type": "Restaurant",
  "name": "Brew Eats",
  "databaseId": "23987520"
}
Example 26: Using a default vocabulary relative to a previous default vocabulary
Note
The grammar for @vocab, as defined in § 9.15 Context Definitions allows the value to be a term or compact IRI. Note that terms used in the value of
@vocab must be in scope at the time the context is introduced, otherwise there would be a circular dependency between @vocab and other terms
defined in the same context.
This section is non-normative.
JSON-LD allows IRIs to be specified in a relative form which is resolved against the document base according section 5.1 Establishing a Base URI of
