---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-012
section_title: "Page 12"
pages: 12-12
pdf_page: 12
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
12
HALKO, MARTINSSON, AND TROPP
k and a parameter ε > 0, this approach samples ℓ= ℓ(k, ε) columns of the matrix to
produce a rank-k approximation B that satisﬁes
∥A −B∥F ≤
A −A(k)

F + ε ∥A∥F ,
(2.2)
where ∥·∥F denotes the Frobenius norm. We note that the algorithm of [46] requires
only a constant number of passes over the data.
Rudelson and Vershynin later showed that the same type of column sampling
method also yields spectral-norm error bounds [116]. The techniques in their paper
have been very inﬂuential; their work has found other applications in randomized
regression [52], sparse approximation [133], and compressive sampling [19].
Deshpande et al. [37, 38] demonstrated that the error in the column sampling
approach can be improved by iteration and adaptive volume sampling. They showed
that it is possible to produce a rank-k matrix B that satisﬁes
∥A −B∥F ≤(1 + ε)
A −A(k)

F
(2.3)
using a k-pass algorithm. Around the same time, Har-Peled [70] independently de-
veloped a recursive algorithm that oﬀers the same approximation guarantees. Very
recently, Desphande and Rademacher have improved the running time of volume-
based sampling methods [36].
Drineas et al. and Boutsidis et al. have also developed randomized algorithms
for the column subset selection problem, which requests a column submatrix C that
achieves a bound of the form (2.1). Via the methods of Rudelson and Vershynin [116],
they showed that sampling columns according to their leverage scores is likely to
produce the required submatrix [50, 51]. Subsequent work [17, 18] showed that post-
processing the sampled columns with a rank-revealing QR algorithm can reduce the
number of output columns required (2.1).
The argument in [17] explicitly decou-
ples the linear algebraic part of the analysis from the random matrix theory. The
theoretical analysis in the present work involves a very similar technique.
2.1.3. Approximation by dimension reduction. A third approach to matrix
approximation is based on the concept of dimension reduction. Since the rows of a
low-rank matrix are linearly dependent, they can be embedded into a low-dimensional
space without altering their geometric properties substantially. A random linear map
provides an eﬃcient, nonadaptive way to perform this embedding. (Column sampling
can also be viewed as an adaptive form of dimension reduction.)
The proto-algorithm we set forth in §1.3.3 is simply a dual description of the
dimension reduction approach: collecting random samples from the column space of
the matrix is equivalent to reducing the dimension of the rows. No precomputation
is required to obtain the sampling distribution, but the sample itself takes some work
to collect. Afterward, we orthogonalize the samples as preparation for constructing
various matrix approximations.
We believe that the idea of using dimension reduction for algorithmic matrix
approximation ﬁrst appeared in a 1998 paper of Papadimitriou et al. [104, 105], who
described an application to latent semantic indexing (LSI). They suggested projecting
the input matrix onto a random subspace and compressing the original matrix to (a
subspace of) the range of the projected matrix. They established error bounds that
echo the result (2.2) of Frieze et al. [58]. Although the Euclidean column selection
method is a more computationally eﬃcient way to obtain this type of error bound,
dimension reduction has other advantages, e.g., in terms of accuracy.
