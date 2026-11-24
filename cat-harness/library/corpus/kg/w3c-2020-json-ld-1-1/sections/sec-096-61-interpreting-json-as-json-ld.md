---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-096-61-interpreting-json-as-json-ld
section_title: "Interpreting JSON as JSON-LD"
section_number: 6.1
pages: 69-69
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
In other cases, a resource may be returned using a representation that cannot easily be interpreted as JSON-LD. Normally, HTTP content negotiation
would be used to allow a client to specify a preference for JSON-LD over another representation, but in certain situations, it is not possible or
practical for a server to respond appropriately to such requests. For this, an HTTP Link Header can be used to provide an alternate location for a
