---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-178-vexaffectedvulnassessmentrelationship
section_title: "VexAffectedVulnAssessmentRelationship"
section_number: null
pages: 98-99
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Connects a vulnerability and an element designating the element as a product affected by the vulnerability.
Description
VexAffectedVulnAssessmentRelationship connects a vulnerability and a number of elements. The relationship marks these ele-
ments as products affected by the vulnerability. This relationship corresponds to the VEX affected status.
Constraints
When linking elements using a VexAffectedVulnAssessmentRelationship, the following requirements must be observed:
• Elements linked with a VulnVexAffectedAssessmentRelationship are constrained to the affects relationship type.
Example
{
"type": "VexAffectedVulnAssessmentRelationship",
"spdxId": "urn:spdx.dev:vex-affected-1",
"relationshipType": "affects",
86
System Package Data Exchange (SPDX©) v3.0
"from": "urn:spdx.dev:vuln-cve-2020-28498",
"to": ["urn:product-acme-application-1.3"],
"security_assessedElement": "urn:npm-elliptic-6.5.2",
"security_actionStatement": "Upgrade to version 1.4 of ACME application.",
"suppliedBy": ["urn:spdx.dev:agent-jane-doe"],
"publishedTime": "2021-03-09T11:04:53Z"
}
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/VexAffectedVulnAssessmentRelationship
Name:
VexAffectedVulnAssessmentRelationship
Instantiability:
Concrete
SubclassOf:
VexVulnAssessmentRelationship
Superclasses
• /Security/VexVulnAssessmentRelationship
• /Security/VulnAssessmentRelationship
• /Core/Relationship
• /Core/Element
Properties
Property
Type
minCount
maxCount
actionStatement
xsd:string
1
1
actionStatementTime
/Core/DateTime
0
1
All properties (informative)
Property
Type
minCount
maxCount
actionStatement
xsd:string
1
1
actionStatementTime
/Core/DateTime
0
1
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
10.1.8
