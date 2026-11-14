---
doc_id: qi-hessen-vanderheijden-2023-ca-vs-lsa
doc_title: "RESEARCH Improving information retrieval through correspondence analysis instead of latent semantic analysis Qianqian Qi1 · David J. Hessen1 · Peter G.M. van der Heijden1,2 © The A"
section_id: sec-020-6-conclusions-and-discussions
section_title: "Conclusions and discussions"
section_number: 6
pages: 18-19
source_pdf: qi-hessen-vanderheijden-2023-ca-vs-lsa.pdf
source_sha256: c1816a290472bb83
toc_source: outline
---
Both LSA and CA make use of SVD. The main difference between LSA and CA is the matrix
that is decomposed by SVD. In LSA, the decomposed matrix is the weighted matrix A. In
CA the decomposed matrix is the matrix S of standardized residuals, where in the part (P -
E) the marginal effects are eliminated (Qi et al., 2023), and whose rank is one less the rank of
A. That is why the CA solution only displays the dependence between documents and terms.
In LSA, on the other hand, the decomposed matrix also includes marginal effects, which are
usually not relevant for information retrieval.
CA is related to the statistical independence model (Greenacre, 1984). The elements of
S display the departure from marginal products, i.e., the departure form the statistical inde-
pendence model. The sum of squared elements of S equals the Pearson chi-square statistic
divided by the sum of elements of F. CA decomposes the departure from statistical indepen-
dence into a number of dimensions using SVD. LSA, on the other hand, has no connection
with the statistical independence model.
In this paper, we compared four versions of LSA: LSA-RAW, LSA-NROWL1, LSA-
NROWL2, and LSA-TFIDF with CA and found that CA always performs better than LSA in
terms of MAP. Then, we compared LSA-RAW as a function of weighting exponent α with
CA under a range of the numbers of dimensions. Even though LSA is improved by choosing
an appropriate value for α, CA always performed better than LSA.
Next, we applied different weighting elements of the raw document-term matrix to CA.
We found that weighting elements of the raw matrix sometimes improves the performance
of CA, but improvements over CA-RAW are small and data dependent. The performance of
CA-NROWL1 is better than that of LSA-NROWL1, the performance of CA-NROWL2 is
better than that of LSA-NROWL2, and the performance of CA-TFIDF is better than that of
LSA-TFIDF. Then, we adjusted the weighting exponents α in CA. For CA, as a function of α,
MAP ﬁrst increases and then decreases. Adjusting the weighting exponent α can potentially
improve the performance of CA. However, the increased performance obtained by adjusting
α is data and dimension dependent.
Using the standard coordinates of α = 1, for LSA, the Euclidean distances between the
rowsofcoordinatesapproximatetheEuclideandistancesbetweentherowsofthedecomposed
matrix. For CA, the Euclidean distances between the rows of coordinates approximate the
χ2−distances between the rows of the decomposed matrix. α < 1 gives less emphasis to
the initial dimensions relative to the standard coordinates. Conversely, α > 1 gives more
emphasis to the initial dimensions relative to the standard coordinates. The optimal α for CA
is almost always larger than that for LSA and is almost always larger than 1.
Bullinaria and Levy (2012) argued that the initial dimensions in LSA tend not to contribute
the most useful information about semantics and tend to be contaminated by “noise”. The
above mentioned results indicate that CA places more emphasis on the initial dimensions
than LSA. The major difference between LSA and CA is that LSA involves margins but
CA does not (Qi et al., 2023). Thus, we infer that margins considerably contribute to the
initial dimensions in LSA. These margins are irrelevant for information retrieval. The CA
effectively eliminates this irrelevant information.
123
Journal of Intelligent Information Systems
In this paper, we focused on the performances of CA and LSA using Euclidean distances.
We also performed identical experiments for dot similarity and cosine similarity. Both have
nearly identical results with the Euclidean distance. Cosine similarity performs better than the
Euclidean distance and dot similarity. We focus on Euclidean distance in the paper because
(1) it is more easily interpretable in the context of adjusting α: as α increases, the Euclidean
distances between row points (column points) on the initial dimensions increase relative to
the later dimensions; (2) for CA, dot similarity and cosine similarity have never been used
before, and therefore, by focusing on Euclidean distances, the results ﬁt better into the existing
literature.
Based on theoretical considerations and experimental results, we have the following three
suggestions for practical guidance:
1. Use CA instead of LSA under the four kinds of feature extraction: RAW, NROWL1,
NROWL2, and TF-IDF; use CA for visualizing data.
2. If information retrieval is the key issue, use cosine similarity instead of Euclidean distance
and dot similarity for calculating MAP.
3. If optimal performance in terms of MAP is not of key importance, there is no need
to weight the elements of raw document-term matrix for CA and optimize the perfor-
mance over α for CA to saving time. Otherwise, these two weightings may be considered
potential approaches for improving the performance of CA.
Our ﬁnding that CA performs better than LSA for information retrieval is very important
for creating next generation intelligent information systems. Among many other tasks, LSA
has been widely used for information retrieval. We expect that the performance of these tasks
can be improved by replacing LSA with CA.
Concluding, CA and LSA are both tools for information retrieval but the performance
of CA is better. In our paper we tried to further improve CA by weighting the input matrix
and by weighting dimensions. This did not lead to large or consistent improvements of the
performance of CA.
Further studies on the combination of LSA and CA will also be interesting. For example,
creating an ensemble voting system using the coordinates from LSA and CA in the process
of returning documents of a query. This paper, however, focuses on the comparison of LSA
and CA for information retrieval and other explorations are left for future studies.
Supplementary Information
The online version contains supplementary material available at https://doi.
org/10.1007/s10844-023-00815-y.
