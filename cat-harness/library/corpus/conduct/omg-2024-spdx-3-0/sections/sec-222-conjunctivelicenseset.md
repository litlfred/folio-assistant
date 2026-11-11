---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-222-conjunctivelicenseset
section_title: "ConjunctiveLicenseSet"
section_number: null
pages: 125-126
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Portion of an AnyLicenseInfo representing a set of licensing information where all elements apply.
Description
A ConjunctiveLicenseSet indicates that each of its subsidiary AnyLicenseInfos apply. In other words, a ConjunctiveLicenseSet of
two or more licenses represents a licensing situation where all of the specified licenses are to be complied with. It is represented
in the SPDX License Expression Syntax by the AND operator.
It is syntactically correct to specify a ConjunctiveLicenseSet where the subsidiary AnyLicenseInfos may be “incompatible” ac-
cording to a particular interpretation of the corresponding Licenses. The SPDX License Expression Syntax101 does not take into
account interpretation of license texts, which is left to the consumer of SPDX data to determine for themselves.
Metadata
https://spdx.org/rdf/3.0.1/terms/ExpandedLicensing/ConjunctiveLicenseSet
Name:
ConjunctiveLicenseSet
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
/SimpleLicensing/AnyLicenseInfo
2
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
100../../annexes/spdx-license-expressions.md
101../../../annexes/spdx-license-expressions.md
System Package Data Exchange (SPDX©) v3.0
113
13.1.2
