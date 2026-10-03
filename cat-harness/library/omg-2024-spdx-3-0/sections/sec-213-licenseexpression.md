---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-213-licenseexpression
section_title: "LicenseExpression"
section_number: null
pages: 120-121
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
An SPDX Element containing an SPDX license expression string.
Description
A LicenseExpression enables the representation, in a single string, of a combination of one or more licenses, together with additions
such as license exceptions.
The syntax for a licenseExpression string is set forth in the corresponding Annex of this specification (“SPDX license expres-
sions”93). A licenseExpression string is not valid if it does not conform to the grammar set forth in that Annex.
The ExpandedLicensing profile can be used to represent the complete parsed license expression as a combination of license objects.
Metadata
https://spdx.org/rdf/3.0.1/terms/SimpleLicensing/LicenseExpression
Name:
LicenseExpression
Instantiability:
Concrete
SubclassOf:
AnyLicenseInfo
Superclasses
• /SimpleLicensing/AnyLicenseInfo
• /Core/Element
Properties
Property
Type
minCount
maxCount
customIdToUri
/Core/DictionaryEntry
0
*
licenseExpression
xsd:string
1
1
licenseListVersion
/Core/SemVer
0
1
93../../../annexes/spdx-license-expressions.md
108
System Package Data Exchange (SPDX©) v3.0
