---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-187-actionstatementtime
section_title: "actionStatementTime"
section_number: null
pages: 108-108
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Records the time when a recommended action was communicated in a VEX statement to mitigate a vulnerability.
Description
When a VEX statement communicates an affected status, the author MUST include an action statement with a recommended action
to help mitigate the vulnerability’s impact. The actionStatementTime property records the time when the action statement was first
communicated.
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/actionStatementTime
Name:
actionStatementTime
Nature:
DataProperty
Range:
/Core/DateTime
Referenced
• /Security/VexAffectedVulnAssessmentRelationship
10.2.3
