---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-040-418-scoped-contexts
section_title: "Scoped Contexts"
section_number: 4.1.8
pages: 26-27
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 45: Defining an @context within a term definition
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@version": 1.1,
    "name": "http://schema.org/name",
    "interest": {
      "@id": "http://xmlns.com/foaf/0.1/interest",
      "@context": {"@vocab": "http://xmlns.com/foaf/0.1/"}
    }
  },
  "name": "Manu Sporny",
  "interest": {
    "@id": "https://www.w3.org/TR/json-ld11/",
    "name": "JSON-LD",
In this case, the social profile is defined using the schema.org vocabulary, but interest is imported from FOAF, and is used to define a node describing
one of Manu's interests where those properties now come from the FOAF vocabulary.
Expanding this document, uses a combination of terms defined in the outer context, and those defined specifically for that term in a property-scoped
context.
Scoping can also be performed using a term used as a value of @type:
Scoping on @type is useful when common properties are used to relate things of different types, where the vocabularies in use within different entities
calls for different context scoping. For example, hasPart/partOf may be common terms used in a document, but mean different things depending on
the context. A type-scoped context is only in effect for the node object on which the type is used; the previous in-scope contexts are placed back into
effect when traversing into another node object. As described further in § 4.1.9 Context Propagation, this may be controlled using the @propagate
keyword.
