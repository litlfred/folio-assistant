---
doc_id: arxiv-2504.19675v2
doc_title: "Annif at SemEval-2025 Task 5: Traditional XMTC augmented by LLMs"
section_id: sec-003-system-overview
section_title: "System overview"
section_number: null
pages: 2-2
source_pdf: 2504.19675v2.pdf
source_sha256: 5e8e75c26a95847b
toc_source: outline
---
We based our system on the Annif automated sub-
ject indexing toolkit. It provides a selection of
XMTC algorithms as configurable backends which
can be used for subject indexing by setting up
projects that define the vocabulary and specific con-
figuration settings of a backend.
We chose three Annif backends for this task: 1)
Omikuji5, an implementation of a family of effi-
cient machine learning algorithms for multilabel
classification based on the idea of partitioned la-
bel trees, including Parabel (Prabhu et al., 2018)
and Bonsai (Khandagale et al., 2020). We used the
Bonsai-style configuration. 2) MLLM6 (Maui-like
Lexical Matching), a lexical algorithm for match-
ing words and expressions in document text to
terms in a subject vocabulary. It is a reimplemen-
tation of the ideas behind Maui (Medelyan, 2009),
an earlier tool for automated subject indexing that
uses heuristic features and a small machine learn-
ing model to select the best performing heuristics.
3) XTransformer, an XMTC and ranking algo-
rithm based on fine-tuned BERT-style Transformer
models that is part of the PECOS framework (Yu
4We found that the records for different types were similar
in their structure and their titles and abstracts often contained
a mixture of languages regardless of the indicated language.
5https://github.com/tomtung/omikuji
6https://github.com/NatLibFi/Annif/wiki/
Backend%3A-MLLM
et al., 2022). Its Annif integration is experimental
and was refined in the process of this task. We used
FacebookAI/xlm-roberta-base as the base model.
Combinations of XMTC algorithms, called en-
sembles, often outperform individual algorithms.
We combined the base backends that return lists
of suggested subjects along with numeric scores
into two kinds of ensembles: simple ensembles
that merge subjects suggestions from two or more
backends by averaging their scores, and neural en-
sembles that, in addition to averaging scores, also
involve training a neural network model that adjusts
the subject scores, for example suppressing sub-
jects that are frequently wrongly suggested (false
positives).
3.1
