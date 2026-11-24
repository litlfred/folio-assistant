---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-109-summary
section_title: "summary"
section_number: null
pages: 56-56
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Provides a reference number that can be used to understand how to parse and interpret an Element.
Description
The specVersion provides a reference number that can be used to understand how to parse and interpret an Element. It will enable
both future changes to the specification and to support backward compatibility.
The major version number shall be incremented when incompatible changes between versions are made (one or more sections are
created, modified or deleted). The minor version number shall be incremented when backwards compatible changes are made.
The patch version number shall be incremented when backward compatible bug fixes are made.
Here, parties exchanging information in accordance with the SPDX specification need to provide 100% transparency as to which
SPDX specification version such information is conforming to.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/specVersion
Name:
specVersion
Nature:
DataProperty
Range:
SemVer
Referenced
• /Core/CreationInfo
8.2.47
