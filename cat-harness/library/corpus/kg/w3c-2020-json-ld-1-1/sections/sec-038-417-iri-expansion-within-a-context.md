---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-038-417-iri-expansion-within-a-context
section_title: "IRI Expansion within a Context"
section_number: 4.1.7
pages: 24-25
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Example 39: IRI expansion within a context
{
  "@context": {
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "name": "http://xmlns.com/foaf/0.1/name",
    "age": {
      "@id": "http://xmlns.com/foaf/0.1/age",
⚠
In this example, the xsd term is defined and used as a prefix for the @type coercion of the age property.
Terms may also be used when defining the IRI of another term:
Compact IRIs and IRIs may be used on the left-hand side of a term definition.
In this example, the compact IRI form is used in two different ways. In the first approach, foaf:age declares both the IRI for the term (using short-
form) as well as the @type associated with the term. In the second approach, only the @type associated with the term is specified. The full IRI for
foaf:homepage is determined by looking up the foaf prefix in the context.
