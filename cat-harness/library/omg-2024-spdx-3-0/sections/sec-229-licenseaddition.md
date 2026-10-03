---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-229-licenseaddition
section_title: "LicenseAddition"
section_number: null
pages: 130-131
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Abstract class for additional text intended to be added to a License, but which is not itself a standalone License.
Description
A LicenseAddition represents text which is intended to be added to a License as additional text, but which is not itself intended to
be a standalone License.
It may be an exception which is listed on the SPDX License Exceptions105 (ListedLicenseException), or may be any other additional
text (as an exception or otherwise) which is defined by an SPDX data creator (CustomLicenseAddition).
Metadata
https://spdx.org/rdf/3.0.1/terms/ExpandedLicensing/LicenseAddition
Name:
LicenseAddition
Instantiability:
Abstract
SubclassOf:
/Core/Element
Superclasses
• /Core/Element
Properties
Property
Type
minCount
maxCount
additionText
xsd:string
1
1
isDeprecatedAdditionId
xsd:boolean
0
1
licenseXml
xsd:string
0
1
obsoletedBy
xsd:string
0
1
seeAlso
xsd:anyURI
0
*
standardAdditionTemplate
xsd:string
0
1
105https://spdx.org/licenses/exceptions-index.html
118
System Package Data Exchange (SPDX©) v3.0
All properties (informative)
Property
Type
minCount
maxCount
additionText
xsd:string
1
1
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
isDeprecatedAdditionId
xsd:boolean
0
1
licenseXml
xsd:string
0
1
name
xsd:string
0
1
obsoletedBy
xsd:string
0
1
seeAlso
xsd:anyURI
0
*
spdxId
xsd:anyURI
1
1
standardAdditionTemplate
xsd:string
0
1
summary
xsd:string
0
1
verifiedUsing
IntegrityMethod
0
*
13.1.9
