---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-218-simplelicensingtext
section_title: "SimpleLicensingText"
section_number: null
pages: 121-123
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
A license or addition that is not listed on the SPDX License List.
Description
A SimpleLicensingText represents a License or Addition that is not listed on the SPDX License List94, and is therefore defined by
an SPDX data creator.
Metadata
https://spdx.org/rdf/3.0.1/terms/SimpleLicensing/SimpleLicensingText
Name:
SimpleLicensingText
Instantiability:
Concrete
SubclassOf:
/Core/Element
Superclasses
• /Core/Element
Properties
Property
Type
minCount
maxCount
licenseText
xsd:string
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
licenseText
xsd:string
1
1
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
94https://spdx.org/licenses
System Package Data Exchange (SPDX©) v3.0
109
12.2
Properties
12.2.1
customIdToUri
Summary
Maps a LicenseRef or AdditionRef string for a Custom License or a Custom License Addition to its URI ID.
Description
Within a License Expression, references can be made to a Custom License or a Custom License Addition.
The License Expression syntax95 dictates any reference starting with a “LicenseRef-” or “AdditionRef-” refers to license or addition
text not found in the official SPDX License List96.
These custom licenses must be a CustomLicense, a CustomLicenseAddition, or a SimpleLicensingText which are identified with
a unique URI identifier.
The key for the DictionaryEntry is the string used in the license expression and the value is the URI for the corresponding Custom-
License, CustomLicenseAddition, or SimpleLicensingText.
Metadata
https://spdx.org/rdf/3.0.1/terms/SimpleLicensing/customIdToUri
Name:
customIdToUri
Nature:
ObjectProperty
Range:
/Core/DictionaryEntry
Referenced
• /SimpleLicensing/LicenseExpression
12.2.2
licenseExpression
Summary
A string in the license expression format.
Description
A licenseExpression enables the representation, in a single string, of a combination of one or more licenses, together with additions
such as license exceptions.
The syntax for a licenseExpression string is set forth in the corresponding Annex of this specification (“SPDX license expres-
sions”97). A licenseExpression string is not valid if it does not conform to the grammar set forth in that Annex.
The ExpandedLicensing profile can be used to represent the complete parsed license expression as a combination of license objects.
Metadata
https://spdx.org/rdf/3.0.1/terms/SimpleLicensing/licenseExpression
Name:
licenseExpression
Nature:
DataProperty
Range:
xsd:string
Referenced
• /SimpleLicensing/LicenseExpression
12.2.3
licenseListVersion
Summary
The version of the SPDX License List used in the license expression.
95../../../annexes/spdx-license-expressions.md
96https://spdx.org/licenses/
97../../../annexes/spdx-license-expressions.md
110
System Package Data Exchange (SPDX©) v3.0
Description
Recognizing that licenses are added to the SPDX License List98 with each subsequent version, the intent is to provide consumers
with the version of the SPDX License List used.
This anticipates that in the future, license expression might have used a version of the SPDX License List that is older than the
then current one.
The specified version of the SPDX License List must include all listed licenses and exceptions referenced in the expression.
Metadata
https://spdx.org/rdf/3.0.1/terms/SimpleLicensing/licenseListVersion
Name:
licenseListVersion
Nature:
DataProperty
Range:
/Core/SemVer
Referenced
• /SimpleLicensing/LicenseExpression
12.2.4
