---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-059-43-value-ordering
section_title: "Value Ordering"
section_number: 4.3
pages: 40-41
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 78: Multiple values with no inherent order
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {"foaf": "http://xmlns.com/foaf/0.1/"},
  ...
  "@id": "http://example.org/people#joebob",
  "foaf:nick": [ "joe", "bob", "JB" ],
  ...
}
Input
Example 79: Using an expanded form to set multiple values
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {"dcterms": "http://purl.org/dc/terms/"},
  "@id": "http://example.org/articles/8",
  "dcterms:title": [
    {
      "@value": "Das Kapital",
      "@language": "de"
    },
    {
      "@value": "Capital",
      "@language": "en"
    }
  ]
}
Example 80: Multiple array values of different types
Note
When viewed as statements, the values have no inherent order.
This section is non-normative.
As the notion of ordered collections is rather important in data modeling, it is useful to have specific language support. In JSON-LD, a list may be
represented using the @list keyword as follows:
This describes the use of this array as being ordered, and order is maintained when processing a document. If every use of a given multi-valued
property is a list, this may be abbreviated by setting @container to @list in the context:
The implementation of lists in RDF depends on linking anonymous nodes together using the properties rdf:first and rdf:rest, with the end of the
list defined as the resource rdf:nil, as the "statements" tab illustrates. This allows order to be represented within an unordered set of statements.
