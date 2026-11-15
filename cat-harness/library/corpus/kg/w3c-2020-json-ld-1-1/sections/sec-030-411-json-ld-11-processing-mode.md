---
doc_id: w3c-2020-json-ld-1-1
doc_title: "JSON-LD 1.1 This version: Latest published version: Latest editor's draft: Test suite: Implementation report: Previous version: Previous Recommendation: Editors:"
section_id: sec-030-411-json-ld-11-processing-mode
section_title: "JSON-LD 1.1 Processing Mode"
section_number: 4.1.1
pages: 19-20
source_pdf: w3c-2020-json-ld-1-1.pdf
source_sha256: 251b1757427a3352
toc_source: outline
---
New features defined in JSON-LD 1.1 are available unless the processing mode is set to json-ld-1.0. This may be set through an API option. The
processing mode may be explicitly set to json-ld-1.1 using the @version entry in a context set to the value 1.1 as a number, or through an API
option. Explicitly setting the processing mode to json-ld-1.1 will prohibit JSON-LD 1.0 processors from incorrectly processing a JSON-LD 1.1
document.
The first context encountered when processing a document which contains @version determines the processing mode, unless it is defined
explicitly through an API option. This means that if "@version": 1.1 is encountered after processing a context without @version, the former will be
interpreted as having had "@version": 1.1 defined within it.
