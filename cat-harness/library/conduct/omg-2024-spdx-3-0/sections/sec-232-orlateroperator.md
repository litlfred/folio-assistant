---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-232-orlateroperator
section_title: "OrLaterOperator"
section_number: null
pages: 133-134
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Portion of an AnyLicenseInfo representing this version, or any later version, of the indicated License.
Description
An OrLaterOperator indicates that this portion of the AnyLicenseInfo represents either (1) the specified version of the correspond-
ing License, or (2) any later version of that License. It is represented in the SPDX License Expression Syntax by the + operator.
It is context-dependent, and unspecified by SPDX, as to what constitutes a “later version” of any particular License. Some Licenses
may not be versioned, or may not have clearly-defined ordering for versions. The consumer of SPDX data will need to determine
for themselves what meaning to attribute to a “later version” operator for a particular License.
Metadata
https://spdx.org/rdf/3.0.1/terms/ExpandedLicensing/OrLaterOperator
Name:
OrLaterOperator
Instantiability:
Concrete
SubclassOf:
ExtendableLicense
Superclasses
• /ExpandedLicensing/ExtendableLicense
• /SimpleLicensing/AnyLicenseInfo
• /Core/Element
Properties
Property
Type
minCount
maxCount
subjectLicense
License
1
1
System Package Data Exchange (SPDX©) v3.0
121
