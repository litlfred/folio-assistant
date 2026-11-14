---
doc_id: arxiv-2301.06767v1
doc_title: "The Recent Advances in Automatic Term Extraction: A survey"
section_id: sec-019-9-conclusion
section_title: "Conclusion"
section_number: 9
pages: 20-21
source_pdf: arxiv-2301.06767v1.pdf
source_sha256: 4bc8757e43cda7d6
toc_source: outline
---
CONCLUSION
Our survey summarizes the recent advances in the automatic term extraction task, covering both classic machine
learning models based on feature engineering and novel neural network models that have yielded several important
insights, especially with the advent of pretrained language models. We first surveyed different resources and presented a
20
The Recent Advances in Automatic Term Extraction: A survey
ACM Computing Surveys Journal, December 12–24, 2022,
systematic list of well-annotated monolingual and multilingual corpora for term extraction from the past three decades.
Then, we presented the first systematic summary of deep learning-based approaches and made a comparison of their
performance in supervised term extraction to machine learning based approaches. Furthermore, we indicated all the
metrics used in term extraction and categorized them based on the evaluation methodology and the scope of results.
Incorporating the lessons learned from the existing techniques, we pointed out the current challenges and proposed
some suggestions for further exploration in the term extraction research.
The main findings of this survey are that neural models generally outperform machine learning models based
on feature engineering by a large margin and that Transformer-based cross-domain and cross-lingual models tend
to perform really well, establishing new state-of-the-art methods on the benchmark ACTER dataset. When three
types of Transformer-based ATE models were implemented to operate on the sentence level, the superiority of token
classification in terms of performance affirmed itself even in cross-domain or cross-lingual in comparison with the
monolingual setting. Despite monolingual language models (e.g, SloBERTa) on less-resourced languages (e.g., Slovenian)
captured the information about terms than multilingual ones (e.g., multilingual BERT) if named entities are not included,
multilingual ones outperform the others for extracting terms with entities and adding more data from other languages
to the train set that matches the target language improves the predictive performance of the model. The zero-shot
learning shows good potential in extracting the candidate terms in new unseen languages and domains.
