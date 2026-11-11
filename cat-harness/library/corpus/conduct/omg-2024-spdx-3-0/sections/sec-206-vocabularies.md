---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-206-vocabularies
section_title: "Vocabularies"
section_number: null
pages: 114-115
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
10.3.1
CvssSeverityType
Summary
Specifies the CVSS base, temporal, threat, or environmental severity type.
102
System Package Data Exchange (SPDX©) v3.0
Description
CvssSeverityType specifies the Common Vulnerability Scoring System (CVSS) severity type, defined in the CVSS specifications
as the textual representation of the numeric CVSS score.
The severity type entries are inclusive of and applicable to enumerations found in Common Vulnerability Scoring System v3.0:
Specification Document81 and Common Vulnerability Scoring System version 4.0: Specification Document82.
CvssSeverityType is a mandatory field because baseSeverity is required in the CVSS 3.0 schema83, CVSS 3.1 schema84, and CVSS
4.0 schema85.
The field can be used to document the base, temporal, threat, or environmental severity.
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/CvssSeverityType
Name:
CvssSeverityType
Entries
critical When a CVSS score is between 9.0 - 10.0
high When a CVSS score is between 7.0 - 8.9
low When a CVSS score is between 0.1 - 3.9
medium When a CVSS score is between 4.0 - 6.9
none When a CVSS score is 0.0
10.3.2
