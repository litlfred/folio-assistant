---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-052
section_title: "Page 52"
pages: 52-52
pdf_page: 52
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
52
HALKO, MARTINSSON, AND TROPP
The matrix W has the same range as a related matrix formed by “ﬂattening out” the
spectrum of the top block. Indeed, since Σ1Ω1 has full row rank,
k
range(W ) = range
 I
0

k
n −k
The matrix on the right-hand side has full column rank, so it is legal to apply the
formula (8.3) for an orthogonal projector, which immediately yields
PW =
I
0
0
0

and
I −PW =
0
0
0
I

.
(9.7)
In words, the range of W aligns with the ﬁrst k coordinates, which span the same
subspace as the ﬁrst k left singular vectors of the auxiliary input matrix e
A. Therefore,
range(W ) captures the action of e
A, which is what we wanted from range( eY ).
We treat the auxiliary sample matrix eY as a perturbation of W , and we hope
that their ranges are close to each other. To make the comparison rigorous, let us
emulate the arguments outlined in the last paragraph. Referring to the display (9.4),
we ﬂatten out the top block of eY to obtain the matrix
Z = eY · Ω†
1Σ−1
1
=
 I
F

where
F = Σ2Ω2Ω†
1Σ−1
1 .
(9.8)
Let us return to the error bound (9.6).
The construction (9.8) ensures that
range(Z) ⊂range( eY ), so Proposition 8.5 implies that the error satisﬁes
(I −P e
Y ) e
A
 ≤
(I −PZ) e
A
.
Squaring this relation, we obtain
(I −P e
Y ) e
A
2 ≤
(I −PZ) e
A
2 =
 e
A∗(I −PZ) e
A
 = ∥Σ∗(I −PZ)Σ∥.
(9.9)
The last identity follows from the deﬁnition e
A = ΣV ∗and the unitary invariance
of the spectral norm. Therefore, we can complete the proof of (9.6) by producing a
suitable bound for the right-hand side of (9.9).
To continue, we need a detailed representation of the projector I −PZ. The con-
struction (9.8) ensures that Z has full column rank, so we can apply the formula (8.3)
for an orthogonal projector to see that
PZ = Z(Z∗Z)−1Z∗=
 I
F

(I + F ∗F )−1
 I
F
∗
.
Expanding this expression, we determine that the complementary projector satisﬁes
I −PZ =
I −(I + F ∗F )−1
−(I + F ∗F )−1F ∗
−F (I + F ∗F )−1
I −F (I + F ∗F )−1F ∗

.
(9.10)
The partitioning here conforms with the partitioning of Σ. When we conjugate the
matrix by Σ, copies of Σ−1
1 , presently hidden in the top-left block, will cancel to
happy eﬀect.
