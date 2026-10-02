---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-070-note
section_title: "Note"
section_number: null
pages: 48-48
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
When using property-based data indexing, index maps can only be used on node objects, not value objects or graph objects. Value objects are
restricted to have only certain keys and do not support arbitrary properties.
This section is non-normative.
JSON which includes string values in multiple languages may be represented using a language map to allow for easily indexing property values by
language tag. This enables direct access to language values instead of having to scan an array in search of a specific item. In JSON-LD such data can
be specified by associating the @language keyword with a @container declaration in the context:
4.6.1.1 Property-based data indexing §
Input
Example 99: Property-based data indexing
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@version": 1.1,
    "schema": "http://schema.org/",
    "name": "schema:name",
    "body": "schema:articleBody",
    "athletes": {
      "@id": "schema:athlete",
      "@container": "@index",
      "@index": "schema:jobTitle"
    }
  },
  "@id": "http://example.com/",
  "@type": "schema:SportsTeam",
  "name": "San Francisco Giants",
  "athletes": {
    "Catcher": {
      ↑ "Catcher" will add `"schema:jobTitle": "Catcher"` when expanded
      "@type": "schema:Person",
      "name": "Buster Posey"
    },
    "Starting Pitcher": {
      "@type": "schema:Person",
      "name": "Madison Bumgarner"
    },
    ....
  }
}
