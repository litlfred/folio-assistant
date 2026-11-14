---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-223-customlicense
section_title: "CustomLicense"
section_number: null
pages: 126-126
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
A license that is not listed on the SPDX License List.
Description
A CustomLicense represents a License that is not listed on the SPDX License List102, and is therefore defined by an SPDX data
creator.
Metadata
https://spdx.org/rdf/3.0.1/terms/ExpandedLicensing/CustomLicense
Name:
CustomLicense
Instantiability:
Concrete
SubclassOf:
License
Superclasses
• /ExpandedLicensing/License
• /ExpandedLicensing/ExtendableLicense
• /SimpleLicensing/AnyLicenseInfo
• /Core/Element
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
isDeprecatedLicenseId
xsd:boolean
0
1
isFsfLibre
xsd:boolean
0
1
isOsiApproved
xsd:boolean
0
1
licenseText
xsd:string
1
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
standardLicenseHeader
xsd:string
0
1
standardLicenseTemplate
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
13.1.3
