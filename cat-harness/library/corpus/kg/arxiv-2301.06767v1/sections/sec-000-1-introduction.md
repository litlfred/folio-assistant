---
doc_id: arxiv-2301.06767v1
doc_title: "The Recent Advances in Automatic Term Extraction: A survey"
section_id: sec-000-1-introduction
section_title: "Introduction"
section_number: 1
pages: 1-3
source_pdf: arxiv-2301.06767v1.pdf
source_sha256: 4bc8757e43cda7d6
toc_source: outline
---
INTRODUCTION
Terms are textual expressions that denote concepts in a specific field of expertise. They are beneficial for several
terminographical tasks performed by linguists, e.g., construction of term dictionaries [60]. Moreover, terms can also
improve several complex downstream natural language processing (NLP) tasks, e.g., information retrieval [62] and
machine translation [106]. Manual term extraction is labor- and time-demanding. Therefore, with the new advances in
machine learning and the recent introduction of novel neural architectures, we observed a push towards automatizing
the task and reducing the time and effort needed to identify terms in domain-specific corpora.
ATE systems usually employ a two-step procedure: (1) extracting a list of candidate terms, and (2) determining which
candidate terms are correct using supervised or unsupervised techniques. Early ATE systems were based on handcrafted
rules and substantial feature engineering effort, which relied on linguistic knowledge and distinctive linguistic aspects
Permission to make digital or hard copies of all or part of this work for personal or classroom use is granted without fee provided that copies are not
made or distributed for profit or commercial advantage and that copies bear this notice and the full citation on the first page. Copyrights for components
of this work owned by others than ACM must be honored. Abstracting with credit is permitted. To copy otherwise, or republish, to post on servers or to
redistribute to lists, requires prior specific permission and/or a fee. Request permissions from permissions@acm.org.
© 2022 Association for Computing Machinery.
Manuscript submitted to ACM
1
arXiv:2301.06767v1  [cs.CL]  17 Jan 2023
ACM Computing Surveys Journal, December 12–24, 2022,
Tran et al.
of terms. They employed several NLP tools, e.g., tokenization, lemmatization, stemming, chunking, and POS tagging.
Next, several other studies opted for a statistical approach based on various measures, such as termhood [101], unithood
[23], or C-value [36]. These strategies are also employed in some current hybrid systems, which rely on combining
linguistic and statistical information.
Inspired by the success of deep neural networks on several NLP tasks, a variety of neural approaches were proposed
for ATE over the past few years, the most popular being the approaches that rely on Transformer-based language
models [100]. Such models are appealing due to two major reasons: (1) they can deduce features themselves, which
dismisses the need for hand-crafted feature engineering; and (2) they typically do not require domain-specific resources
and are thus more domain-independent. Overall, several studies used neural architectures for ATE, by either leveraging
embedding representations as the input for the classifiers [1, 37, 56, 109] or by employing pretrained language models
followed by fine-tuning in the recent NLP transfer learning paradigm [15, 44, 87, 95, 98].
The recent advances in supervised machine learning and deep learning approaches have become more popular
than the unsupervised ones in the context of term extraction. However, while the traditional approaches had been
comprehensively addressed in previous surveys [20, 51], no systematic summary of the improvements made in supervised
term extraction systems using machine learning or deep learning has been proposed yet. Therefore, our paper aims to
provide a comprehensive research trajectory in the supervised term extraction task, including the following aspects.
(1) We survey the resources for term extraction of the past three decades. All the well-annotated corpora are taken
into consideration if the two following requirements are satisfied: (1) they are publicly available, and (2) a
description paper explaining their construction for the term extraction was published;
(2) We propose a systematic review of deep learning-based approaches to the term extraction task (with a specific
focus on the Transformer-based models) and compare them with previous approaches based on feature engi-
neering and shallow supervised learning algorithms. Our comparison analysis highlights the improvements
achieved by neural networks and shows that incorporating some of the insights learned from past work on
feature engineering-based ATE systems can yield further improvements;
(3) We present all the metrics used in term extraction and categorize them based on either indirect (i.e., through
a downstream application) or direct evaluation methodology (i.e., whether the evaluation is human judges,
dictionary-based, or gold standard based) and the scope of results (i.e., whether we evaluate the entire results,
parts of results, or top-k best results);
(4) Incorporating the lessons learned from the existing techniques, we point out the current challenges in correctly
capturing multi-word and nested terms, and in improving the robustness of the term extractor. Based on the
current challenges, we propose some suggestions for further exploration in the term extraction research.
The rest of the survey is organized as follows. Section 2 presents the related surveys of approaches to ATE written
in the last few decades. In Section 3, we introduce our approach to identifying the articles for the survey. Section
4 presents a comparative study of different monolingual and multilingual corpora that can be used for the training
and evaluation of ATE systems. This is followed by a systematic description of different ATE approaches in Section 5,
different evaluation metrics used in ATE in Section 6, and a comparative evaluation of different systems in Section 7.
Based on the current works and the trending technology, we discuss the challenges we are still facing and the possible
future directions in Section 8. Finally, we conclude our work in Section 9.
2
The Recent Advances in Automatic Term Extraction: A survey
ACM Computing Surveys Journal, December 12–24, 2022,
