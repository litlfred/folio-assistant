---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-054-423-type-coercion
section_title: "Type Coercion"
section_number: 4.2.3
pages: 35-36
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 64: Expanded term definition with types
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "name": "http://xmlns.com/foaf/0.1/name",
    "age": {
      "@id": "http://xmlns.com/foaf/0.1/age",
      "@type": "xsd:integer"
    },
    "homepage": {
      "@id": "http://xmlns.com/foaf/0.1/homepage",
      "@type": "@id"
    }
  },
  "@id": "http://example.com/people#john",
  "name": "John Smith",
  "age": "41",
  "homepage": [
    "http://personal.example.org/",
    "http://work.example.com/jsmith/"
  ]
}
Example 65: Term expansion for values, not identifiers
The unexpected result is that "barney" expands to both http://example1.com/barney and http://example2.com/barney, depending where it is
encountered. String values interpreted as IRIs because of the associated term definitions are typically considered to be document-relative. In some
cases, it makes sense to interpret these relative to the vocabulary, prescribed using "@type": "@vocab" in the term definition, though this can lead to
unexpected consequences such as these.
In the previous example, "barney" appears twice, once as the value of @id, which is always interpreted as a document-relative IRI, and once as the
value of "fred", which is defined to be vocabulary-relative, thus the different expanded values.
For more on this see § 4.1.2 Default Vocabulary.
A variation on the previous example using "@type": "@id" instead of @vocab illustrates the behavior of interpreting "barney" relative to the
document:
