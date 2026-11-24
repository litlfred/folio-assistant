---
doc_id: arxiv-2301.06767v1
doc_title: "The Recent Advances in Automatic Term Extraction: A survey"
section_id: sec-007-51-machine-learning-approaches
section_title: "Machine learning approaches"
section_number: 5.1
pages: 9-11
source_pdf: arxiv-2301.06767v1.pdf
source_sha256: 4bc8757e43cda7d6
toc_source: outline
---
Machine learning approaches
Despite several variations in features and models, most supervised machine learning approaches to ATE comply with the
traditional approach, following three principal steps: (1) preprocessing, (2) feature engineering, and (3) term extracting
classifier. In the preprocessing step, some operations are performed on input texts (e.g., sentence segmentation, word
segmentation, and POS tagging) to make the input text ready for further steps. In the feature engineering step, we
describe the candidate terms through several different features (see examples of different types of features in Figure 2).
In the final steps, the features are fed into the machine learning classifiers so that the classifiers can learn from the
training set and use that knowledge to make predictions on new unseen texts.
Due to the relatively low accuracy, these first machine-learning approaches were mostly used to complement
approaches based on hand-crafted rules. This, along with the success of traditional systems (e.g., TermoStat [29]), which
relied on several linguistic and statistical features, lead to the idea of combining different types of information. That
is to say, multiple linguistic and statistical termhood indicators were fed as features to a variety of machine learning
algorithms. While several NLP tools (e.g., tokenization, lemmatization, stemming, chunking, POS tagging, and full
syntactic parsing) are employed in this approach to obtain linguistic profiles of term candidates, numerous statistical
measures are also applied to this approach, including the termhood [101], unithood [23], C-value [36]. Regarding
machine learning algorithms, the most popular algorithms used for ATE include AdaBoost [12], ROGER evolutionary
algorithm [6], RIPPER rule induction [35], CRF++ [48], K-nearest neighbors [86], Logistic Regression [11, 27, 32, 68, 77],
Decision Trees [52], and Support Vector Machines [65].
An example of a machine learning approach employing extensive feature engineering and several classifiers is given
in [16]. In this study, the authors proposed to select statistical and linguistic features and feed them into different
machine learning classifiers (e.g., JRip, Naive Bayes, J48, or SMO from WEKA). Several post-processing steps were
carried out (e.g., word variation standardization, POS annotation, and stopword and punctuation removal) before the
selection of the final candidate terms.
[107] instead proposed a machine learning method with common features (e.g., term frequency, c-value, weirdness)
extracted from the token n-grams (n=1,2,3,4,5) excluding all the stopwords. The selected features were fed into several
different classifiers, namely Random Forest, Linear Support Vector Machine, Multinomial Naive Bayes classifier, Logistic
Regression, and SGD classifiers.
With the advent of the newly annotated ACTER corpora, one of the TALN-LS2N approaches [44] used the combination
of different meaningful information—such as linguistic, stylistic, statistic, and distributional descriptors—to generate
the feature vectors. It then made use of the XGBoost model to learn several classifiers, which were weighted according
to their performance and aggregated iteratively.
9
ACM Computing Surveys Journal, December 12–24, 2022,
Tran et al.
Fig. 2. Feature group and subgroup for machine learning models based on [88]’s work.
The HAMLET approach [88] included a relatively wide range of supervised machine learning methods (e.g., Decision
Tree, Random Forest, Multi-layer Perceptron, and Logistic Regression) and relied on a total of 152 features from six
different feature groups: morphological, frequency-based, statistical, relational and linguistic, and corpus-based. The
Binary Random Forest classifier performed the best out of all tested classifiers.
Furthermore, [78] proposed a new approach that combines probabilistic topic modeling (PTM) and non-negative
matrix factorization (NMF). They compared five different NMF algorithms and four different NMF initializations, and
found optimal combinations of NMF to compare with the extraction baseline (e.g., TF-IDF, RAKE, YAKE, and TextRank).
10
The Recent Advances in Automatic Term Extraction: A survey
ACM Computing Surveys Journal, December 12–24, 2022,
