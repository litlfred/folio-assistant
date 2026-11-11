---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-240-isosiapproved
section_title: "isOsiApproved"
section_number: null
pages: 137-137
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Specifies whether the License is listed as approved by the Open Source Initiative (OSI).
Description
isOsiApproved specifies whether the Open Source Initiative (OSI)116 has listed this License as “approved” in their list of OSI
Approved Licenses, located at the time of this writing at OSI Approved Licenses117.
A value of “true” indicates that the license is in the list of licenses that OSI publishes as approved.
A value of “false” indicates that the license is explicitly not in the corresponding list of OSI licenses (e.g., OSI has stated publicly
that a license is not approved).
If the isOsiApproved field is not specified, the SPDX data creator makes no assertions about whether the License is approved by
the OSI.
Metadata
https://spdx.org/rdf/3.0.1/terms/ExpandedLicensing/isOsiApproved
Name:
isOsiApproved
Nature:
DataProperty
Range:
xsd:boolean
Referenced
• /ExpandedLicensing/License
13.2.7
