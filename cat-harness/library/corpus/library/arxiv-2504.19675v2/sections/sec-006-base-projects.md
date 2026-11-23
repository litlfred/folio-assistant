---
doc_id: arxiv-2504.19675v2
doc_title: "Annif at SemEval-2025 Task 5: Traditional XMTC augmented by LLMs"
section_id: sec-006-base-projects
section_title: "Base projects"
section_number: null
pages: 3-3
source_pdf: 2504.19675v2.pdf
source_sha256: 5e8e75c26a95847b
toc_source: outline
---
uation scores, measured against the development
set, by exploring various approaches and settings.
Once satisfied with the performance of the base
projects, we combined them into ensembles that
were finally used to produce our system output.
For evaluation during system development, we
used two common XMTC metrics built in to the
Annif toolkit: F1@5 (F1 score calculated using the
top 5 suggestions from the system) and nDCG@10
(Normalised Discounted Cumulative Gain (Järvelin
and Kekäläinen, 2002), a ranking metric calculated
using the top 10 suggestions from the system).
4.1
Base projects
We set up parallel independent sets of Annif
projects for the all-subjects data set and the tib-
core-subjects data set. We also configured separate
projects for English and German. To simplify the
resulting combinatorial explosion of project config-
urations, we used the Data Version Control7 tool
to manage the data sets, project configurations as
well as the training and evaluation processes.
For each of the four combinations (2 GND vari-
ants × 2 languages), we set up three Annif base
projects: (Omikuji) Bonsai, MLLM and XTrans-
former (abbreviated as XTrans in tables).
We
trained each project on the LLM-translated mono-
lingual records from the train set (German-only or
English-only, matching the project language).
We also tested different hyperparameters. For
each base project, we chose either Snowball stem-
ming or Simplemma lemmatisation for text pre-
processing. For the Bonsai projects we enabled
bigram features using the ngram=2 setting and set
a min_df value of 2 to 5 to filter features that occur
rarely in the training data. For the XTransformer
7https://dvc.org/
projects we manually searched for model-specific
hyperparameters. The final hyperparameters can be
seen in the project configuration files on GitHub8
4.2
