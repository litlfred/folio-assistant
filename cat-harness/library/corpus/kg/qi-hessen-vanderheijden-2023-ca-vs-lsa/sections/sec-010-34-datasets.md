---
doc_id: qi-hessen-vanderheijden-2023-ca-vs-lsa
doc_title: "RESEARCH Improving information retrieval through correspondence analysis instead of latent semantic analysis Qianqian Qi1 · David J. Hessen1 · Peter G.M. van der Heijden1,2 © The A"
section_id: sec-010-34-datasets
section_title: "Datasets"
section_number: 3.4
pages: 9-10
source_pdf: qi-hessen-vanderheijden-2023-ca-vs-lsa.pdf
source_sha256: c1816a290472bb83
toc_source: outline
---
LSA and CA are compared using three English datasets and one Dutch dataset. The three
English datasets are the BBCSport (Greene & Cunningham, 2017), BBCNews (Greene &
Cunningham, 2017), and 20 Newsgroups datasets (20-news-18846 bydata version) (Rennie,
2005). The Dutch dataset is the Wilhelmus dataset (Kestemont et al., 2017). The three English
datasets have recently been used in information retrieval studies (Bounabi et al., 2019; Bianco
et al., 2023). The Wilhelmus dataset is produced for studying authorship attribution of the
song Wilhelmus, which is the national anthem of the Netherlands. The author of the song is
unknown.
Some statistics of the four datasets used are presented in Table 3. The BBCNews dataset
includes 2,225 documents that fall into one of ﬁve categories. The BBCSport dataset includes
731 documents that fall into one of ﬁve categories. The 20 Newsgroups dataset includes
18,846 documents that fall into one of 20 categories. This dataset is sorted into a training
(60%) and a test (40%) set. We use a subset of this dataset to evaluate information retrieval.
We randomly choose 600 documents from the training set of four categories (comp.graphics,
rec.sport.hockey, sci.crypt, and talk.politics.guns) and 400 documents from the test set of
these four categories. The Wilhelmus dataset includes 186 documents divided into six cate-
gories.
To pre-process the three English datasets, we change all characters to lower case, remove
punctuation marks, numbers, and stop words, and apply lemmatization. Subsequently, terms
with frequencies lower than 10 are ignored. In addition, we remove unwanted parts of the
20 Newsgroups dataset, such as the header (including ﬁelds like “From:” and “Reply-To:”
followed by email address), because these are almost irrelevant for information retrieval. The
Dutch Wilhelmus dataset is already pre-processed into tag-lemma pairs. Following Kestemont
et al. (2017) and Qi et al. (2023), in Wilhelmus dataset, we use the 300 most frequent tag-
lemma pairs.
Table 3 Characteristics of datasets
Categories
Data
Categories
Data
business
510
athletics
101
entertainment
386
cricket
124
politics
417
football”
265
sport
511
rugby”
147
technology
401
tennis
100
(a) BBCNews dataset.
(b) BBCSport dataset.
Categories
Training data
Test data
Categories
Data
comp.graphics
141
100
datheen
35
rec.sport.hockey
164
99
marnix
46
sci.crypt
161
106
heere
23
talk.politics.guns
134
95
haecht
35
fruytiers
33
coornhert
14
(c) 20 Newsgroups dataset.
(d) Wilhelmus dataset.
123
Journal of Intelligent Information Systems
Since the Wilhelmus and BBCSport datasets have a relatively low number of documents,
we use leave-one-out cross-validation (LOOCV) for the Wilhelmus dataset and ﬁve-fold
cross-validation for the BBCSport dataset to evaluate LSA and CA (Gareth et al., 2021). The
BBCNews dataset is randomly divided into training (80%) and validation (20%) sets.
In the information retrieval part of the study, each document in the validation set is used
as a query, where the category of the document is known. The documents in the training set
that fall in the same category as the query are the relevant documents for this query.
