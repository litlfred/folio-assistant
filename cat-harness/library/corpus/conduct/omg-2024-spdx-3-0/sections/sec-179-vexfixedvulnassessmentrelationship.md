---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-179-vexfixedvulnassessmentrelationship
section_title: "VexFixedVulnAssessmentRelationship"
section_number: null
pages: 99-101
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Links a vulnerability and elements representing products (in the VEX sense) where a fix has been applied and are no longer affected.
System Package Data Exchange (SPDX©) v3.0
87
Description
VexFixedVulnAssessmentRelationship links a vulnerability to a number of elements representing VEX products where a vulnera-
bility has been fixed and are no longer affected. It represents the VEX fixed status.
Constraints
When linking elements using a VexFixedVulnAssessmentRelationship, the following requirements must be observed:
• Elements linked with a VulnVexFixedAssessmentRelationship are constrained to using the fixedIn relationship type.
• The from: end of the relationship must be a /Security/Vulnerability classed element.
Example
{
"type": "VexFixedVulnAssessmentRelationship",
"spdxId": "urn:spdx.dev:vex-fixed-in-1",
"relationshipType": "fixedIn",
"from": "urn:spdx.dev:vuln-cve-2020-28498",
"to": ["urn:product-acme-application-1.3"],
"security_assessedElement": "urn:npm-elliptic-6.5.4",
"suppliedBy": ["urn:spdx.dev:agent-jane-doe"],
"publishedTime": "2021-03-09T11:04:53Z"
}
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/VexFixedVulnAssessmentRelationship
Name:
VexFixedVulnAssessmentRelationship
Instantiability:
Concrete
SubclassOf:
VexVulnAssessmentRelationship
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
88
System Package Data Exchange (SPDX©) v3.0
10.1.9
