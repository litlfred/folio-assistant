---
doc_id: omg-2024-spdx-3-0
doc_title: "System Package Data Exchange (SPDX)"
section_id: sec-014-alternate-notation-for-some-conformance-requirem
section_title: "Alternate notation for some conformance requirements"
section_number: null
pages: 16-16
source_pdf: omg-2024-spdx-3-0.pdf
source_sha256: 3041bc8676650ef6
toc_source: outline
---
This standard contains more than a few cardinality assertions, each of which indicates the minimum and maximum number of
times a property may appear. These are represented by using “minCount” and “maxCount” respectively. The absolute minimum
number of occurrences is zero (0), while for an unbounded maximum number of occurrences a star (*) is being used.
Here are some examples:
• minCount: 1
• maxCount: *
• Cardinality: 0..1
• Cardinality: 0..*
• Cardinality: 1..1
• Cardinality: 1..*
Each of these assertions can easily be understood as to whether a feature is required, and if so, how many occurrences are required;
also, whether a feature is permitted, and if so, in what number. As this is the format long familiar to the SPDX community, it has
been preserved in this specification.
5.2
