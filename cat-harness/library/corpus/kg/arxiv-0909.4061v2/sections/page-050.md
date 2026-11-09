---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-050
section_title: "Page 50"
pages: 50-50
pdf_page: 50
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
50
HALKO, MARTINSSON, AND TROPP
Writing xj for the entries of x and dj for the diagonal entries of D, we ﬁnd that
∥RDR∥t = [x∗(RDR)x]t = [x∗Dx]t =
hX
j djx2
j
it
≤
hX
j dt
jx2
j
i
= x∗Dtx = (Rx)∗Dt(Rx) ≤
RDtR
 .
The inequality is Jensen’s, which applies because P x2
j = 1 and the function z 7→|z|t
is convex for t ≥1.
9. Error bounds via linear algebra. We are now prepared to develop a de-
terministic error analysis for the proto-algorithm described in §1.3.
To begin, we
must introduce some notation. Afterward, we establish the key error bound, which
strengthens a result from the literature [17, Lem. 4.2]. Finally, we explain why the
power method can be used to improve the performance of the proto-algorithm.
9.1. Setup. Let A be an m × n matrix that has a singular value decomposition
A = UΣV ∗, as described in Section 3.2.2. Roughly speaking, the proto-algorithm
tries to approximate the subspace spanned by the ﬁrst k left singular vectors, where
k is now a ﬁxed number. To perform the analysis, it is appropriate to partition the
singular value decomposition as follows.
k
n −k
n
A = U

Σ1
Σ2
 
V ∗
1
V ∗
2

k
n −k
(9.1)
The matrices Σ1 and Σ2 are square. We will see that the left unitary factor U does
not play a signiﬁcant role in the analysis.
Let Ωbe an n×ℓtest matrix, where ℓdenotes the number of samples. We assume
only that ℓ≥k. Decompose the test matrix in the coordinate system determined by
the right unitary factor of A:
Ω1 = V ∗
1 Ω
and
Ω2 = V ∗
2 Ω.
(9.2)
The error bound for the proto-algorithm depends critically on the properties of the
matrices Ω1 and Ω2. With this notation, the sample matrix Y can be expressed as
ℓ
Y = AΩ= U
 Σ1Ω1
Σ2Ω2

k
n −k
It is a useful intuition that the block Σ1Ω1 in (9.1) reﬂects the gross behavior of A,
while the block Σ2Ω2 represents a perturbation.
9.2. A deterministic error bound for the proto-algorithm. The proto-
algorithm constructs an orthonormal basis Q for the range of the sample matrix Y ,
and our goal is to quantify how well this basis captures the action of the input A.
Since QQ∗= PY , the challenge is to obtain bounds on the approximation error
|||A −QQ∗A||| = |||(I −PY )A||| .
The following theorem shows that the behavior of the proto-algorithm depends on
the interaction between the test matrix and the right singular vectors of the input
matrix, as well as the singular spectrum of the input matrix.
