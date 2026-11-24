---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-248-standardlicensetemplate
section_title: "standardLicenseTemplate"
section_number: null
pages: 140-140
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Identifies the full text of a License, in SPDX templating format.
Description
A standardLicenseTemplate contains a license template which describes sections of the License text which can be varied.
See the Legacy Text Template format section of the SPDX License List Matching Guidelines123 for format information.
It is recommended to use licenseXml124 instead, as it can capture all the text and metadata associated with a license.
Metadata
https://spdx.org/rdf/3.0.1/terms/ExpandedLicensing/standardLicenseTemplate
Name:
standardLicenseTemplate
Nature:
DataProperty
Range:
xsd:string
Referenced
• /ExpandedLicensing/License
13.2.15
