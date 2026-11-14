---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-059-relationship
section_title: "Relationship"
section_number: null
pages: 37-38
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Describes a relationship between one or more elements.
Description
A Relationship is a grouping of characteristics unique to an assertion that one Element is related to one or more other Elements in
some way.
To explicitly assert that no such relationships exist, the to property should contain the NoneElement individual and no other
elements.
A relationship that contains NoneElement and additional elements in the to property is not valid.
To explicitly assert that no assertions are being made regarding the existence of such relationships, the to property should contain
the NoAssertionElement individual.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/Relationship
Name:
Relationship
Instantiability:
Concrete
SubclassOf:
Element
Superclasses
• /Core/Element
Properties
Property
Type
minCount
maxCount
completeness
RelationshipCompleteness
0
1
endTime
DateTime
0
1
from
Element
1
1
relationshipType
RelationshipType
1
1
startTime
DateTime
0
1
to
Element
1
*
System Package Data Exchange (SPDX©) v3.0
25
All properties (informative)
Property
Type
minCount
maxCount
comment
xsd:string
0
1
completeness
RelationshipCompleteness
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
endTime
DateTime
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
from
Element
1
1
name
xsd:string
0
1
relationshipType
RelationshipType
1
1
spdxId
xsd:anyURI
1
1
startTime
DateTime
0
1
summary
xsd:string
0
1
to
Element
1
*
verifiedUsing
IntegrityMethod
0
*
8.1.23
