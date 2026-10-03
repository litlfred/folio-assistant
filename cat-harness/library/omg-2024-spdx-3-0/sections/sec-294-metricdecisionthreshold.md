---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-294-metricdecisionthreshold
section_title: "metricDecisionThreshold"
section_number: null
pages: 161-162
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
Summary
Captures the threshold that was used for computation of a metric described in the metric field.
Description
Each metric might be computed based on a decision threshold.
For instance, precision or recall is typically computed by checking if the probability of the outcome is larger than 0.5.
Each decision threshold should match with a metric field defined in the AI package.
Metadata
https://spdx.org/rdf/3.0.1/terms/AI/metricDecisionThreshold
Name:
metricDecisionThreshold
Nature:
ObjectProperty
Range:
/Core/DictionaryEntry
Referenced
• /AI/AIPackage
System Package Data Exchange (SPDX©) v3.0
149
15.2.14
