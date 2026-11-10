---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-033
section_title: "Page 33"
pages: 33-33
pdf_page: 33
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
33
Algorithm 5.4: Eigenvalue Decomposition via Row Extraction
Given an Hermitian matrix A and a basis Q such that (5.1) holds, this
procedure computes an approximate eigenvalue decomposition A ≈UΛU∗,
where U is orthonormal, and Λ is a real diagonal matrix.
1
Compute an ID Q = XQ(J,: ).
2
Perform a QR factorization X = V R.
3
Form the product Z = RA(J,J)R∗.
4
Compute an eigenvalue decomposition Z = W ΛW ∗.
5
Form the orthonormal matrix U = V W .
Note: Algorithm 5.4 is faster than Algorithm 5.3 but less accurate.
Note: It is advantageous to replace the basis Q by the sample matrix Y
produced in Stage A, cf. Remark 5.2.
Algorithm 5.5: Eigenvalue Decomposition via Nystr¨om Method
Given a positive semideﬁnite matrix A and a basis Q such that (5.1)
holds, this procedure computes an approximate eigenvalue decomposition
A ≈UΛU∗, where U is orthonormal, and Λ is nonnegative and diagonal.
1
Form the matrices B1 = AQ and B2 = Q∗B1.
2
Perform a Cholesky factorization B2 = C∗C.
3
Form F = B1C−1 using a triangular solve.
4
Compute an SVD F = UΣV ∗and set Λ = Σ2.
where F is an approximate Cholesky factor of A with dimension n × k. To compute
the factor F numerically, ﬁrst form the matrices B1 = AQ and B2 = Q∗B1. Then
decompose the psd matrix B2 = C∗C into its Cholesky factors. Finally compute the
factor F = B1C−1 by performing a triangular solve. The low-rank factorization (5.12)
can be converted to a standard decomposition using the techniques from §3.3.3.
The literature contains an explicit expression [48, Lem. 4] for the approximation
error in (5.12). This result implies that, in the spectral norm, the Nystr¨om approx-
imation error never exceeds ∥A −QQ∗A∥, and it is often substantially smaller. We
omit a detailed discussion.
For an example of the Nystr¨om technique, consider Algorithm 5.5, which com-
putes an approximate eigenvalue decomposition of a positive semideﬁnite matrix. This
method should be compared with the scheme for Hermitian matrices, Algorithm 5.3.
In both cases, the dominant cost occurs when we form AQ, so the two procedures
have roughly the same running time. On the other hand, Algorithm 5.5 is typically
much more accurate than Algorithm 5.3. In a sense, we are exploiting the fact that
A is positive semideﬁnite to take one step of subspace iteration (Algorithm 4.4) for
free.
5.5. Single-pass algorithms. The techniques described in §§5.1–5.4 all require
us to revisit the input matrix. This may not be feasible in environments where the
matrix is too large to be stored. In this section, we develop a method that requires
just one pass over the matrix to construct not only an approximate basis but also a
complete factorization. Similar techniques appear in [137] and [29].
