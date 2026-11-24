---
doc_id: arxiv-2301.06767v1
doc_title: "The Recent Advances in Automatic Term Extraction: A survey"
section_id: sec-016-83-ensembling
section_title: "Ensembling"
section_number: 8.3
pages: 20-20
source_pdf: arxiv-2301.06767v1.pdf
source_sha256: 4bc8757e43cda7d6
toc_source: outline
---
Ensembling
Deep neural networks based on pretrained language models have a strong predictive power on downstream tasks (e.g.,
term extraction), and can be fed raw data directly, without any feature engineering required. However, linguistic and
statistical measures of termhoodness can still contribute to the research on ATE, by being added to neural models
as additional features with the aim of boosting performance. The integration of models with different combinations
of non-contextual features, contextual features from language models, and linguistics and statistical measures (e.g.,
termhood, unithood, C-value) should be investigated. Furthermore, [96] presented the potential of ensembling two best
classifiers by simply performing the union operation on the candidate term lists of the best two classifiers. Further
ensembling techniques should be employed to enhance the performance in Recall and by extension in F1-score.
