---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-032-json-ld-context-file
section_title: "JSON-LD context file"
section_number: null
pages: 20-20
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
JSON-LD contexts allow JSON documents to use simple, human-readable, locally defined terms while ensuring data interoper-
ability across different systems.
The SPDX global JSON-LD context file must be used universally for all SPDX documents in JSON-LD format that adhere to a
specific SPDX version.
SPDX global JSON-LD context file is available at: https://spdx.org/rdf/3.0.1/spdx-context.jsonld
All SPDX documents in JSON-LD format must include a reference to the SPDX global context file at the top level. This reference
is achieved using the following JSON construct:
"@context": "https://spdx.org/rdf/3.0.1/spdx-context.jsonld"
The SPDX context file defines aliases for specific JSON-LD properties to improve compatibility with the SPDX model. These
aliases are:
• spdxId: An alias for the @id property.
• type: An alias for the @type property.
Additional namespace mappings may be defined within a separate object within the context.
6.5.2
