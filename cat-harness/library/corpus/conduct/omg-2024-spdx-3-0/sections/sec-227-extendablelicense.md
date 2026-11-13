---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-227-extendablelicense
section_title: "ExtendableLicense"
section_number: null
pages: 128-128
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Abstract class representing a License or an OrLaterOperator.
Description
The WithAdditionOperator can have a License or an OrLaterOperator as the license property value. This class is used for the value.
Metadata
https://spdx.org/rdf/3.0.1/terms/ExpandedLicensing/ExtendableLicense
Name:
ExtendableLicense
Instantiability:
Abstract
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
13.1.6
