---
doc_id: arxiv-2504.19675v2
doc_title: "Annif at SemEval-2025 Task 5: Traditional XMTC augmented by LLMs"
section_id: sec-000-introduction
section_title: "Introduction"
section_number: null
pages: 1-1
source_pdf: 2504.19675v2.pdf
source_sha256: 5e8e75c26a95847b
toc_source: outline
---
Subject indexing is an important aspect of improv-
ing the discoverability of bibliographic databases
and digital collections. Systems for automating
subject indexing have traditionally been based
on natural language processing (NLP) and tra-
ditional machine learning (ML) methods.
The
rise of generative AI and large language mod-
els (LLMs) holds some promise to revolutionise
many automation tasks, yet producing accurate
subject predictions using LLMs remains elusive
(e.g. (Eric H. C. Chow and Li, 2024), (Martins,
2024)). The LLMs4Subjects challenge (D’Souza
et al., 2025) invited teams to produce innovative
solutions for LLM-based subject indexing using a
data set (D’Souza et al., 2024) based on the bilin-
gual bibliographic database TIBKAT of TIB, the
Leibniz Information Centre for Science and Tech-
nology.
We have been developing the Annif1 multi-
lingual open source automated subject indexing
toolkit since 2017 (Suominen et al., 2022). Our
toolkit is mainly based on traditional NLP and ML
methods. By participating in this task, we aim to
provide a strong baseline using traditional meth-
ods augmented with some LLM-based techniques.
The novel aspects of our work are 1) translating
the subject vocabulary and metadata records using
