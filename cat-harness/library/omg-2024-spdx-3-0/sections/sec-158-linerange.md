---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-158-linerange
section_title: "lineRange"
section_number: null
pages: 83-83
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Defines the line range in the original host file that the snippet information applies to.
Description
This field defines the line range in the original host file that the snippet information applies to.
If there is a disagreement between the byte range and line range, the byte range values will take precedence.
A range of lines is a convenient reference for those files where there is a known line delimiter. The choice was made to start the
numbering of the lines at 1 to be consistent with the W3C pointer method vocabulary.
Metadata
https://spdx.org/rdf/3.0.1/terms/Software/lineRange
Name:
lineRange
Nature:
DataProperty
Range:
/Core/PositiveIntegerRange
Referenced
• /Software/Snippet
9.2.12
