---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-225-disjunctivelicenseset
section_title: "DisjunctiveLicenseSet"
section_number: null
pages: 127-128
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Portion of an AnyLicenseInfo representing a set of licensing information where only one of the elements applies.
Description
A DisjunctiveLicenseSet indicates that only one of its subsidiary AnyLicenseInfos is required to apply. In other words, a Disjunc-
tiveLicenseSet of two or more licenses represents a licensing situation where only one of the specified licenses are to be complied
with.
A consumer of SPDX data would typically understand this to permit the recipient of the licensed content to choose which of the
corresponding license they would prefer to use. It is represented in the SPDX License Expression Syntax by the OR operator.
Metadata
https://spdx.org/rdf/3.0.1/terms/ExpandedLicensing/DisjunctiveLicenseSet
Name:
DisjunctiveLicenseSet
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
member
/SimpleLicensing/AnyLicenseInfo
2
*
System Package Data Exchange (SPDX©) v3.0
115
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
member
