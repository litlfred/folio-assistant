---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-095-54-framed-document-form
section_title: "Framed Document Form"
section_number: 5.4
pages: 68-69
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Frame
Example 139: Sample library frame
{
  "@context": {
    "@version": 1.1,
    "@vocab": "http://example.org/"
  },
  "@type": "Library",
  "contains": {
    "@type": "Book",
    "contains": {
      "@type": "Chapter"
    }
  }
}
Input
Example 140: Flattened library objects
{
  "@context": {
    "@vocab": "http://example.org/",
    "contains": {"@type": "@id"}
  },
  "@graph": [{
    "@id": "http://example.org/library",
    "@type": "Library",
    "contains": "http://example.org/library/the-republic"
  }, {
    "@id": "http://example.org/library/the-republic",
    "@type": "Book",
The Frame Algorithm can create a new document which follows the structure of the frame:
JSON-LD's media type defines a profile parameter which can be used to signal or request framed document form. The profile URI identifying
framed document form is http://www.w3.org/ns/json-ld#framed.
JSON-LD's media type also defines a profile parameter which can be used to identify a script element in an HTML document containing a frame.
The first script element of type application/ld+json;profile=http://www.w3.org/ns/json-ld#frame will be used to find a frame..
Certain aspects of JSON-LD processing can be modified using HTTP Link Headers [RFC8288]. These can be used when retrieving resources that
are not, themselves, JSON-LD, but can be interpreted as JSON-LD by using information in a Link Relation.
When processing normal JSON documents, a link relation can be specified using the HTTP Link Header returned when fetching a remote document,
