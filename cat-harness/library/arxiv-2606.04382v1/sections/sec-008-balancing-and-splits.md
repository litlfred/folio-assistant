---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-008-balancing-and-splits
section_title: "Balancing and splits"
section_number: null
pages: 6-6
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
Naively harvested cross-library matches are badly
skewed:
heavily co-collected, uniformly identified
Western art music floods the pool, and a few Euro-
pean languages crowd out the rest. We correct this
at selection by stratified sampling over LC classifica-
tion (round-robin across disciplines with a hard 5%
music cap) and language (explicit per-language tar-
gets and floors). All randomness is driven by a fixed
seed, so builds are reproducible. To avoid letting in-
put scarcity distort which books appear, we select
first and enrich second: books are chosen on consen-
sus, discipline, and language alone, then each chosen
book’s input is completed by merging the longest non-
empty value of each field across its source libraries.
The collection is split, balanced by language, into a
public development set and a held-out test set.
3.8
