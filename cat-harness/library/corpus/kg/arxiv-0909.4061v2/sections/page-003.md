---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-003
section_title: "Page 3"
pages: 3-3
pdf_page: 3
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
3
low-rank approximation of a given matrix:
A
≈
B
C,
m × n
m × k
k × n.
(1.1)
The inner dimension k is sometimes called the numerical rank of the matrix. When
the numerical rank is much smaller than either dimension m or n, a factorization such
as (1.1) allows the matrix to be stored inexpensively and to be multiplied rapidly with
vectors or other matrices. The factorizations can also be used for data interpretation
or to solve computational problems, such as least squares.
Matrices with low numerical rank appear in a wide variety of scientiﬁc applica-
tions. We list only a few:
• A basic method in statistics and data mining is to compute the directions of
maximal variance in vector-valued data by performing principal component
analysis (PCA) on the data matrix. PCA is nothing other than a low-rank
matrix approximation [71, §14.5].
• Another standard technique in data analysis is to perform low-dimensional
embedding of data under the assumption that there are fewer degrees of
freedom than the ambient dimension would suggest.
In many cases, the
method reduces to computing a partial SVD of a matrix derived from the
data. See [71, §§14.8–14.9] or [30].
• The problem of estimating parameters from measured data via least-squares
ﬁtting often leads to very large systems of linear equations that are close to
linearly dependent. Eﬀective techniques for factoring the coeﬃcient matrix
lead to eﬃcient techniques for solving the least-squares problem, [113].
• Many fast numerical algorithms for solving PDEs and for rapidly evaluating
potential ﬁelds such as the fast multipole method [66] and H-matrices [65],
rely on low-rank approximations of continuum operators.
• Models of multiscale physical phenomena often involve PDEs with rapidly
oscillating coeﬃcients. Techniques for model reduction or coarse graining in
such environments are often based on the observation that the linear trans-
form that maps the input data to the requested output data can be approxi-
mated by an operator of low rank [56].
1.2. Matrix approximation framework. The task of computing a low-rank
approximation to a given matrix can be split naturally into two computational stages.
The ﬁrst is to construct a low-dimensional subspace that captures the action of the
matrix. The second is to restrict the matrix to the subspace and then compute a
standard factorization (QR, SVD, etc.) of the reduced matrix. To be slightly more
formal, we subdivide the computation as follows.
Stage A: Compute an approximate basis for the range of the input matrix A. In
other words, we require a matrix Q for which
Q has orthonormal columns and A ≈QQ∗A.
(1.2)
We would like the basis matrix Q to contain as few columns as possible, but it is
even more important to have an accurate approximation of the input matrix.
Stage B: Given a matrix Q that satisﬁes (1.2), we use Q to help compute a
standard factorization (QR, SVD, etc.) of A.
