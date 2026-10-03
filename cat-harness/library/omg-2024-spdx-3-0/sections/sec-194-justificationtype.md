---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-194-justificationtype
section_title: "justificationType"
section_number: null
pages: 110-110
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Impact justification label to be used when linking a vulnerability to an element representing a VEX product with a VexNotAffect-
edVulnAssessmentRelationship relationship.
Description
When stating that an element is not affected by a vulnerability, the VexNotAffectedVulnAssessmentRelationship must include a
justification from the machine-readable labels catalog informing the reason the element is not impacted.
impactStatement which is a string with English prose can be used instead or as complementary to the justification label, but one
of both MUST be defined.
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/justificationType
Name:
justificationType
Nature:
ObjectProperty
Range:
VexJustificationType
Referenced
• /Security/VexNotAffectedVulnAssessmentRelationship
10.2.10
