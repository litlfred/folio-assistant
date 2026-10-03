---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-102-profileconformance
section_title: "profileConformance"
section_number: null
pages: 54-54
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Describes one a profile which the creator of this ElementCollection intends to conform to.
Description
Describes a profile to which the creator of this ElementCollection intends to conform.
The profileConformance will apply to all Elements contained within the collection as well as the collection itself.
Conformance to a profile is defined by the additional restrictions documented in the profile specific documentation and schema
files.
Use of this property allows the creator of an ElementCollection to communicate to consumers their intent to adhere to the profile
additional restrictions.
The profileConformance has a default value of “core” if no other profileConformance is specified since all ElementCollections
and Element must adhere to the Core profile.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/profileConformance
Name:
profileConformance
Nature:
ObjectProperty
Range:
ProfileIdentifierType
Referenced
• /Core/ElementCollection
8.2.41
