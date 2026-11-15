---
doc_id: arxiv-2301.06767v1
doc_title: "The Recent Advances in Automatic Term Extraction: A survey"
section_id: sec-008-52-deep-learning-approaches
section_title: "Deep learning approaches"
section_number: 5.2
pages: 11-13
source_pdf: arxiv-2301.06767v1.pdf
source_sha256: 4bc8757e43cda7d6
toc_source: outline
---
Deep learning approaches
The use of neural networks, especially language models, to solve ATE, has been gaining a lot of traction recently. Their
application is performed either to just represent the information in the text with word embeddings or to apply a deep
architecture as an end-to-end classifier. In this section, we describe studies that employed any of these two approaches.
5.2.1
Embeddings. The embeddings for term extraction are often pretrained on a large general corpus, and then poten-
tially fine-tuned on specific corpora during classification. The most popular general non-contextual word embeddings
that were used in several ATE studies [2, 56, 59, 111] are GloVe embeddings33 [81]. The second most popular option is
constituted by domain-specific Word2Vec embeddings [75], either employing the CBOW or the skip-gram architecture
[2, 10, 104] and FastText [94].
The first study to successfully apply word embeddings for the ATE task was the one by [1]. The embeddings,
pretrained on a general corpus, were initially used in a filtering step on top of an existing rule-based tool TermoStat [29],
and later as a standalone term extraction tool [2]. Meanwhile, SemRe-Rank [109] made use of Word2vec embeddings to
create semantic relatedness graphs of words, thus computing their “semantic importance” scores. These scores were
then used to revise the base scores of term candidates computed by another ATE algorithm.
Several papers also researched domain-specific embedding representations for ATE usage in a specific field, for
example, as [10]’s research in medicine. Meanwhile, some studies attempted to combine domain-specific and general
embeddings. [2] explored the idea of concatenating general and domain-specific embeddings as an input (in English)
for a Multi-Layer Perceptron (MLP) from the 1M+ token mathematics corpus. Similarly, [43] tested two new (neural)
approaches to exploit general vs. domain-specific comparisons. They used a simple neural network model with pre-
computed Ge-embedding information as input, and a multi-channel model computing the comparison internally. These
embedding concatenation techniques demonstrated that any strategy using both types of embeddings performed better
than the strategies only using either the general or the domain-specific ones.
Considering the importance of general knowledge encoded in the pretrained language model and contextual
information for the downstream task, the employment of several contextual embeddings for the ATE task was proposed.
This is the case, for example, of the (stack) bi-directional Flair embeddings [94] with a neural, character-based language
model from the FlairNLP framework34 for multiple languages that incorporate subword information, and newly adopted
Transformer-based (monolingual and multilingual) embeddings, some of which were already tested in term extraction
(e.g. BERT embeddings [3, 94] and its variants), or the stacked Flair + BERT embeddings [94].
5.2.2
ATE Classifiers. The use of deep neural networks in ATE is not only limited to the generation of embedding
representations. Neural architectures are also used as end-to-end term extractors. Based on the methodology, we can
divide neural extractors into three main types, as demonstrated in Figure 3: (1) sequence classifiers; (2) token classifiers;
and (3) sequence-to-sequence generation models, which are used for several generation tasks (e.g., summarization,
translation, and headline generation).
When deep neural models were first adopted for ATE, ATE was considered as a sequence or binary classification task.
The resulting approaches relied on the positive (is-a-term) and negative (not-a-term) samples, which are generated
from all possible n-grams of a fixed length of a given sentence. TALN-LS2N [44] was the first team to propose this,
using BERT-based language models in the recent ATE challenge TermEval 2020. Their approach outperformed all
classification methods based on feature engineering. They tested different versions of BERT (RoBERTa for the English
33https://nlp.stanford.edu/projects/glove/
34https://github.com/flairNLP/flair
11
ACM Computing Surveys Journal, December 12–24, 2022,
Tran et al.
Fig. 3. An example of how three types of neural ATE classifiers work (from left to right: Sequence classifier (e.g., XLMR); Token
classifier (e.g., BERT); Seq-2-seq (e.g., mBART).
corpus, CamemBERT for the French corpus) as binary classifiers for term prediction. The input consisted of a sentence
and a selected n-gram within the sentence. If the n-gram was a term, the input was labeled as a positive training example,
otherwise as a negative example. Using the same approach and training datasets, [58] improved the performance of the
ATE binary classifier by employing a multilingual version of RoBERTa, the so-called XLM-RoBERTa (or XLM-R, for
short) and compared it with other neural approaches. Although this approach proved to have better predictive power in
comparison with other machine-learning-based approaches, generating all possible n-grams contained in each sentence
across all documents in order to create the training set is computationally expansive and space-demanding. For this
reason, later studies decided to shift from this approach toward sequence labeling or token classification.
The latest trend is the use of language models and sequential methods where the candidate terms are detected in
their original contexts, usually by classifying each token in the text sequence as (part of) a term or not. Thus, instead of
having a label for the whole text sequence, the token classifier assigns a label for each token. This sequence labeling
approach was first tested by [48], who proposed a non-neural conditional random field (CRF) classifier to investigate
the utility of different types of features. [104] introduced co-training—a weakly supervised bootstrapping paradigm
that helps in stabilizing classifier’s predictions—using a long short-term memory (LSTM) network and a convolutional
neural network (CNN). Alternatively, [56] applied a token classifier by taking advantage of recurrent neural networks
(RNN). [40] proposed the CNN-BiLSTM-CRF model to minimize the influence of different word segmentation results on
Chinese term extraction. Another attempt at deep learning based sequential labeling for ATE task is presented in [3].
This study experimented on several models, such as LSTM, BiLSTM, LSTM-CRF, and BiLSTM-CRF, with the FastText
12
The Recent Advances in Automatic Term Extraction: A survey
ACM Computing Surveys Journal, December 12–24, 2022,
and BERT embeddings, to obtain a high evaluation score for ATE in the cybersecurity domain from the less-resourced
Lithuanian language.
Regarding more recent competitions, NLPLab UQAM [59], the team which won in the use of TermEval’s Dutch
corpus, also modeled the task as token classification by applying a bidirectional LSTM (biLSTM) with pretrained
GloVe word embeddings. The monolingual version of D-Terminer [89] and [45] took advantage of the Flair framework
to propose a feature-based strategy that consists in using BERT embeddings as input features for a biLSTM with a
CRF layer. Given the same dataset, [94] made a comparison between the neural sequence-labeling approach and the
traditional feature-based approach, where they proposed the evaluation of three-word embeddings (i.e., FastText, Flair,
and BERT) in monolingual and multilingual settings.
With the advent of Transformer-based models, several pretrained language models have been applied as token
classifiers to boost the extraction performance [45, 58]. Above all, XLM-R [14] was applied and mentioned in several
publications and is now considered a benchmark for several languages [98]. Since this approach operates without
upfront n-gram generation and handles each sentence as a single example that needs to be labeled, it is considerably
more time efficient than the previous sequence classification approach.
Despite the widespread use of Transformer-based sequence-to-sequence generation models for NLP, the adaption of
self-supervised pre-training approaches for ATE has just recently begun to gain traction. [58] was the first to employ the
sequence generation model mBART [64]) to transform the input sentences to sequences of comma-separated terms. This
approach was inspired by the neural machine translation-based ontology learning proposed by [82]. While promising,
the performance and applicability of this approach require additional testing and remain an unsolved issue.
