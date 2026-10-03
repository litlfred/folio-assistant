---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-030
section_title: "Page 30"
pages: 30-30
pdf_page: 30
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
30
HALKO, MARTINSSON, AND TROPP
is particularly well suited to environments where we have a fast method for computing
the matrix–vector product x 7→A∗x, for example when A is sparse or structured.
This approach retains a strong advantage over Krylov-subspace methods and rank-
revealing QR because Step 1 can be accelerated using BLAS3, parallel processors, and
so forth. Steps 2 and 3 require O(k2n) and O(k2m) ﬂops respectively.
Remark 5.1. Algorithm 5.1 produces an approximate SVD with the same rank
as the basis matrix Q. When the size of the basis exceeds the desired rank k of the
SVD, it may be preferable to retain only the dominant k singular values and singular
vectors. Equivalently, we replace the diagonal matrix Σ of computed singular values
with the matrix Σ(k) formed by zeroing out all but the largest k entries of Σ. In
the worst case, this truncation step can increase the approximation error by σk+1;
see §9.4 for an analysis. Our numerical experience suggests that this error analysis is
pessimistic, and the term σk+1 often does not appear in practice.
5.2. Postprocessing via row extraction. Given a matrix Q such that (5.1)
holds, we can obtain a rank-k factorization
A ≈XB,
(5.3)
where B is a k × n matrix consisting of k rows extracted from A. The approxima-
tion (5.3) can be produced without computing any matrix–matrix products, which
makes this approach to postprocessing very fast. The drawback comes because the er-
ror ∥A −XB∥is usually larger than the initial error ∥A −QQ∗A∥, especially when
the dimensions of A are large. See Remark 5.3 for more discussion.
To obtain the factorization (5.3), we simply construct the interpolative decompo-
sition (§3.2.3) of the matrix Q:
Q = XQ(J,: ).
(5.4)
The index set J marks k rows of Q that span the row space of Q, and X is an m × k
matrix whose entries are bounded in magnitude by two and contains the k×k identity
as a submatrix: X(J,: ) = Ik. Combining (5.4) and (5.1), we reach
A ≈QQ∗A = XQ(J,: )Q∗A.
(5.5)
Since X(J,: ) = Ik, equation (5.5) implies that A(J,: ) ≈Q(J,: )Q∗A. Therefore, (5.3)
follows when we put B = A(J,: ).
Provided with the factorization (5.3), we can obtain any standard factorization
using the techniques of §3.3.3. Algorithm 5.2 illustrates an SVD calculation. This
procedure requires O(k2(m+ n)) ﬂops. The following lemma guarantees the accuracy
of the computed factors.
Lemma 5.1. Let A be an m× n matrix and let Q be an m× k matrix that satisfy
(5.1). Suppose that U, Σ, and V are the matrices constructed by Algorithm 5.2. Then
∥A −UΣV ∗∥≤
h
1 +
p
1 + 4k(n −k)
i
ε.
(5.6)
Proof. The factors U, Σ, V constructed by the algorithm satisfy
UΣV ∗= UΣ eV ∗W ∗= ZW ∗= XR∗W ∗= XA(J,: ).
