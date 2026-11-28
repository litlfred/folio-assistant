---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-094-53-flattened-document-form
section_title: "Flattened Document Form"
section_number: 5.3
pages: 67-68
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Input
Example 137: Sample JSON-LD document to be flattened
{
  "@context": {
    "name": "http://xmlns.com/foaf/0.1/name",
    "knows": "http://xmlns.com/foaf/0.1/knows"
  },
  "@id": "http://me.markus-lanthaler.com/",
  "name": "Markus Lanthaler",
  "knows": [
    {
      "@id": "http://manu.sporny.org/about#manu",
      "name": "Manu Sporny"
    }, {
      "name": "Dave Longley"
    }
  ]
}
JSON-LD's media type defines a profile parameter which can be used to signal or request flattened document form. The profile URI identifying
flattened document form is http://www.w3.org/ns/json-ld#flattened. It can be combined with the profile URI identifying expanded document
form or compacted document form.
This section is non-normative.
The JSON-LD 1.1 Framing specification [JSON-LD11-FRAMING] defines a method for framing a JSON-LD document. Framing is used to shape
the data in a JSON-LD document, using an example frame document which is used to both match the flattened data and show an example of how the
resulting data should be shaped.
For example, assume the following JSON-LD frame:
This frame document describes an embedding structure that would place objects with type Library at the top, with objects of type Book that were
linked to the library object using the contains property embedded as property values. It also places objects of type Chapter within the referencing
Book object as embedded values of the Book object.
When using a flattened set of objects that match the frame components:
Example 138: Flattened and compacted form for the previous example
Open in playground
{
  "@context": {
    "name": "http://xmlns.com/foaf/0.1/name",
    "knows": "http://xmlns.com/foaf/0.1/knows"
  },
  "@graph": [{
    "@id": "http://me.markus-lanthaler.com/",
    "name": "Markus Lanthaler",
    "knows": [
      { "@id": "http://manu.sporny.org/about#manu" },
      { "@id": "_:b0" }
    ]
  }, {
    "@id": "http://manu.sporny.org/about#manu",
    "name": "Manu Sporny"
  }, {
    "@id": "_:b0",
    "name": "Dave Longley"
  }]
}
