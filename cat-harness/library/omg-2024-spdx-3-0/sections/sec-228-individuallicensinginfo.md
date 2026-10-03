---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-228-individuallicensinginfo
section_title: "IndividualLicensingInfo"
section_number: null
pages: 128-130
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
A concrete subclass of AnyLicenseInfo used by Individuals in the ExpandedLicensing profile.
Description
Individuals, such as NoneLicense and NoAssertionLicense, need to reference a concrete subclass of AnyLicenseInfo.
This class provides the type used by the individuals.
116
System Package Data Exchange (SPDX©) v3.0
Metadata
https://spdx.org/rdf/3.0.1/terms/ExpandedLicensing/IndividualLicensingInfo
Name:
IndividualLicensingInfo
Instantiability:
Concrete
SubclassOf:
/SimpleLicensing/AnyLicenseInfo
Superclasses
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
name
xsd:string
0
1
spdxId
xsd:anyURI
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
13.1.7
License
Summary
Abstract class for the portion of an AnyLicenseInfo representing a license.
Description
A License represents a license text, whether listed on the SPDX License List104 (ListedLicense) or defined by an SPDX data creator
(CustomLicense).
Metadata
https://spdx.org/rdf/3.0.1/terms/ExpandedLicensing/License
Name:
License
Instantiability:
Abstract
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
/SimpleLicensing/licenseText
xsd:string
1
1
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
standardLicenseHeader
xsd:string
0
1
standardLicenseTemplate
xsd:string
0
1
104https://spdx.org/licenses/
System Package Data Exchange (SPDX©) v3.0
117
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
13.1.8
