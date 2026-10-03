---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-372-corerelationship
section_title: "/Core/Relationship"
section_number: null
pages: 196-196
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
having that element as its from property and an /SimpleLicensing/AnyLicenseInfo as its to property.
2. for every /Software/Package object MUST exist exactly one /Core/Relationship object of type hasDeclaredLicense
having that element as its from property and /SimpleLicensing/AnyLicenseInfo object as its to property.
D.2.4
/Core/Hash
• Mandatory
1. algorithm
2. hashValue
• Recommended
1. comment
D.2.5
