---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-007-consensus-views-and-cleaning
section_title: "Consensus views and cleaning"
section_number: null
pages: 6-6
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
Heading by heading, a heading asserted by 𝑣of
the 𝑛libraries that hold a book (its vote, Equa-
tion 1) is tiered unanimous if 𝑣= 𝑛, single if
𝑣= 1, and majority otherwise; from which we re-
lease three answer-key views: per-catalog (the raw
evidence), merged/union (the default; rewards find-
ing any heading a professional used), and unanimous
(the strictest, highest-confidence view).
Headings
are cleaned by discarding MARC-machinery artifacts
(strings whose base matches a ^\d{3}[-/] field-tag
pattern) and by canonical normalization before any
comparison: NFC, lower-casing, -- separator canon-
icalisation, whitespace collapse, and trailing-period
stripping — so systems are judged on substance, not
typography.
3.7
