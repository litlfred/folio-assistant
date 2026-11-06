---
doc_id: qi-hessen-vanderheijden-2023-ca-vs-lsa
doc_title: "RESEARCH Improving information retrieval through correspondence analysis instead of latent semantic analysis Qianqian Qi1 · David J. Hessen1 · Peter G.M. van der Heijden1,2 © The A"
section_id: sec-004-2-lsa-and-ca
section_title: "LSA and CA"
section_number: 2
pages: 3-4
source_pdf: qi-hessen-vanderheijden-2023-ca-vs-lsa.pdf
source_sha256: c1816a290472bb83
toc_source: outline
---
text clustering and text categorization, respectively, and they found that CA performed better
than LSA. Although LSA was originally proposed for information retrieval, an empirical
comparison between LSA and CA continues to remain lacking in this ﬁeld. In this paper,
therefore, three English datasets and one Dutch dataset are used to compare the performance
of LSA and CA in information retrieval.
Whereas LSA owes its popularity to its applicability to different matrices, in CA, it
is unusual to weight the elements of the raw document-term matrix. Processing the raw
document-term matrix is an integral part of CA (Greenacre, 1984, 2017; Beh & Lombardo,
2021). CA is based on the SVD of the matrix of standardized residuals. Here, however, we
study the CA of document-term matrices whose entries are weighted to see if this has an
impact on the performance of CA. In addition, based on the success of adjusting the weight-
ing exponent of singular values in LSA, we will explore whether this is also successful in
CA.
In summary, this work makes three contributions. First, to compare LSA and CA in
information retrieval. Second, to explore whether weightings, including the weighting of the
elements of the raw document-term matrix and the adjusting of the singular value weighting
exponent, can improve the performance of CA. Third, to study what the initial dimensions of
LSA correspond to and whether CA is effective in ignoring the useless information in the raw
or pre-processed document-term matrix that contributes a large part of the initial dimensions
extracted by LSA. We extensively compare the performances of LSA and CA applied to four
datasets using Euclidean distance, dot similarity, and cosine similarity.
The paper is organized as follows. In Section 2, LSA and CA are described in brief.
Section 3 presents the methodology used in this paper. The results for Euclidean distance are
presented in Section 4, and the results for dot similarity and cosine similarity are presented
in Section 5. Finally, Section 6 concludes and discusses the results.
2 LSA and CA
In this section, we brieﬂy describe LSA and CA. We refer the readers to Qi et al. (2023) for
a more detailed presentation of the methods.
2.1 LSA
Consider a raw document-term matrix F = [ fi j] with m rows (i = 1, ..., m) and n columns
( j = 1, ..., n), where the rows represent documents and the columns represent terms. Weight-
ing might be used to prevent the differential lengths of documents from considerably affecting
the representation, or to impose certain preconceptions about which terms are more important
(Deerwester et al., 1990). The weighted element ai j for term j in document i is
ai j = L(i, j) × G( j) × N(i),
(1)
where the local weighting term L(i, j) is the weight of term j in document i, G( j) is the
global weight of term j in the entire set of documents, and N(i) is the weighting component
for document i. The popular TF-IDF can be written in the form L(i, j) = fi j, G( j) =
123
Journal of Intelligent Information Systems
1 + log2(ndocs/d f j), N(i) = 1, where ndocs is the number of documents in the set and d f j
is the number of documents where term j appears (Dumais, 1991). The SVD of A = [ai j] is
A = UV T
(2)
where UT U = I, V T V = I, and  is a diagonal matrix with singular values on the diagonal
in the descending order. We denote matrices that contain the ﬁrst k columns of U, ﬁrst k
columns of V, and k largest singular values of  by Uk, Vk, and k, respectively. Then,
Ukk(Vk)T provides the optimal rank-k approximation of A in a least-squares sense, which
