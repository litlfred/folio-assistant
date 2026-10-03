---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-200-severity
section_title: "severity"
section_number: null
pages: 112-113
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Description
The score provides information on the severity of a vulnerability per the Common Vulnerability Scoring System as defined by
Forum of Incident Response and Security Teams79.
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/score
Name:
score
Nature:
DataProperty
Range:
xsd:decimal
Referenced
• /Security/CvssV2VulnAssessmentRelationship
• /Security/CvssV3VulnAssessmentRelationship
• /Security/CvssV4VulnAssessmentRelationship
78https://www.first.org/epss/data_stats
79https://www.first.org/cvss/
100
System Package Data Exchange (SPDX©) v3.0
10.2.16
severity
Summary
Specifies the CVSS qualitative severity rating of a vulnerability in relation to a piece of software.
Description
The severity field provides a human readable string of the resulting numerical CVSS score.
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/severity
Name:
severity
Nature:
ObjectProperty
Range:
