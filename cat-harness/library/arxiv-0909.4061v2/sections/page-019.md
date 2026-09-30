---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-019
section_title: "Page 19"
pages: 19-19
pdf_page: 19
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
19
The columns of U and V are called left singular vectors and right singular vectors,
respectively.
Singular values are connected with the approximability of matrices. For each j,
the number σj+1 equals the spectral-norm discrepancy between A and an optimal
rank-j approximation [97]. That is,
σj+1 = min{∥A −B∥: B has rank j}.
(3.1)
In particular, σ1 = ∥A∥. See [61, §2.5.3 and §5.4.5] for additional details.
3.2.3. The interpolative decomposition (ID). Our ﬁnal factorization iden-
tiﬁes a collection of k columns from a rank-k matrix A that span the range of A. To
be precise, we can compute an index set J = [j1, . . . , jk] such that
A = A(: ,J) X,
where X is a k × n matrix that satisﬁes X(: ,J) = Ik. Furthermore, no entry of X
has magnitude larger than two. In other words, this decomposition expresses each
column of A using a linear combination of k ﬁxed columns with bounded coeﬃcients.
Stable and eﬃcient algorithms for computing the ID appear in the papers [26, 68].
It is also possible to compute a two-sided ID
A = W A(J′,J) X,
where J′ is an index set identifying k of the rows of A, and W is an m × k matrix
that satisﬁes W(J′,: ) = Ik and whose entries are all bounded by two.
Remark 3.1. There always exists an ID where the entries in the factor X have
magnitude bounded by one. Known proofs of this fact are constructive, e.g., [103,
Lem. 3.3], but they require us to ﬁnd a collection of k columns that has “maximum
volume.” It is NP-hard to identify a subset of columns with this type of extremal
property [27]. We ﬁnd it remarkable that ID computations are possible as soon as the
bound on X is relaxed.
3.3. Techniques for computing standard factorizations. This section dis-
cusses some established deterministic techniques for computing the factorizations pre-
sented in §3.2. The material on pivoted QR and SVD can be located in any major text
on numerical linear algebra, such as [61, 132]. References for the ID include [26, 68].
3.3.1. Computing the full decomposition. It is possible to compute the full
QR factorization or the full SVD of an m×n matrix to double-precision accuracy with
O(mn min{m, n}) ﬂops. Techniques for computing the SVD are iterative by necessity,
but they converge so fast that we can treat them as ﬁnite for practical purposes.
3.3.2. Computing partial decompositions. Suppose that an m × n matrix
has numerical rank k, where k is substantially smaller than m and n. In this case,
it is possible to produce a structured low-rank decomposition that approximates the
matrix well. Sections 4 and 5 describe a set of randomized techniques for obtaining
these partial decompositions. This section brieﬂy reviews the classical techniques,
which also play a role in developing randomized methods.
To compute a partial QR decomposition, the classical device is the Businger–
Golub algorithm, which performs successive orthogonalization with pivoting on the
columns of the matrix. The procedure halts when the Frobenius norm of the remaining
