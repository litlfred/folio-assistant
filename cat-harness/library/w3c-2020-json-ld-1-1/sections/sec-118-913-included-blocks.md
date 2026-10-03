---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-118-913-included-blocks
section_title: "Included Blocks"
section_number: 9.13
pages: 78-78
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
A nested property is used to gather properties of a node object in a separate map, or array of maps which are not value objects. It is semantically
transparent and is removed during the process of expansion. Property nesting is recursive, and collections of nested properties may contain further
nesting.
Semantically, nesting is treated as if the properties and values were declared directly within the containing node object.
A context definition defines a local context in a node object.
