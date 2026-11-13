---
doc_id: arxiv-2301.06767v1
doc_title: "The Recent Advances in Automatic Term Extraction: A survey"
section_id: sec-012-7-comparative-results
section_title: "Comparative results"
section_number: 7
pages: 17-19
source_pdf: arxiv-2301.06767v1.pdf
source_sha256: 4bc8757e43cda7d6
toc_source: outline
---
COMPARATIVE RESULTS
Since term extraction methods vary greatly in regard to definition, corpora, domains, languages, and evaluation metrics,
a comparative evaluation of term extraction methods is hardly achievable. Nevertheless, in this section, we propose to
measure the performance of several ATE systems by comparing the candidate term list extracted on the whole test set
level with the manually annotated gold standard of each domain using a strictly matching F1-score. All approaches are
applied to the newest and the most popular up-to-date ATE corpus, namely the ACTER dataset. We chose this dataset
for evaluation because it is the most systematically annotated corpus that covers multiple languages and domains,
and that also contains available up-to-date documentation and transparent annotation guidelines. The results of the
evaluation are presented in Table 3, including both the approaches evaluated on the ACTER dataset in the related work
(non-neural models and some deep learning models) and our own experiments on the same dataset.
Note that deep learning-based approaches are divided into three different categories based on how they took
advantage of languages in the training corpus. While monolingual deep learning models use a single language for
training and predict on the new unseen data from the same language, multilingual deep learning models are fine-tuned
on multiple languages at once (e.g., on a combination of English, French, and Dutch data in the ACTER corpus) and
generate a prediction on the new unseen data from all the languages. Finally, cross-lingual deep learning models are
trained on one (or more) languages and generate predictions on unseen data from a new language that the model did
not encounter during the training.
TALN-LS2N, RACAI, NYU, e-Terminology, and NLPLab_UQAM were all competitors in the TermEval 2020 shared
task on the ACTER dataset [87]. The TALN-LS2N approach is the winning solution on the English and French datasets,
whereas NLPLab_UQAM is the winning team on the Dutch corpus. While RACAI, NYU, and e-Terminology rely on
feature engineering and statistical approaches, TALN-LS2N and NLPLab UQAM applied neural network-based models.
After the competition, several new approaches were developed. For example, HAMLET is a novel supervised method
inspired by traditional hybrid systems such as TermoStat. Furthermore, [78] combined probabilistic topic modeling
(PTM) and non-negative matrix factorization (NMF), and the optimal combinations of NMF outperformed four baseline
extraction methods (e.g., TF-IDF, RAKE, YAKE, and TextRank). All the described approaches were implemented on the
ACTER dataset of version 1.2, which was first released by the shared task competition. However, none of them had
considered the problem as a token-level sequence labeling task and had taken advantage of the Transformer-based
models, until the novel approach from [58, 98] and [98].
[58] proposed a comprehensive comparison between three Transformer-based ATE models operating on the sentence
level: token classification (sequence labeling task), sequence classification, and sequence-to-sequence generation. This
proved three points. First, the superiority of token classification in terms of performance, which, therefore, affirmed
itself as the state-of-the-art (SOTA) with regard to the ACTER dataset. Second, the multilingual models perform better
17
ACM Computing Surveys Journal, December 12–24, 2022,
Tran et al.
Table 3. The F1-score evaluation of benchmark approaches on the Heart Failure test set from the ACTER corpus in three languages
(English (EN), French (FR), and Dutch (NL)) and two types of annotation, with named entities (NER) and without named entities
(ANN). The best approach for each category is highlighted in bold.
Methods
ACTER
ANN
NES
Non-neural models
EN
FR
NL
EN
FR
NL
RACAI [87]
39.3
-
-
41.3
-
-
e-Terminology [87]
21.4
20.6
15.3
20.1
19.7
14.4
NYU [87]
31.5
-
-
30.6
-
-
HAMLET [88]
54.2
60.2
66.1
55.4
60.8
66.0
Feature-based XGBoost [45]
-
-
-
33.6
50.9
34.1
NMF [78]
33.5
30.9
30.1
33.7
30.7
30.3
Monolingual deep learning models
TALN-LS2N [44]
45.0
45.9
-
46.7
48.1
-
NLPLab UQAM [59]
17.8
12.9
18.6
18.1
13.2
18.7
XLM-R sequence Classifier [58]
-
-
-
45.2
46.0
48.5
XLM-R Token Classifier [58]
-
-
-
58.3
52.9
69.6
mBART NMT [58]
-
-
-
53.2
55.9
65.2
Vanilla-biLSTM-CRF [45]
-
-
-
8.17
6.53
7.50
BERT [45]
-
-
-
48.2
-
-
CamemBERT [45]
-
-
-
-
51.1
-
BERT (NER) [45]
-
-
-
37.4
-
51.0
CamemBERT (NER) [45]
-
-
-
-
51.1
-
BERT-biLSTM-CRF [45]
-
-
-
29.5
25.6
27.4
mBERT [45]
-
-
-
45.8
47.2
-
ALBERT [96]
49.9
-
-
54.5
-
-
DistilBERT [96]
46.5
-
-
53.9
-
-
ELECTRA [96]
51.2
-
-
52.2
-
-
RoBERTa [96]
54.3
-
-
59.1
-
-
XLNet [96]
55.2
-
-
57.8
-
-
FlauBERTa [96]
-
38.9
-
-
51.4
-
Dutch BERT [96]
-
-
65.6
-
-
66.8
robBERTa [96]
-
-
48.2
-
-
62.2
robBERTa-v2 [96]
-
-
48.3
-
-
63.4
mInfoXLM [96]
56.1
50.4
68.5
57.6
58.0
68.6
mBERT [96]
43.0
48.4
66.3
55.0
57.4
67.8
mDistilBERT [96]
49.8
51.9
65.3
55.6
55.8
67.8
Multilingual deep learning models
XLM-R Sequence Classifier [58]
-
-
-
46.0
46.7
56.0
XLM-R Token Classifier [58]
-
-
-
56.2
55.3
67.8
mBART NMT [58]
-
-
-
55.3
57.6
64.9
mBERT [45]
-
-
-
45.4
44.9
51.0
Cross-lingual deep learning models
XLM-R Sequence Classifier [58]
-
-
-
44.7
48.1
58.0
XLM-R Token Classifier [58]
-
-
-
58.3
57.6
69.8
mBART NMT [58]
-
-
-
55.2
57.4
59.6
XLM-R Token Classifier [95]
56.0
59.9
68.5
58.0
61.1
68.3
18
The Recent Advances in Automatic Term Extraction: A survey
ACM Computing Surveys Journal, December 12–24, 2022,
than the monolingual ones. Third, zero-shot learning shows good potential in extracting the candidate terms in new
unseen languages and domains. [96] extended this research with an empirical evaluation of several monolingual and
multilingual Transformer-based language models, including both masked (e.g., BERT and its variants) and autoregressive
(e.g., XLNet) models, on the cross-domain ATE tasks with additional ensembling two best classifiers to optimize the
Recall. Their approaches were applied to the ACTER dataset of version 1.5. However, there were not many changes to
actual annotations, but major updates to how the annotations were presented.
Most deep learning based approaches also proved to be very competitive and surpassed the performance of most
non-neural methods by a large margin on all languages and annotation types. [58] and [98] also showcased the potential
of cross-lingual learning when considering ATE tasks as a token classification problem. These approaches currently
represent the new state-of-the-art methods regarding most languages in the ACTER corpus.
