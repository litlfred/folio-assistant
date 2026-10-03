---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-317-lite
section_title: "Lite"
section_number: null
pages: 173-175
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
The SPDX Lite profile defines a simple view of SPDX data, from the point of view of use cases in some industries.
Description
The SPDX Lite profile consists of mandatory and recommended information.
The mandatory data in SPDX Lite is basic but useful for complying with licenses. It is easy to understand licensing information
by reading an SPDX Lite file.
SPDX Lite aims at a balance between the full SPDX data model and actual workflows in some industries.
An SPDX Lite document can also be used in parallel with other SPDX documents in software supply chains.
Metadata
https://spdx.org/rdf/3.0.1/terms/Lite
Name:
Lite
Profile conformance
In addition to the following mandatory requirements, please refer to the corresponding Annex for elements that should be included
as part of a document conforming to the Lite profile.
For a /Software/Package to be conformant with this profile, the following has to hold:
1. The minCount for copyrightText is 1
2. The minCount for packageVersion is 1
3. The minCount for suppliedBy is 1
4. At least one of downloadLocation or packageUrl must be present
Additionally:
1. for every /Software/Package there MUST exist exactly one /Core/Relationship of type hasConcludedLicense
having that element as its from property and a /SimpleLicensing/AnyLicenseInfo as its to property.
2. for every /Software/Package there MUST exist exactly one /Core/Relationship of type hasDeclaredLicense
having that element as its from property and a /SimpleLicensing/AnyLicenseInfo as its to property.
For a /Core/SpdxDocument to be conformant with this profile, the following has to hold:
1. The minCount for element is 1
2. The minCount for rootElement is 1
For a /Software/Sbom to be conformant with this profile, the following has to hold:
1. The minCount for element is 1
2. The minCount for rootElement is 1
Finally, for a /Core/Agent to be conformant with this profile, the following has to hold:
1. The minCount for name is 1
System Package Data Exchange (SPDX©) v3.0
161
This page intentionally left blank.
162
System Package Data Exchange (SPDX©) v3.0
18
