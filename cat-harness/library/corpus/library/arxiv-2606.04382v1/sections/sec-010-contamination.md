---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-010-contamination
section_title: "Contamination"
section_number: null
pages: 7-7
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
The test answers are released only as SHA-256 hashes
of normalized headings, so scoring is exact and auto-
matic without the answers appearing verbatim. In
the public release, record identifiers (OCLC, LCCN)
are likewise replaced by an opaque hashed key — pre-
serving each work’s stable identity for linking and
scoring without redistributing the source libraries’
identifier numbers in bulk. (The construction repos-
itory retains raw identifiers as a build artifact; the
distinction is between the internal build and the pub-
lished dataset.) We are explicit that the test-answer
hashing is a speed-bump, not a guarantee: because
LCSH is a finite public vocabulary the hashes are
dictionary-attackable, and for real published books
the correct headings already exist in public catalogs
that models train on, so no hashing scheme makes
the holdout contamination-proof.
Genuine control
would require a private evaluation server and records
unlikely to appear in training, with residual risk re-
ported, not assumed away.
The benchmark is ver-
sioned with a cut-off date so the risk can be reasoned
about.
3.10
