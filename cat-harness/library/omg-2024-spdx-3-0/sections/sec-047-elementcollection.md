---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-047-elementcollection
section_title: "ElementCollection"
section_number: null
pages: 28-29
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
A collection of Elements, not necessarily with unifying context.
Description
An ElementCollection is a collection of Elements, not necessarily with unifying context.
Note that all ElementCollections must conform to the Core profile even if the Core profile is not specified in the profileConformance
property.
If the profileConformance property is not provided, “core” is to be assumed as the default.
Constraints
• If the ElementCollection has at least 1 element, it must also have at least 1 rootElement.
• The element must not be of type SpdxDocument.
• The rootElement must not be of type SpdxDocument.
16
System Package Data Exchange (SPDX©) v3.0
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/ElementCollection
Name:
ElementCollection
Instantiability:
Abstract
SubclassOf:
Element
Superclasses
• /Core/Element
Properties
Property
Type
minCount
maxCount
element
Element
0
*
profileConformance
ProfileIdentifierType
0
*
rootElement
Element
0
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
element
Element
0
*
extension
/Extension/Extension
0
*
externalIdentifier
ExternalIdentifier
0
*
