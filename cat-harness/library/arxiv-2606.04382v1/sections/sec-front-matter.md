---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-front-matter
section_title: "Front matter"
section_number: null
pages: 1-1
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
LCSHBench: A Multilingual, Consensus-Grounded Benchmark for
Library of Congress Subject Heading Assignment
Kwok Leong Tang
2026-06-01
Abstract
Automated subject cataloging assigns controlled-
vocabulary headings to bibliographic records, but
LCSH has no standard public benchmark. We intro-
duce LCSHBench: 22,346 books in 15 languages from
the openly licensed Harvard, Columbia, and Prince-
ton catalogs. Records enter only when at least two
independent cataloging agencies assigned LCSH; we
release per-catalog provenance plus union and unani-
mous answer views. A concordance study of 465,187
works cataloged by all three libraries shows why this
design matters: libraries usually agree on the under-
lying topic (93.3% share a concept-level heading) but
often differ in exact expression (39.4% have identical
heading sets). LCSHBench therefore scores both ex-
act and concept matches, with set and rank metrics
broken down by language and heading type, across
open-vocabulary generation and full-vocabulary re-
trieval. As a first demonstration, a low-rank fine-tune
of a 300M on-device embedder improves cross-lingual
retrieval and beats a 3,072-dimensional hosted em-
bedder on development exact recall@200 (0.659 vs
0.623). The language panel shows the gain is not uni-
form, and held-out-test and end-to-end confirmation
remain future work.
1
