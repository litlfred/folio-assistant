---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-033-413-base-iri
section_title: "Base IRI"
section_number: 4.1.3
pages: 21-21
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
For example, if a JSON-LD document was retrieved from http://example.com/document.jsonld, relative IRI references would resolve against
that IRI:
This document uses an empty @id, which resolves to the document base. However, if the document is moved to a different location, the IRI would
change. To prevent this without having to use an IRI, a context may define an @base mapping, to overwrite the base IRI for the document.
Setting @base to null will prevent relative IRI references from being expanded to IRIs.
Please note that the @base will be ignored if used in external contexts.
This section is non-normative.
In some cases, vocabulary terms are defined directly within the document itself, rather than in an external vocabulary. Since JSON-LD 1.1, the
vocabulary mapping in a local context can be set to a relative IRI reference, which is, if there is no vocabulary mapping in scope, resolved against the
base IRI. This causes terms which are expanded relative to the vocabulary, such as the keys of node objects, to be based on the base IRI to create IRIs.
Input
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": [{
    "@vocab": "http://example.com/"
  }, {
    "@version": 1.1,
    "@vocab": "vocab/"
  }],
  "@id": "http://example.org/places#BrewEats",
  "@type": "Restaurant",
  "name": "Brew Eats"
  ...
}
4.1.3 Base IRI §
Example 27: Use a relative IRI reference as node identifier
{
  "@context": {
    "label": "http://www.w3.org/2000/01/rdf-schema#label"
  },
  "@id": "",
  "label": "Just a simple document"
}
Input
Example 28: Setting the document base in a document
Compacted (Input) 
Expanded (Result) 
Statements 
Turtle Open in playground
{
  "@context": {
    "@base": "http://example.com/document.jsonld",
    "label": "http://www.w3.org/2000/01/rdf-schema#label"
  },
  "@id": "",
  "label": "Just a simple document"
}
