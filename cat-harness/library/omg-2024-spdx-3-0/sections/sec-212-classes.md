---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-212-classes
section_title: "Classes"
section_number: null
pages: 119-120
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
It also provides the base abstract class, AnyLicenseInfo, used for references to license information.
The SimpleLicensingText class provides a place to record any license text found that does not match a license on the SPDX License
List89.
The ExpandedLicensing profile can be used to represent the complete parsed license expressions.
Metadata
https://spdx.org/rdf/3.0.1/terms/SimpleLicensing
Name:
SimpleLicensing
12.1
Classes
12.1.1
AnyLicenseInfo
Summary
Abstract class representing a license combination consisting of one or more licenses.
Description
AnyLicenseInfo is an abstract class representing a license combination consisting of one or more licenses (optionally including
additional text), which may be combined according to the SPDX license expression syntax90.
An AnyLicenseInfo is used by licensing properties of software artifacts.
It can be:
• a NoneLicense;
• a NoAssertionLicense;
• a single license (either on the SPDX License List91 or a custom-defined license92);
• a single license with an “or later” operator applied;
• the foregoing with additional text applied; or
• a set of licenses combined by applying “AND” and “OR” operators recursively.
Metadata
https://spdx.org/rdf/3.0.1/terms/SimpleLicensing/AnyLicenseInfo
Name:
AnyLicenseInfo
Instantiability:
Abstract
SubclassOf:
/Core/Element
Superclasses
• /Core/Element
88../../annexes/spdx-license-expressions.md
89https://spdx.org/licenses/
90../../../annexes/spdx-license-expressions.md
91https://spdx.org/licenses/
92../../ExpandedLicensing/Classes/CustomLicense.md
System Package Data Exchange (SPDX©) v3.0
107
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
12.1.2
