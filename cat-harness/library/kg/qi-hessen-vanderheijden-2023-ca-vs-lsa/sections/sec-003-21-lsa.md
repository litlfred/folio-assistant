---
doc_id: qi-hessen-vanderheijden-2023-ca-vs-lsa
doc_title: "RESEARCH Improving information retrieval through correspondence analysis instead of latent semantic analysis Qianqian Qi1 · David J. Hessen1 · Peter G.M. van der Heijden1,2 © The A"
section_id: sec-003-21-lsa
section_title: "LSA"
section_number: 2.1
pages: 2-3
source_pdf: qi-hessen-vanderheijden-2023-ca-vs-lsa.pdf
source_sha256: c1816a290472bb83
toc_source: outline
---
2019; Duan et al., 2021; Chang et al., 2021). Compared to Word2Vec (Skip-Gram model)
LSA showed a better performance in extracting relevant semantic patterns in dream reports
(Altszyler et al., 2016). LSA also outperformed neural network methods (such as ELMo
word embeddings) in text classiﬁcation tasks for educational data (Phillips et al., 2021).
New methods that rely on LSA have been proposed (Azmi et al., 2019; Gupta & Patel,
2021; Hassani et al., 2021; Suleman & Korkontzelos, 2021; Horasan, 2022; Patil, 2022).
For example, Gupta and Patel (2021) proposed an algorithm for text summarization that
uses LSA, TF-IDF keyword extractor, and BERT encoder model. The algorithm performed
better than latentDirichletallocation. Horasan (2022) proposed a collaborative ﬁltering-based
recommendation system using LSA and achieved good performance. Patil (2022) developed
a new promising procedure for information retrieval using LSA and TF-IDF.
Weighting the elements of the raw document-term matrix is a common and effective
method to improve the performance of LSA (Dumais, 1991; Horasan et al., 2019; Bacciu
et al., 2019). LSA usually involves the SVD of a raw or pre-processed document-term matrix.
In addition, Caron (2001) proposed changing the weighting exponent of the singular values
in LSA to improve information retrieval. His results showed that adjusting the weighting
exponent of singular values improves the performance of information retrieval. Since Caron
(2001), singular value weighting exponents have been studied and applied in word embed-
dings generated from word-context matrices (Bullinaria & Levy, 2012; Österlund et al., 2015;
Drozd et al., 2016; Yin & Shen, 2018). Other variants that change the singular value weight-
ing exponent have been studied in word embeddings created by Word2Vec and GloVe (Mu
& Viswanath, 2018; Liu et al., 2019).
The larger the weighting exponent of the singular values, the higher is the emphasis given
to the initial dimensions. According to the experimental results of Caron (2001), giving more
emphasis to initial dimensions can often improve the performance of information retrieval on
standard test datasets, whereas giving more emphasis to initial dimensions can decrease the
performance on question/answer matching. Papers about word embeddings tend to reduce
the contribution of initial dimensions to improve performance (Bullinaria & Levy, 2012;
Österlund et al., 2015; Drozd et al., 2016; Yin & Shen, 2018; Mu & Viswanath, 2018; Liu
et al., 2019), although the optimal value of the singular value weighting exponent is task
dependent (Österlund et al., 2015). Bullinaria and Levy (2012) reported that assigning less
weight to initial dimensions leads to improved performance for TOEFL, distance comparison,
semantic categorization, and clustering purity tasks on a word-context matrix created from
the ukWaC corpus (Baroni et al., 2009). They argued that the general pattern appears to be
that the initial dimensions tend not to contribute the most useful information about semantics
and have a large “noise” component that is best removed or reduced.
Capturing associations between documents and terms appears necessary for the success
of LSA in computing science; however, the solution of LSA is a mix of the associations
between documents and terms, and marginal effects arising from the lengths of documents
and marginal frequencies of terms (Qi et al., 2023). Hu et al. (2003) and Qi et al. (2023)
showed that margins play an important role in the ﬁrst dimensions extracted by LSA.
Correspondence analysis (CA) is another information retrieval technique that uses SVD
(Greenacre, 1984; Morin, 2004; Greenacre, 2017; Beh & Lombardo, 2021). In computing
science, CA has not been explored as much as LSA. CA is usually used to make two-
dimensional graphical displays (Hou et al., 2020; Arenas-Márquez et al., 2021; Van Dam
et al., 2021). For example, Arenas-Márquez et al. (2021) depicted a biplot using CA to show
that the document encoding of convolutional neural encoder can emphasize the dissimilarity
between documents belonging to different classes. Unlike LSA, CA ignores the information
123
Journal of Intelligent Information Systems
on marginal frequency differences between documents and between terms from the solution
by preprocessing the data, and it only focuses on the relationships between documents and
terms (Qi et al., 2023). Thus, CA seems more suitable for information retrieval.
