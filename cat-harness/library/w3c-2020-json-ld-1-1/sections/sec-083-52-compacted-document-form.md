---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-083-52-compacted-document-form
section_title: "Compacted Document Form"
section_number: 5.2
pages: 59-59
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Compaction is the process of applying a provided context to an existing JSON-LD document. This process is described further in § 5.2 Compacted
Document Form.
Flattened Document Form
Flattening is the process of extracting embedded nodes to the top level of the JSON tree, and replacing the embedded node with a reference, creating
blank node identifiers as necessary. This process is described further in § 5.3 Flattened Document Form.
Framed Document Form
Framing is used to shape the data in a JSON-LD document, using an example frame document which is used to both match the flattened data and
show an example of how the resulting data should be shaped. This process is described further in § 5.4 Framed Document Form.
This section is non-normative.
The JSON-LD 1.1 Processing Algorithms and API specification [JSON-LD11-API] defines a method for expanding a JSON-LD document.
Expansion is the process of taking a JSON-LD document and applying a context such that all IRIs, types, and values are expanded so that the
@context is no longer necessary.
For example, assume the following JSON-LD input document:
      "@type": "Person",
      "name": "Gregg Kellogg",
      "knows": "http://manu.sporny.org/about#manu"
    }]
  }
}
