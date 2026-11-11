---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-183-vexvulnassessmentrelationship
section_title: "VexVulnAssessmentRelationship"
section_number: null
pages: 103-104
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Superclasses
• /Security/VexVulnAssessmentRelationship
• /Security/VulnAssessmentRelationship
• /Core/Relationship
• /Core/Element
All properties (informative)
Property
Type
minCount
maxCount
assessedElement
/Software/SoftwareArtifact
0
1
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
modifiedTime
/Core/DateTime
0
1
name
xsd:string
0
1
publishedTime
/Core/DateTime
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
statusNotes
xsd:string
0
1
summary
xsd:string
0
1
suppliedBy
/Core/Agent
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
vexVersion
xsd:string
0
1
withdrawnTime
/Core/DateTime
0
1
10.1.11
VexVulnAssessmentRelationship
Summary
Abstract ancestor class for all VEX relationships
Description
VexVulnAssessmentRelationship is an abstract subclass that defined the common properties shared by all the SPDX-VEX status
relationships.
Constraints
When linking elements using a VexVulnAssessmentRelationship, the following requirements must be observed:
• The from: end must be a /Security/Vulnerability classed element
• The to: end must point to elements representing the VEX products.
To specify a different element where the vulnerability was detected, the VEX relationship can optionally specify subcomponents
using the assessedElement property.
VEX inherits information from the document level down to its statements. When a statement is missing information it can be
completed by reading the equivalent field from the containing document. For example, if a VEX relationship is missing data in
System Package Data Exchange (SPDX©) v3.0
91
its createdBy property, tools must consider the entity listed in the CreationInfo section of the document as the VEX author. In the
same way, when a VEX relationship does not have a created property, the document’s date must be considered as authoritative.
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/VexVulnAssessmentRelationship
Name:
VexVulnAssessmentRelationship
Instantiability:
Abstract
SubclassOf:
VulnAssessmentRelationship
Superclasses
• /Security/VulnAssessmentRelationship
• /Core/Relationship
• /Core/Element
Properties
Property
Type
minCount
maxCount
statusNotes
xsd:string
0
1
vexVersion
xsd:string
0
1
All properties (informative)
Property
Type
minCount
maxCount
assessedElement
/Software/SoftwareArtifact
0
1
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
modifiedTime
/Core/DateTime
0
1
name
xsd:string
0
1
publishedTime
/Core/DateTime
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
statusNotes
xsd:string
0
1
summary
xsd:string
0
1
suppliedBy
/Core/Agent
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
vexVersion
xsd:string
0
1
withdrawnTime
/Core/DateTime
0
1
10.1.12
VulnAssessmentRelationship
Summary
