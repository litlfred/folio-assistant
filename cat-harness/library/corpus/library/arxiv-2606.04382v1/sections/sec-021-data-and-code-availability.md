---
doc_id: arxiv-2606.04382v1
doc_title: "LCSHBench: A Multilingual, Consensus-Grounded Benchmark for Library of Congress Subject Heading Assignment"
section_id: sec-021-data-and-code-availability
section_title: "Data and code availability"
section_number: null
pages: 12-12
source_pdf: 2606.04382v1.pdf
source_sha256: da73a6e55e0d9c9c
toc_source: outline
---
The LCSHBench v1.0 dataset — development and
held-out test splits, the language-balanced evaluation
subset, the full inter-cataloger concordance popula-
tion, and the retrieval vocabulary — is available on
the Hugging Face Hub at https://huggingface.co
/datasets/kltng/lcshbench. The scorer, baselines,
fine-tuning recipe, leakage audit, and the full extrac-
tion and release pipeline are at https://github.com
/kltng/lcshbench. Held-out test answers are released
only as SHA-256 hashes, and record identifiers are
anonymized in the public release; all randomness is
seed-driven, so reported results reproduce exactly.
