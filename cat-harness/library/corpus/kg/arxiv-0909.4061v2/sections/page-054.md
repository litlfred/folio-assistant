---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-054
section_title: "Page 54"
pages: 54-54
pdf_page: 54
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
54
HALKO, MARTINSSON, AND TROPP
Theorem 9.2 (Power scheme). Let A be an m× n matrix, and let Ωbe an n× ℓ
matrix. Fix a nonnegative integer q, form B = (A∗A)qA, and compute the sample
matrix Z = BΩ. Then
∥(I −PZ)A∥≤∥(I −PZ)B∥1/(2q+1) .
Proof. We determine that
∥(I −PZ)A∥≤∥(I −PZ)(AA∗)qA∥1/(2q+1) = ∥(I −PZ)B∥1/(2q+1)
as a direct consequence of Proposition 8.6.
Let us illustrate how the power scheme interacts with the main error bound (9.3).
Let σk+1 denote the (k + 1)th singular value of A. First, suppose we approximate A
in the range of the sample matrix Y = AΩ. Since ∥Σ2∥= σk+1, Theorem 9.1 implies
that
∥(I −PY )A∥≤

1 +
Ω2Ω†
1
21/2
σk+1.
(9.11)
Now, deﬁne B = (AA∗)qA, and suppose we approximate A within the range of the
sample matrix Z = BΩ. Together, Theorem 9.2 and Theorem 9.1 imply that
∥(I −PZ)A∥≤∥(I −PZ)B∥1/(2q+1) ≤

1 +
Ω2Ω†
1
21/(4q+2)
σk+1
because σ2q+1
k+1
is the (k + 1)th singular value of B.
In eﬀect, the power scheme
drives down the suboptimality of the bound (9.11) exponentially fast as the power
q increases. In principle, we can make the extra factor as close to one as we like,
although this increases the cost of the algorithm.
9.4. Analysis of truncated SVD. Finally, let us study the truncated SVD
described in Remark 5.1. Suppose that we approximate the input matrix A inside
the range of the sample matrix Z. In essence, the truncation step computes a best
rank-k approximation b
A(k) of the compressed matrix PZA. The next result provides
a simple error bound for this method; this argument was proposed by Ming Gu.
Theorem 9.3 (Analysis of Truncated SVD). Let A be an m × n matrix with
singular values σ1 ≥σ2 ≥σ3 ≥. . . , and let Z be an m × ℓmatrix, where ℓ≥k.
Suppose that b
A(k) is a best rank-k approximation of PZA with respect to the spectral
norm. Then
A −b
A(k)
 ≤σk+1 + ∥(I −PZ)A∥.
Proof. Apply the triangle inequality to split the error into two components.
A −b
Ak
 ≤
A −PZA
 +
PZA −b
A(k)
.
(9.12)
We have already developed a detailed theory for estimating the ﬁrst term. To analyze
the second term, we introduce a best rank-k approximation A(k) of the matrix A.
Note that
PZA −b
A(k)
 ≤
PZA −PZA(k)
