---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-198-probability
section_title: "probability"
section_number: null
pages: 111-112
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Description
The percentile between 0 and 1 (0 and 100%) of the current probability score, the proportion of all scored vulnerabilities with the
same or a lower probability score. The definition follows “percentile” in EPSS Data77.
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/percentile
Name:
percentile
Nature:
DataProperty
Range:
xsd:decimal
Referenced
• /Security/EpssVulnAssessmentRelationship
10.2.13
probability
Summary
A probability score between 0 and 1 of a vulnerability being exploited.
77https://www.first.org/epss/data_stats
System Package Data Exchange (SPDX©) v3.0
99
Description
The probability score between 0 and 1 (0 and 100%) estimating the likelihood of exploitation in the wild in the next 30 days
(following score publication). The definition follows “epss” in EPSS Data78.
Metadata
https://spdx.org/rdf/3.0.1/terms/Security/probability
Name:
probability
Nature:
DataProperty
Range:
xsd:decimal
Referenced
• /Security/EpssVulnAssessmentRelationship
10.2.14
