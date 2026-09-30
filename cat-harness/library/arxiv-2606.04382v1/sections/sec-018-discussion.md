---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-018-discussion
section_title: "Discussion"
section_number: null
pages: 10-11
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
Cataloging is reproducible about topic,
variable
about expression — and that shapes everything. The
concordance analysis in Section 3.3 reframes the folk
view that subject assignment is “subjective.”
It is,
but at a specific layer: three independent libraries
converge on what a book is about (concept agree-
ment 93.3%) while differing on how to say it (exact-
identical 39.4%). This is why a single library’s head-
ings make a noisy gold standard, why a consensus
target is worth the construction cost, and why exact
match alone is the wrong yardstick — it penalizes a
model for a subdivision choice that two professional
catalogers would themselves have made differently.
The exact/concept metric split is not methodological
hedging; it mirrors the structure of expert disagree-
ment.
Human agreement is a reference, not a retrieval ceil-
ing. A human cataloger reproduces only ~87% (exact)
/ 93% (concept) of peers’ consensus (Equation 2), so
a system’s “misses” should not all be read against
a perfect 100%: a non-trivial share are headings a
second cataloger would also have omitted.
We de-
liberately do not call this a ceiling for recall@200 —
a retriever is allowed 200 ranked candidates while a
cataloger supplies a short final set, so the agreement
reference and the retrieval numbers (e.g. FT exact
recall@200 0.659) measure different things.
On-device cataloging support is viable.
A 256-
dimensional, 300M-parameter embedder that runs
with no network and no per-query cost out-retrieves
a hosted commercial API on exact recall, after a sub-
dollar fine-tune. For libraries with privacy, cost, or
connectivity constraints, that is a practically mean-
ingful result — with the caveat (Table 3) that the
hosted model remains preferable for predominantly
English collections.
The panel earns its keep. Every headline in this study
has a counter-reading one cell away: the fine-tune
wins exact but not concept, wins cross-lingual but
10
not English. A benchmark reporting a single aggre-
gate F1 would have asserted a clean victory and been
wrong about its shape.
6
