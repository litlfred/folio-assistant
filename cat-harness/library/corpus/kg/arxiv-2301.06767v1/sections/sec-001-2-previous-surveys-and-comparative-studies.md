---
doc_id: arxiv-2301.06767v1
doc_title: "The Recent Advances in Automatic Term Extraction: A survey"
section_id: sec-001-2-previous-surveys-and-comparative-studies
section_title: "Previous surveys and comparative studies"
section_number: 2
pages: 3-4
source_pdf: arxiv-2301.06767v1.pdf
source_sha256: 4bc8757e43cda7d6
toc_source: outline
---
PREVIOUS SURVEYS AND COMPARATIVE STUDIES
The first comprehensive survey of approaches to solving ATE was written by [51]. It provided a systematic overview of
the two major trends in the principles and methods of automatic term recognition and introduced a distinction between
linguistic and statistical approaches. [80] argued that all contemporary algorithms employed linguistic methods as
a filtering step. A decade later, [20] presented a survey of different approaches in automatic term extraction, which
can be divided into three sub-categories: statistical, linguistics, and hybrid (i.e., statistical and linguistic). Furthermore,
they made a brief review of different corpora in different domains that have been used in term extraction, but only for
Brazil Portuguese. Regarding monolingual rich-resourced languages such as English, [5] presented a survey of existing
notions of a term and its linguistic features. They formulated the definition of automatic term extraction, analyzed
available approaches, and proposed a general ATE pipeline consisting of four consecutive steps: preprocessing, term
candidate collecting, term candidate scoring, and term candidate ranking.
Besides these initial survey studies, the systematic comparison of various ATE systems on the same corpora was also
conducted in the scope of several shared tasks and workshops. NTCIR [50] is an evaluation-based project for information
retrieval and term extraction carried out between 1998 and 1999. The term recognition part of this project tackled three
subtasks, including the initial term extraction, keyword extraction, and role analysis tasks. However, this study suffered
from a limited number of participants and the absence of previous evaluation initiatives for computational terminology.
Later, CoRReCT [31] introduced an interesting data set with two proposed systems to detect the candidate terms (i.e.,
FASTR and SYRETE) and a new protocol to evaluate term detection, the so-called controlled indexing. A few years later,
the Campagne d’Evaluation des Systèmes d’Acquisition des Ressources Terminologiques (CESART) [30], presented
term extraction as one of three subtasks with a more user-oriented evaluation. This project proposed an interesting new
protocol for term extraction, including a gold standard list of terms and a corresponding domain-specific acquisition
corpus. This setting is considered as one of the better baseline approaches toward term annotation in the latest term
extraction studies.
The TermEval 2020 shared task on monolingual automatic term extraction, organized as part of the CompuTerm
workshop [87], presented one of the first opportunities to systematically study and compare various term extraction
systems on comparable corpora in English, French, and Dutch from four domains (Corruption, Wind, Equitation, Heart
Failure). The participating systems ranged from traditional approaches based on linguistic and statistical features to
systems based on shallow machine learning and neural networks. While the workshop was an important step forward in
terms of systematic comparison among different methodologies, there is still room for improvement as the open-source
code is not available for most participating systems, hindering their replicability.
As of yet, to the best of our knowledge, there is no comprehensive survey of modern neural network ATE systems, nor
is there a survey that compares systems based on extensive feature engineering and neural systems in both multi-lingual
and multi-domain settings. Recently proposed approaches, which in most cases rely on transferring knowledge from
one domain to another or from one language to another, have not been thoroughly evaluated and a comparison between
these systems and other ATE systems is still lacking.
3
ACM Computing Surveys Journal, December 12–24, 2022,
Tran et al.
