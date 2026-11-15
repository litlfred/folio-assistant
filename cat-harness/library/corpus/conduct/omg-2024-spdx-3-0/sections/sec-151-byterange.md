---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-151-byterange
section_title: "byteRange"
section_number: null
pages: 80-81
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Defines the byte range in the original host file that the snippet information applies to.
Description
This field defines the byte range in the original host file that the snippet information applies to.
A range of bytes is independent of various formatting concerns, and the most accurate way of referring to the differences. The
choice was made to start the numbering of the byte range at 1 to be consistent with the W3C pointer method vocabulary.
Metadata
https://spdx.org/rdf/3.0.1/terms/Software/byteRange
Name:
byteRange
Nature:
DataProperty
Range:
/Core/PositiveIntegerRange
Referenced
• /Software/Snippet
9.2.4
contentIdentifier
Summary
A canonical, unique, immutable identifier of the artifact content, that may be used for verifying its identity and/or integrity.
Description
A contentIdentifier is a canonical, unique, immutable identifier of the content of a software artifact, such as a package, a file, or a
snippet.
It may be used for verifying its identity and/or integrity.
Metadata
https://spdx.org/rdf/3.0.1/terms/Software/contentIdentifier
Name:
contentIdentifier
Nature:
DataProperty
Range:
ContentIdentifier
Referenced
• /Software/SoftwareArtifact
68
System Package Data Exchange (SPDX©) v3.0
9.2.5
