---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-203-vectorstring
section_title: "vectorString"
section_number: null
pages: 113-114
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Specifies the CVSS vector string for a vulnerability.
Description
Specifies any combination of the CVSS Base, Temporal, Threat, Environmental, and/or Supplemental vector string values for a
vulnerability.
Supports vectorStrings specified in all CVSS versions.
Constraints
String values for the vectorString range must only include the abbreviated form of metric names specified in CVSS specifications,
e.g. Common Vulnerability Scoring System Vector String80.
80https://www.first.org/cvss/v4.0/specification-document#Vector-String
System Package Data Exchange (SPDX©) v3.0
101
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/vectorString
Name:
vectorString
Nature:
DataProperty
Range:
xsd:string
Referenced
• /Security/CvssV2VulnAssessmentRelationship
• /Security/CvssV3VulnAssessmentRelationship
• /Security/CvssV4VulnAssessmentRelationship
10.2.19
