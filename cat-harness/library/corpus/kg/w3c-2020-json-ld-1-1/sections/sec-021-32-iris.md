---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-021-32-iris
section_title: "IRIs"
section_number: 3.2
pages: 12-12
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Contexts can either be directly embedded into the document (an embedded context) or be referenced using a URL. Assuming the context document in
the previous example can be retrieved at https://json-ld.org/contexts/person.jsonld, it can be referenced by adding a single line and allows a
JSON-LD document to be expressed much more concisely as shown in the example below:
  "http://schema.org/image": {
    "@id": "http://manu.sporny.org/images/manu.png"
  }
}
