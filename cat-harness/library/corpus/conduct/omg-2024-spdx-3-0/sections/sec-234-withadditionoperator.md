---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-234-withadditionoperator
section_title: "WithAdditionOperator"
section_number: null
pages: 134-135
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Portion of an AnyLicenseInfo representing a License which has additional text applied to it.
Description
A WithAdditionOperator indicates that the designated License is subject to the designated LicenseAddition, which might be a li-
cense exception on the SPDX License Exceptions108 (ListedLicenseException) or may be other additional text (CustomLicenseAd-
dition). It is represented in the SPDX License Expression Syntax by the WITH operator.
Metadata
https://spdx.org/rdf/3.0.1/terms/ExpandedLicensing/WithAdditionOperator
Name:
WithAdditionOperator
Instantiability:
Concrete
SubclassOf:
/SimpleLicensing/AnyLicenseInfo
Superclasses
• /SimpleLicensing/AnyLicenseInfo
• /Core/Element
Properties
Property
Type
minCount
maxCount
subjectAddition
LicenseAddition
1
1
subjectExtendableLicense
ExtendableLicense
1
1
All properties (informative)
Property
Type
minCount
maxCount
comment
xsd:string
0
1
creationInfo
CreationInfo
1
1
description
xsd:string
0
1
extension
/Extension/Extension
0
*
externalIdentifier
ExternalIdentifier
0
*
externalRef
ExternalRef
0
*
name
xsd:string
0
1
spdxId
xsd:anyURI
1
1
subjectAddition
LicenseAddition
1
1
subjectExtendableLicense
ExtendableLicense
1
1
summary
xsd:string
0
1
verifiedUsing
IntegrityMethod
0
*
108https://spdx.org/licenses/exceptions-index.html
122
System Package Data Exchange (SPDX©) v3.0
13.2
Properties
13.2.1
