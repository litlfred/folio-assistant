---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-022-31-the-context
section_title: "The Context"
section_number: 3.1
pages: 12-13
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Context
Example 4: Context for the sample document in the previous section
{
  "@context": {
    "name": "http://schema.org/name",
    ↑ This means that 'name' is shorthand for 'http://schema.org/name'
    "image": {
      "@id": "http://schema.org/image",
      ↑ This means that 'image' is shorthand for 'http://schema.org/image'
      "@type": "@id"
      ↑ This means that a string value associated with 'image'
        should be interpreted as an identifier that is an IRI
    },
    "homepage": {
      "@id": "http://schema.org/url",
      ↑ This means that 'homepage' is shorthand for 'http://schema.org/url'
      "@type": "@id"
      ↑ This means that a string value associated with 'homepage'
        should be interpreted as an identifier that is an IRI 
    }
  }
}
Input
Example 5: Referencing a JSON-LD context
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": "https://json-ld.org/contexts/person.jsonld",
  "name": "Manu Sporny",
  "homepage": "http://manu.sporny.org/",
  "image": "http://manu.sporny.org/images/manu.png"
}
The referenced context not only specifies how the terms map to IRIs in the Schema.org vocabulary but also specifies that string values associated
with the homepage and image property can be interpreted as an IRI ("@type": "@id", see § 3.2 IRIs for more details). This information allows
developers to re-use each other's data without having to agree to how their data will interoperate on a site-by-site basis. External JSON-LD context
documents may contain extra information located outside of the @context key, such as documentation about the terms declared in the document.
Information contained outside of the @context value is ignored when the document is used as an external JSON-LD context document.
A remote context may also be referenced using a relative URL, which is resolved relative to the location of the document containing the reference.
For example, if a document were located at http://example.org/document.jsonld and contained a relative reference to context.jsonld, the
referenced context document would be found relative at http://example.org/context.jsonld.
