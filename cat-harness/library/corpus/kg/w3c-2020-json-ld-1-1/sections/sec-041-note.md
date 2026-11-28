---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-041-note
section_title: "Note"
section_number: null
pages: 27-28
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Any property-scoped or local contexts that were introduced in the node object would still be in effect when traversing into another node object.
When expanding, each value of @type is considered (ordering them lexicographically) where that value is also a term in the active context having its
own type-scoped context. If so, that the scoped context is applied to the active context.
Note
The values of @type are unordered, so if multiple types are listed, the order that type-scoped contexts are applied is based on lexicographical
ordering.
For example, consider the following semantically equivalent examples. The first example, shows how properties and types can define their own
scoped contexts, which are included when expanding.
    "topic": "Linking Data"
  }
}
Input
Example 46: Defining an @context within a term definition used on @type
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@version": 1.1,
    "name": "http://schema.org/name",
    "interest": "http://xmlns.com/foaf/0.1/interest",
    "Person": "http://schema.org/Person",
    "Document": {
      "@id": "http://xmlns.com/foaf/0.1/Document",
      "@context": {"@vocab": "http://xmlns.com/foaf/0.1/"}
    }
  },
  "@type": "Person",
  "name": "Manu Sporny",
  "interest": {
    "@id": "https://www.w3.org/TR/json-ld11/",
    "@type": "Document",
    "name": "JSON-LD",
    "topic": "Linking Data"
  }
}
Example 47: Expansion using embedded and scoped contexts
{
  "@context": {
    "@version": 1.1,
    "@vocab": "http://example.com/vocab/",
    "property": {
      "@id": "http://example.com/vocab/property",
      "@context": {
        "term1": "http://example.com/vocab/term1"
         ↑ Scoped context for "property" defines term1
      }
    },
    "Type1": {
      "@id": "http://example.com/vocab/Type1",
      "@context": {
        "term3": "http://example.com/vocab/term3"
         ↑ Scoped context for "Type1" defines term3
      }
Contexts are processed depending on how they are defined. A property-scoped context is processed first, followed by any embedded context,
followed lastly by the type-scoped contexts, in the appropriate order. The previous example is logically equivalent to the following:
