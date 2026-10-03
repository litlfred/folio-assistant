---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-237-isdeprecatedadditionid
section_title: "isDeprecatedAdditionId"
section_number: null
pages: 135-136
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Specifies whether an additional text identifier has been marked as deprecated.
Description
The isDeprecatedAdditionId property specifies whether an identifier for a LicenseAddition has been marked as deprecated. If the
property is not defined, then it is presumed to be false (i.e., not deprecated).
If the LicenseAddition is included on the SPDX License Exceptions112, then the deprecatedVersion property indicates on
which version release of the Exceptions List it was first marked as deprecated.
109../../../annexes/license-matching-guidelines-and-templates.md
110https://spdx.org/licenses/
111https://spdx.org/licenses/exceptions-index.html
112https://spdx.org/licenses/exceptions-index.html
System Package Data Exchange (SPDX©) v3.0
123
“Deprecated” in this context refers to deprecating the use of the identifier, not the underlying license addition. In other words, even
if a LicenseAddition’s author or steward has stated that a particular LicenseAddition generally should not be used, that would not
mean that the LicenseAddition’s identifier is “deprecated.” Rather, a LicenseAddition operator is typically marked as “deprecated”
when it is determined that use of another identifier is preferable.
Metadata
https://spdx.org/rdf/3.0.1/terms/ExpandedLicensing/isDeprecatedAdditionId
Name:
isDeprecatedAdditionId
Nature:
DataProperty
Range:
xsd:boolean
Referenced
• /ExpandedLicensing/LicenseAddition
13.2.4
