---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-192-impactstatement
section_title: "impactStatement"
section_number: null
pages: 109-110
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Explains why a VEX product is not affected by a vulnerability. It is an alternative in VexNotAffectedVulnAssessmentRelationship
to the machine-readable justification label.
Description
When a VEX product element is related with a VexNotAffectedVulnAssessmentRelationship and a machine readable justification
label is not provided, then an impactStatement that further explains how or why the product(s) are not affected by the vulnerability
must be provided.
76../Vocabularies/SsvcDecisionType.md
System Package Data Exchange (SPDX©) v3.0
97
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/impactStatement
Name:
impactStatement
Nature:
DataProperty
Range:
xsd:string
Referenced
• /Security/VexNotAffectedVulnAssessmentRelationship
10.2.8
