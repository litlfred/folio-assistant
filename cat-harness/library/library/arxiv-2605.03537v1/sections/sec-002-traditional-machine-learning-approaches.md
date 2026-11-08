---
doc_id: arxiv-2605.03537v1
doc_title: "A Skill-Based Agentic Pipeline for Library of Congress Subject Indexing"
section_id: sec-002-traditional-machine-learning-approaches
section_title: "Traditional Machine Learning Approaches"
section_number: null
pages: 1-2
source_pdf: 2605.03537v1.pdf
source_sha256: 62231fab250d00d0
toc_source: outline
---
Efforts to automate subject indexing predate the current genera-
tion of large language models. National libraries have pursued
machine learning solutions for over a decade, typically framing
the task as an extreme multi-label text classification (XMTC)
problem in which documents must be assigned labels from a
vocabulary of tens or hundreds of thousands of controlled terms
(D’Souza et al., 2026).
The National Library of Estonia developed Kratt, a prototype
automatic subject indexing tool that used page-level logistic
regression classifiers to assign terms from the Estonian Sub-
ject Thesaurus (Asula et al., 2021). Kratt processed books
approximately 10–15 times faster than human catalogers, com-
pleting subject indexing in about one minute per title. How-
ever, professional catalogers rated the quality of the assigned
subjects as unsatisfactory, citing many inaccurate or missing
terms—although a small sample of regular library users found
the results somewhat more useful for discovery. The system’s
training data suffered from severe label sparsity: the median
frequency of unique labels was only 2 across the training set,
meaning most subject terms had too few examples for robust
learning.
The National Library of Finland’s Annif toolkit represents a
more mature approach, combining multiple XMTC algorithms—
including Omikuji/Bonsai (partitioned label trees), MLLM
(lexical matching against controlled vocabulary terms), and
XTransformer (fine-tuned BERT-style models)—into config-
urable ensembles (Suominen et al., 2025). Annif has been
adopted by several European national libraries and supports
multiple languages and vocabularies, demonstrating the adapt-
ability required for production-scale subject classification.
The release of TIB-SID, a bilingual corpus of 136,000 cat-
alog records annotated with GND subjects, has provided a
complementary ML-ready benchmark (D’Souza et al., 2026).
The dataset’s statistical profile reveals the fundamental chal-
lenge: subject vocabularies exhibit extreme long-tail distribu-
tions, with the vast majority of terms appearing in very few
training records. This sparsity problem is structural rather than
incidental—controlled vocabularies are designed to be specific,
1
arXiv:2605.03537v1  [cs.DL]  5 May 2026
which inherently limits the number of works assignable to any
given heading.
1.1.2
