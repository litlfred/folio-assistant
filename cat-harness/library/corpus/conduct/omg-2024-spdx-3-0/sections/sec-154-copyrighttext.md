---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-154-copyrighttext
section_title: "copyrightText"
section_number: null
pages: 81-82
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Identifies the text of one or more copyright notices for a software Package, File or Snippet, if any.
Description
A copyrightText consists of the text(s) of the copyright notice(s) found for a software Package, File or Snippet, if any.
If a copyrightText contains text, then it may contain any text related to one or more copyright notices (even if not complete) for
that software Package, File or Snippet.
If a copyrightText has a “NONE” value, this indicates that the software Package, File or Snippet contains no copyright notice
whatsoever.
If a copyrightText has a “NOASSERTION” value, this indicates that one of the following applies:
• the SPDX data creator has attempted to but cannot reach a reasonable objective determination;
• the SPDX data creator has made no attempt to determine this field; or
• the SPDX data creator has intentionally provided no information (no meaning should be implied by doing so).
If a copyrightText is present, but consists of solely an empty string or a string with no substantive content (e.g., a string that contains
only whitespace), then this should be interpreted as equivalent to a “NOASSERTION” value as described above.
System Package Data Exchange (SPDX©) v3.0
69
Metadata
https://spdx.org/rdf/3.0.1/terms/Software/copyrightText
Name:
copyrightText
Nature:
DataProperty
Range:
xsd:string
Referenced
• /Software/SoftwareArtifact
9.2.8
