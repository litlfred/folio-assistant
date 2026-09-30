---
doc_id: arxiv-2504.19675v2
doc_title: "Annif at SemEval-2025 Task 5: Traditional XMTC augmented by LLMs"
section_id: sec-001-synthetic-training-data
section_title: "Synthetic training data"
section_number: null
pages: 1-1
source_pdf: 2504.19675v2.pdf
source_sha256: 5e8e75c26a95847b
toc_source: outline
---
LLMs, 3) including XTransformer in an ensemble
of algorithms, and 4) generating suggestions us-
ing separate monolingual prediction pipelines and
merging their results.
Our system ranked 1st in the all-subjects cate-
gory and 2nd in the tib-core-subjects category in the
quantitative evaluation. It was ranked 4th in qualita-
tive evaluations. We discovered that our approach,
based mainly on traditional NLP and ML, remains
competitive against other systems that make heav-
ier use of LLMs. We also found ways to efficiently
translate bibliographic records and to produce ad-
ditional synthetic training data using LLMs.
Our code, configuration files and customised
data sets are available on GitHub2. The models
we trained are available on Hugging Face Hub3.
2
