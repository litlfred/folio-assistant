---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-053-lifecyclescopedrelationship
section_title: "LifecycleScopedRelationship"
section_number: null
pages: 32-33
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Provide context for a relationship that occurs in the lifecycle.
Description
Certain relationships are sensitive to where they occur in the lifecycle. This parameter lets us avoid a proliferation of relationships,
by parameterizing this context information for a relationship.
20
System Package Data Exchange (SPDX©) v3.0
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/LifecycleScopedRelationship
Name:
LifecycleScopedRelationship
Instantiability:
Concrete
SubclassOf:
Relationship
Superclasses
• /Core/Relationship
• /Core/Element
Properties
Property
Type
minCount
maxCount
scope
LifecycleScopeType
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
scope
LifecycleScopeType
0
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
8.1.17
