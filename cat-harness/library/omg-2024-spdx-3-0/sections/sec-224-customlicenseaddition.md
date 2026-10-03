---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-224-customlicenseaddition
section_title: "CustomLicenseAddition"
section_number: null
pages: 126-127
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
A license addition that is not listed on the SPDX Exceptions List.
Description
A CustomLicenseAddition represents an addition to a License that is not listed on the SPDX License Exceptions103, and is therefore
defined by an SPDX data creator.
It is intended to represent additional language which is meant to be added to a License, but which is not itself a standalone License.
102https://spdx.org/licenses
103https://spdx.org/licenses/exceptions-index.html
114
System Package Data Exchange (SPDX©) v3.0
Metadata
https://spdx.org/rdf/3.0.1/terms/ExpandedLicensing/CustomLicenseAddition
Name:
CustomLicenseAddition
Instantiability:
Concrete
SubclassOf:
LicenseAddition
Superclasses
• /ExpandedLicensing/LicenseAddition
• /Core/Element
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
13.1.4
