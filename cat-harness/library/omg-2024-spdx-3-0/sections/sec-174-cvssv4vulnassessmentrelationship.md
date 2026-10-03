---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-174-cvssv4vulnassessmentrelationship
section_title: "CvssV4VulnAssessmentRelationship"
section_number: null
pages: 92-94
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Provides a CVSS version 4 assessment for a vulnerability.
Description
A CvssV4VulnAssessmentRelationship relationship describes the determined score, severity, and vector of a vulnerability as de-
fined in Common Vulnerability Scoring System version 4.0: Specification Document71.
It is intended to communicate the results of using a CVSS calculator.
Constraints
• The relationship type must be set to hasAssessmentFor.
Example
{
"type": "CvssV4VulnAssessmentRelationship",
71https://www.first.org/cvss/v4.0/specification-document
80
System Package Data Exchange (SPDX©) v3.0
"spdxId": "urn:spdx.dev:cvssv4-cve-2021-44228",
"relationshipType": "hasAssessmentFor",
"security_severity": "medium",
"security_score": "10.0",
"security_vectorString": "CVSS:4.0/AV:N/AC:L/AT:N/AR:N/UI:N/VCH/VI:H/VA:H/SC:H/SI:H/SA:H/E:A",
"from": "urn:spdx.dev:vuln-cve-2021-44228",
"to": ["urn:product-acme-application-1.3"],
"security_assessedElement": "urn:apache-log4j-2.14.1",
"externalRef": [
{
"@type": "ExternalRef",
"externalRefType": "securityAdvisory",
"locator": "https://nvd.nist.gov/vuln/detail/CVE-2021-44228"
},
{
"@type": "ExternalRef",
"externalRefType": "securityAdvisory",
"locator": "https://logging.apache.org/log4j/2.x/security.html"
},
{
"@type": "ExternalRef",
"externalRefType": "securityOther",
"locator": "https://www.first.org/cvss/v4.0/examples#Apache-log4j-Vulnerability-CVE-2021-44228"
},
],
"suppliedBy": ["urn:spdx.dev:agent-my-security-vendor"],
"publishedTime": "2023-10-05T23:09:13Z"
},
{
"type": "Relationship",
"spdxId": "urn:spdx.dev:vulnAgentRel-1",
"relationshipType": "publishedBy",
"from": "urn:spdx.dev:cvssv4-cve-2021-44228",
"to": ["urn:spdx.dev:agent-apache.org"],
"startTime": "2021-12-11T18:39:00Z"
}
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/CvssV4VulnAssessmentRelationship
Name:
CvssV4VulnAssessmentRelationship
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
severity
CvssSeverityType
1
1
vectorString
xsd:string
1
1
System Package Data Exchange (SPDX©) v3.0
81
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
severity
CvssSeverityType
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
10.1.4
