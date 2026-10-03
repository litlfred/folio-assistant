---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-244-obsoletedby
section_title: "obsoletedBy"
section_number: null
pages: 138-139
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Specifies the licenseId that is preferred to be used in place of a deprecated License or LicenseAddition.
Description
An obsoletedBy value for a deprecated License or LicenseAddition specifies the licenseId of the replacement License or LicenseAd-
dition that is preferred to be used in its place. It should use the same format as specified for a licenseId.
The License’s or LicenseAddition’s comment value may include more information about the reason why the licenseId specified in
the obsoletedBy value is preferred.
120https://spdx.org/licenses/
126
System Package Data Exchange (SPDX©) v3.0
Metadata
https://spdx.org/rdf/3.0.1/terms/ExpandedLicensing/obsoletedBy
Name:
obsoletedBy
Nature:
DataProperty
Range:
xsd:string
Referenced
• /ExpandedLicensing/License
• /ExpandedLicensing/LicenseAddition
13.2.11
