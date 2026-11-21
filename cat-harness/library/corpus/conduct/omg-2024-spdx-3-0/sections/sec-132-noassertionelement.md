---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-132-noassertionelement
section_title: "NoAssertionElement"
section_number: null
pages: 69-69
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
An Individual Value for Element representing a set of Elements of unknown identify or cardinality (number).
Description
NoAssertionElement should be used if
• the SPDX creator has attempted to but cannot reach a reasonable objective determination;
• the SPDX creator has made no attempt to determine this field; or
• the SPDX creator has intentionally provided no information (no meaning should be implied by doing so).
For example, a Relationship with relationshipType=“ancestorOf”, from=Element1, and to=NoAssertionElement is ex-
plicitly expressing that no assertion is being made about any potential descendants of Element1.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/NoAssertionElement
Name:
NoAssertionElement
Type:
IndividualElement
IRI:
https://spdx.org/rdf/3.0.1/terms/Core/NoAssertionElement
8.4.2
