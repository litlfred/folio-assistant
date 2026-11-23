---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-013
section_title: "Page 13"
pages: 13-13
pdf_page: 13
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
13
Sarl´os argued in [118] that the computational costs of dimension reduction can be
reduced substantially by means of the structured random maps proposed by Ailon–
Chazelle [3]. Sarl´os used these ideas to develop eﬃcient randomized algorithms for
least-squares problems; he also studied approximate matrix multiplication and low-
rank matrix approximation. The recent paper [102] analyzes a very similar matrix
approximation algorithm using Rudelson and Vershynin’s methods [116].
The initial work of Sarl´os on structured dimension reduction did not immediately
yield algorithms for low-rank matrix approximation that were superior to classical
techniques. Woolfe et al. showed how to obtain an improvement in asymptotic com-
putational cost, and they applied these techniques to problems in scientiﬁc comput-
ing [137]. Related work includes [86, 88].
Martinsson–Rokhlin–Tygert have studied dimension reduction using a Gaussian
transform matrix, and they demonstrated that this approach performs much better
than earlier analyses had suggested [91]. Their work highlights the importance of over-
sampling, and their error bounds are very similar to the estimate (1.9) we presented
in the introduction. They also demonstrated that dimension reduction can be used
to compute an interpolative decomposition of the input matrix, which is essentially
equivalent to performing column subset selection.
Rokhlin–Szlam–Tygert have shown that combining dimension reduction with a
power iteration is an eﬀective way to improve its performance [112].
These ideas
lead to very eﬃcient randomized methods for large-scale PCA [69].
An eﬃcient,
numerically stable version of the power iteration is discussed in §4.5, as well as [92].
Related ideas appear in a paper of Roweis [114].
Very recently, Clarkson and Woodruﬀ[29] have developed one-pass algorithms for
performing low-rank matrix approximation, and they have established lower bounds
which prove that many of their algorithms have optimal or near-optimal resource
guarantees, modulo constants.
2.1.4. Approximation by submatrices. The matrix approximation literature
contains a subgenre that discusses methods for building an approximation from a
submatrix and computed coeﬃcient matrices.
For example, we can construct an
approximation using a subcollection of columns (the interpolative decomposition), a
subcollection of rows and a subcollection of columns (the CUR decomposition), or a
square submatrix (the matrix skeleton). This type of decomposition was developed
and studied in several papers, including [26, 64, 126]. For data analysis applications,
see the recent paper [89].
A number of works develop randomized algorithms for this class of matrix ap-
proximations. Drineas et al. have developed techniques for computing CUR decom-
positions, which express A ≈CUR, where C and R denote small column and row
submatrices of A and where U is a small linkage matrix. These methods identify
columns (rows) that approximate the range (corange) of the matrix; the linkage matrix
is then computed by solving a small least-squares problem. A randomized algorithm
for CUR approximation with controlled absolute error appears in [47]; a relative error
algorithm appears in [51]. We also mention a paper on computing a closely related
factorization called the compact matrix decomposition [129].
It is also possible to produce interpolative decompositions and matrix skeletons
using randomized methods, as discussed in [91, 112] and §5.2 of the present work.
2.1.5. Other numerical problems. The literature contains a variety of other
randomized algorithms for solving standard problems in and around numerical linear
algebra. We list some of the basic references.
