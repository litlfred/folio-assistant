---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-062-433-using-set-with-type
section_title: "Using @set with @type"
section_number: 4.3.3
pages: 43-43
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
Example 87: Setting @container: @set on @type
{
  "@context": {
    "@version": 1.1,
    "@type": {"@container": "@set"}
  },
  "@type": ["http:/example.org/type"]
}
