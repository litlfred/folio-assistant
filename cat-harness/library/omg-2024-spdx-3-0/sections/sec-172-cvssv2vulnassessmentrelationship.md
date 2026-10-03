---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-172-cvssv2vulnassessmentrelationship
section_title: "CvssV2VulnAssessmentRelationship"
section_number: null
pages: 89-90
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Provides a CVSS version 2.0 assessment for a vulnerability.
Description
A CvssV2VulnAssessmentRelationship relationship describes the determined score and vector of a vulnerability as defined in A
Complete Guide to the Common Vulnerability Scoring System Version 2.068.
It is intended to communicate the results of using a CVSS calculator.
Constraints
• The relationship type must be set to hasAssessmentFor.
Example
{
"type": "CvssV2VulnAssessmentRelationship",
"spdxId": "urn:spdx.dev:cvssv2-cve-2020-28498",
"relationshipType": "hasAssessmentFor",
"security_score": "4.3",
"security_vectorString": "(AV:N/AC:M/Au:N/C:P/I:N/A:N)",
"from": "urn:spdx.dev:vuln-cve-2020-28498",
"to": ["urn:product-acme-application-1.3"],
"security_assessedElement": "urn:npm-elliptic-6.5.2",
"externalRef": [
{
"type": "ExternalRef",
"externalRefType": "securityAdvisory",
"locator": "https://nvd.nist.gov/vuln/detail/CVE-2020-28498"
},
{
"type": "ExternalRef",
"externalRefType": "securityAdvisory",
"locator": "https://snyk.io/vuln/SNYK-JS-ELLIPTIC-1064899"
},
{
"type": "ExternalRef",
"externalRefType": "securityFix",
"locator": "https://github.com/indutny/elliptic/commit/441b742"
}
],
"suppliedBy": ["urn:spdx.dev:agent-my-security-vendor"],
"publishedTime": "2023-05-06T10:06:13Z"
},
68https://www.first.org/cvss/v2/guide
System Package Data Exchange (SPDX©) v3.0
77
{
"type": "Relationship",
"spdxId": "urn:spdx.dev:vulnAgentRel-1",
"relationshipType": "publishedBy",
"from": "urn:spdx.dev:cvssv2-cve-2020-28498",
"to": ["urn:spdx.dev:agent-snyk"],
"startTime": "2021-03-08T16:06:50Z"
}
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/CvssV2VulnAssessmentRelationship
Name:
CvssV2VulnAssessmentRelationship
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
score
xsd:decimal
1
1
vectorString
xsd:string
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
score
xsd:decimal
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
vectorString
xsd:string
1
1
verifiedUsing
IntegrityMethod
0
*
withdrawnTime
/Core/DateTime
0
1
10.1.2
