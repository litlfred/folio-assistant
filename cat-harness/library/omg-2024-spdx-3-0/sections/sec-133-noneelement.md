---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-133-noneelement
section_title: "NoneElement"
section_number: null
pages: 69-70
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
An Individual Value for Element representing a set of Elements with cardinality (number/count) of zero.
Description
NoneElement should be used if the SPDX creator desires to assert that there are NO elements for the given context of use.
For example, a Relationship with relationshipType=“ancestorOf”, from=Element1, and to=NoneElement is explicitly
expressing an assertion that Element1 has no descendants.
System Package Data Exchange (SPDX©) v3.0
57
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/NoneElement
Name:
NoneElement
Type:
IndividualElement
IRI:
https://spdx.org/rdf/3.0.1/terms/Core/NoneElement
8.4.3
