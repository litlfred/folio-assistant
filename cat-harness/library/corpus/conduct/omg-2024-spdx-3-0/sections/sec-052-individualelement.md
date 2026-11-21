---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-052-individualelement
section_title: "IndividualElement"
section_number: null
pages: 31-32
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
A concrete subclass of Element used by Individuals in the Core profile.
Description
Individuals, such as NoneElement and NoAssertionElement, need to reference a concrete subclass of Element.
This class provides the type used by the individuals defined in the Core profile.
System Package Data Exchange (SPDX©) v3.0
19
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/IndividualElement
Name:
IndividualElement
Instantiability:
Concrete
SubclassOf:
Element
Superclasses
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
8.1.15
IntegrityMethod
Summary
Provides an independently reproducible mechanism that permits verification of a specific Element.
Description
An IntegrityMethod provides an independently reproducible mechanism that permits verification of a specific Element that corre-
lates to the data in this SPDX document. This identifier enables a recipient to determine if anything in the original Element has
been changed and eliminates confusion over which version or modification of a specific Element is referenced.
Please note that different profiles may also provide additional methods for verifying the integrity of specific subclasses of Elements.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/IntegrityMethod
Name:
IntegrityMethod
Instantiability:
Abstract
Properties
Property
Type
minCount
maxCount
comment
xsd:string
0
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
8.1.16
