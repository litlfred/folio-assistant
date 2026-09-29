---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-018
section_title: "Page 18"
pages: 18-18
pdf_page: 18
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
18
HALKO, MARTINSSON, AND TROPP
hold for each matrix A.
We say that a matrix U is orthonormal if its columns form an orthonormal set
with respect to the Hermitian inner product. An orthonormal matrix U preserves
geometry in the sense that ∥Ux∥= ∥x∥for every vector x. A unitary matrix is
a square orthonormal matrix, and an orthogonal matrix is a real unitary matrix.
Unitary matrices satisfy the relations UU∗= U∗U = I. Both the operator norm and
the Frobenius norm are unitarily invariant, which means that
∥UAV ∗∥= ∥A∥
and
∥UAV ∗∥F = ∥A∥F
for every matrix A and all orthonormal matrices U and V
We use the notation of [61] to denote submatrices. If A is a matrix with entries
aij, and if I = [i1, i2, . . . , ip] and J = [j1, j2, . . . , jq] are two index vectors, then the
associated p × q submatrix is expressed as
A(I,J) =


ai1,j1
· · ·
ai1,jq
...
...
aip,j1
· · ·
aip,jq

.
For column- and row-submatrices, we use the standard abbreviations
A(: ,J) = A([1, 2, ..., m],J),
and
A(I,: ) = A(I,[1, 2, ..., n]).
3.2. Standard matrix factorizations. This section deﬁnes three basic matrix
decompositions. Methods for computing them are described in §3.3.
3.2.1. The pivoted QR factorization. Each m×n matrix A of rank k admits
a decomposition
A = QR,
where Q is an m × k orthonormal matrix, and R is a k × n weakly upper-triangular
matrix.
That is, there exists a permutation J of the numbers {1, 2, . . . , n} such
that R(: ,J) is upper triangular. Moreover, the diagonal entries of R(: ,J) are weakly
decreasing. See [61, §5.4.1] for details.
3.2.2. The singular value decomposition (SVD). Each m × n matrix A of
rank k admits a factorization
A = UΣV ∗,
where U is an m × k orthonormal matrix, V is an n × k orthonormal matrix, and Σ
is a k × k nonnegative, diagonal matrix
Σ =


σ1
σ2
...
σk

.
The numbers σj are called the singular values of A. They are arranged in weakly
decreasing order:
σ1 ≥σ2 ≥· · · ≥σk ≥0.
