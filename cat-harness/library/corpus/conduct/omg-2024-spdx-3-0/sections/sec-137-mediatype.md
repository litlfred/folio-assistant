---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-137-mediatype
section_title: "MediaType"
section_number: null
pages: 70-71
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Standardized way of indicating the type of content of an Element or a Property. A String constrained to the RFC 2046 specification.
Description
A MediaType is a string constrained to the RFC 2046 MIME Part Two: Media Types53. It provides a standardized way of indicating
the type of content of an Element or a Property.
Example
• application/java-archive
53https://datatracker.ietf.org/doc/rfc2046/
58
System Package Data Exchange (SPDX©) v3.0
• application/vcard+json
• application/vnd.oasis.opendocument.text
• image/avif
• text/csv;charset=UTF-8
• text/javascript
• text/spdx
A list of all possible media types is available at IANA Protocol Registries54.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/MediaType
Name:
MediaType
SubclassOf:
xsd:string
Format pattern
^[^\/]+\/[^\/]+$
8.5.3
