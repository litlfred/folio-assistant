---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-246-standardadditiontemplate
section_title: "standardAdditionTemplate"
section_number: null
pages: 139-140
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Identifies the full text of a LicenseAddition, in SPDX templating format.
Description
A standardAdditionTemplate contains a license addition template which describes sections of the LicenseAddition text which can
be varied.
See the Legacy Text Template format section of the SPDX License List Matching Guidelines121 for format information.
It is recommended to use licenseXml122 instead, as it can capture all the text and metadata associated with a license.
Metadata
https://spdx.org/rdf/3.0.1/terms/ExpandedLicensing/standardAdditionTemplate
Name:
standardAdditionTemplate
Nature:
DataProperty
Range:
xsd:string
121../../../annexes/license-matching-guidelines-and-templates.md
122./licenseXml.md
System Package Data Exchange (SPDX©) v3.0
127
Referenced
• /ExpandedLicensing/LicenseAddition
13.2.13
