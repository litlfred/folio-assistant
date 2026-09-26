---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-020-conclusion
section_title: "Conclusion"
section_number: null
pages: 11-12
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
LCSHBench provides the missing standard exam for
an important, hitherto unmeasurable task: multilin-
gual subject-heading assignment against the Library
of Congress vocabulary. Its design choices — inde-
pendent multi-catalog consensus, full-vocabulary re-
trieval rather than a frozen pool, provenance-filtered
ground truth, and a metric panel in place of a head-
line F1 — are grounded rather than incidental: the
concordance analysis shows why a consensus tar-
get and concept-level metrics are needed, and every
leaderboard result has a per-cell counter-reading that
a single aggregate would hide.
A standard exam is most useful when it does not
merely rank systems but tells you how to improve
them. Ours points the way: its per-language panel
localized cross-lingual alignment as the first-stage
bottleneck, and acting on that diagnosis — a sub-
dollar, fully reproducible low-rank fine-tune trained
on records held disjoint from the evaluation subset
— lifted a fully on-device 300M model past a hosted
11
commercial embedder of much larger dimension on
first-stage exact recall, specifically by closing the
cross-lingual gap. We report that as a development-
subset demonstration that the exam is actionable,
with held-out-test and end-to-end confirmation left
as future work; the benchmark’s value does not rest
on it. We release the data, scorer, baselines, the fine-
tune recipe and its leakage audit, and all seeds to-
gether, so that the field can — for the first time —
compare, and improve, LCSH cataloging systems on
equal terms.
