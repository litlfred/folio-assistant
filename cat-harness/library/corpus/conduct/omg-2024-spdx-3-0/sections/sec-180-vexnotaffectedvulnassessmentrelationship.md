---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-180-vexnotaffectedvulnassessmentrelationship
section_title: "VexNotAffectedVulnAssessmentRelationship"
section_number: null
pages: 101-102
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Links a vulnerability and one or more elements designating the latter as products not affected by the vulnerability.
Description
VexNotAffectedVulnAssessmentRelationship connects a vulnerability and a number of elements designating them as products not
affected by the vulnerability. This relationship corresponds to the VEX not_affected status.
Constraints
When linking elements using a VexNotVulnAffectedAssessmentRelationship, the following requirements must be observed:
• Relating elements with a VexNotAffectedVulnAssessmentRelationship is restricted to the doesNotAffect relationship type.
• The from: end of the relationship must be a /Security/Vulnerability classed element.
• Both impactStatement and justificationType properties have a cardinality of 0..1 making them optional. Nevertheless, to
produce a valid VEX not_affected statement, one of them MUST be defined. This is specified in the Minimum Elements
for VEX.
Example
{
"type": "VexNotAffectedVulnAssessmentRelationship",
"spdxId": "urn:spdx.dev:vex-not-affected-1",
"relationshipType": "doesNotAffect",
"from": "urn:spdx.dev:vuln-cve-2020-28498",
"to": ["urn:product-acme-application-1.3"],
"security_assessedElement": "urn:npm-elliptic-6.5.2",
"security_justificationType": "componentNotPresent",
"security_impactStatement": "Not using this vulnerable part of this library.",
"suppliedBy": ["urn:spdx.dev:agent-jane-doe"],
"publishedTime": "2021-03-09T11:04:53Z"
}
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/VexNotAffectedVulnAssessmentRelationship
Name:
VexNotAffectedVulnAssessmentRelationship
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
impactStatement
xsd:string
0
1
impactStatementTime
/Core/DateTime
0
1
justificationType
VexJustificationType
0
1
System Package Data Exchange (SPDX©) v3.0
89
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
impactStatement
xsd:string
0
1
impactStatementTime
/Core/DateTime
0
1
justificationType
VexJustificationType
0
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
10.1.10
