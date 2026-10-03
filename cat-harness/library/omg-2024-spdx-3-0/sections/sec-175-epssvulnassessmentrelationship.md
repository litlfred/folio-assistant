---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-175-epssvulnassessmentrelationship
section_title: "EpssVulnAssessmentRelationship"
section_number: null
pages: 94-95
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Provides an EPSS assessment for a vulnerability.
Description
An EpssVulnAssessmentRelationship relationship describes the likelihood or probability that a vulnerability will be exploited in
the wild, and the percentile ranking of probability relative to all other vulnerabilities’ EPSS scores, using the Exploit Prediction
Scoring System (EPSS) as defined at The EPSS Model72.
Constraints
• The relationship type must be set to hasAssessmentFor.
• The probability must be between 0 and 1.
• The percentile must be between 0 and 1.
Example
{
"type": "EpssVulnAssessmentRelationship",
"spdxId": "urn:spdx.dev:epss-CVE-2020-28498",
"relationshipType": "hasAssessmentFor",
"security_probability": "0.00105",
"security_percentile": "0.42356",
"from": "urn:spdx.dev:vuln-cve-2020-28498",
"to": ["urn:product-acme-application-1.3"],
"suppliedBy": ["urn:spdx.dev:agent-jane-doe"],
"publishedTime": "2023-10-05T00:00:30Z"
}
72https://www.first.org/epss/model
82
System Package Data Exchange (SPDX©) v3.0
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/EpssVulnAssessmentRelationship
Name:
EpssVulnAssessmentRelationship
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
percentile
xsd:decimal
1
1
probability
xsd:decimal
1
1
External properties cardinality updates
Property
minCount
maxCount
/Security/VulnAssessmentRelationship/publishedTime
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
percentile
xsd:decimal
1
1
probability
xsd:decimal
1
1
publishedTime
/Core/DateTime
1
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
10.1.5
