---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-127-profileidentifiertype
section_title: "ProfileIdentifierType"
section_number: null
pages: 65-66
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Enumeration of the valid profiles.
Description
There are a set of profiles that have been defined by a profile team.
A profile consists of a namespace that may add properties and classes to the Core profile unique to the domain covered by the
profile.
The profile may also contain additional restrictions on existing properties and classes defined in other profiles.
If the creator of an SPDX collection of elements includes a profile in the list of profileConformance, they are claiming that all
contained elements conform to all restrictions defined for that profile.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/ProfileIdentifierType
Name:
ProfileIdentifierType
System Package Data Exchange (SPDX©) v3.0
53
Entries
ai the element follows the AI profile specification
build the element follows the Build profile specification
core the element follows the Core profile specification
dataset the element follows the Dataset profile specification
expandedLicensing the element follows the ExpandedLicensing profile specification
extension the element follows the Extension profile specification
lite the element follows the Lite profile specification
security the element follows the Security profile specification
simpleLicensing the element follows the SimpleLicensing profile specification
software the element follows the Software profile specification
8.3.8
