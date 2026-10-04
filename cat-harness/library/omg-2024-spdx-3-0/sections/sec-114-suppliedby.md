---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-114-suppliedby
section_title: "suppliedBy"
section_number: null
pages: 58-58
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Identifies who or what supplied the artifact or VulnAssessmentRelationship referenced by the Element.
Description
Identify the actual distribution source for the artifact (e.g., snippet, file, package, vulnerability) or VulnAssessmentRelationship
being referenced.
This might or might not be different from the originating distribution source for the artifact (e.g., snippet, file, package, vulnera-
bility) or VulnAssessmentRelationship.
Metadata
https://spdx.org/rdf/3.0.1/terms/Core/suppliedBy
Name:
suppliedBy
Nature:
ObjectProperty
Range:
Agent
Referenced
• /Core/Artifact
• /Security/VulnAssessmentRelationship
8.2.53
