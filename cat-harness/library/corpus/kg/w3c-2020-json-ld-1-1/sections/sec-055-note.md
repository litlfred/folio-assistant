---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-055-note
section_title: "Note"
section_number: null
pages: 36-37
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
The triple ex1:fred ex2:knows ex1:barney . is emitted twice, but exists only once in an output dataset, as it is a duplicate triple.
Terms may also be defined using IRIs or compact IRIs. This allows coercion rules to be applied to keys which are not represented as a simple term.
For example:
Input
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@base": "http://example1.com/",
    "@vocab": "http://example2.com/",
    "knows": {"@type": "@vocab"}
  },
  "@id": "fred",
  "knows": [
    {"@id": "barney", "mnemonic": "the sidekick"},
    "barney"
  ]
}
Input
Example 66: Terms not expanded when document-relative
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@base": "http://example1.com/",
    "@vocab": "http://example2.com/",
    "knows": {"@type": "@id"}
  },
  "@id": "fred",
  "knows": [
    {"@id": "barney", "mnemonic": "the sidekick"},
    "barney"
  ]
}
Input
Example 67: Term definitions using IRIs and compact IRIs
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "foaf": "http://xmlns.com/foaf/0.1/",
    "foaf:age": {
      "@id": "http://xmlns.com/foaf/0.1/age",
      "@type": "xsd:integer"
    },
    "http://xmlns.com/foaf/0.1/homepage": {
      "@type": "@id"
    }
  },
  "foaf:name": "John Smith",
  "foaf:age": "41",
  "http://xmlns.com/foaf/0.1/homepage": [
    "http://personal.example.org/",
    "http://work.example.com/jsmith/"
  ]
}
In this case the @id definition in the term definition is optional. If it does exist, the IRI or compact IRI representing the term will always be expanded
to IRI defined by the @id key—regardless of whether a prefix is defined or not.
Type coercion is always performed using the unexpanded value of the key. In the example above, that means that type coercion is done looking for
foaf:age in the active context and not for the corresponding, expanded IRI http://xmlns.com/foaf/0.1/age.
