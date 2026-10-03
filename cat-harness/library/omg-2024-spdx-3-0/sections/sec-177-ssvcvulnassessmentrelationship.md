---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-177-ssvcvulnassessmentrelationship
section_title: "SsvcVulnAssessmentRelationship"
section_number: null
pages: 97-98
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Provides an SSVC assessment for a vulnerability.
Description
An SsvcVulnAssessmentRelationship describes the decision made using the Stakeholder-Specific Vulnerability Categorization
(SSVC) decision tree as defined by CISA Stakeholder-Specific Vulnerability Categorization Guide74.
It is intended to communicate the results of using the CISA SSVC Calculator.
Constraints
• The relationship type must be set to hasAssessmentFor.
Example
{
"@type": "SsvcVulnAssessmentRelationship",
"@id": "urn:spdx.dev:ssvc-1",
"relationshipType": "hasAssessmentFor",
"security_decisionType": "act",
"from": "urn:spdx.dev:vuln-cve-2020-28498",
"to": ["urn:product-acme-application-1.3"],
"security_assessedElement": "urn:npm-elliptic-6.5.2",
"suppliedBy": ["urn:spdx.dev:agent-jane-doe"],
"publishedTime": "2021-03-09T11:04:53Z"
}
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/SsvcVulnAssessmentRelationship
74https://www.cisa.gov/stakeholder-specific-vulnerability-categorization-ssvc
System Package Data Exchange (SPDX©) v3.0
85
Name:
SsvcVulnAssessmentRelationship
Instantiability:
Concrete
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
decisionType
SsvcDecisionType
1
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
decisionType
SsvcDecisionType
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
withdrawnTime
/Core/DateTime
0
1
10.1.7
