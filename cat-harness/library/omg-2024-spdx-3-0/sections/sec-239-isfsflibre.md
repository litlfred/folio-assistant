---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-239-isfsflibre
section_title: "isFsfLibre"
section_number: null
pages: 136-137
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Specifies whether the License is listed as free by the Free Software Foundation (FSF).
Description
isFsfLibre specifies whether the Free Software Foundation (FSF)114 has listed this License as “free” in their commentary on licenses,
located at the time of this writing at Various Licenses and Comments about Them115.
A value of “true” indicates that the license is in the list of licenses that FSF publishes as libre.
A value of “false” indicates that the license is explicitly not in the corresponding list of FSF libre licenses (e.g., FSF has the license
on a non-free list).
If the isFsfLibre field is not specified, the SPDX data creator makes no assertions about whether the License is listed in the FSF’s
commentary.
113https://spdx.org/licenses/
114https://fsf.org
115https://www.gnu.org/licenses/license-list.en.html
124
System Package Data Exchange (SPDX©) v3.0
Metadata
https://spdx.org/rdf/3.0.1/terms/ExpandedLicensing/isFsfLibre
Name:
isFsfLibre
Nature:
DataProperty
Range:
xsd:boolean
Referenced
• /ExpandedLicensing/License
13.2.6
