---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-238-isdeprecatedlicenseid
section_title: "isDeprecatedLicenseId"
section_number: null
pages: 136-136
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Specifies whether a license or additional text identifier has been marked as deprecated.
Description
The isDeprecatedLicenseId property specifies whether an identifier for a License or LicenseAddition has been marked as depre-
cated. If the property is not defined, then it is presumed to be false (i.e., not deprecated).
If the License or LicenseAddition is included on the SPDX License List113, then the deprecatedVersion property indicates
on which version release of the License List it was first marked as deprecated.
“Deprecated” in this context refers to deprecating the use of the identifier, not the underlying license. In other words, even if a
License’s author or steward has stated that a particular License generally should not be used, that would not mean that the License’s
identifier is “deprecated.” Rather, a License or LicenseAddition operator is typically marked as “deprecated” when it is determined
that use of another identifier is preferable.
Metadata
https://spdx.org/rdf/3.0.1/terms/ExpandedLicensing/isDeprecatedLicenseId
Name:
isDeprecatedLicenseId
Nature:
DataProperty
Range:
xsd:boolean
Referenced
• /ExpandedLicensing/License
13.2.5
