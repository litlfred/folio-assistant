---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-053
section_title: "Page 53"
pages: 53-53
pdf_page: 53
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
53
The latter point may not seem obvious, owing to the complicated form of (9.10).
In reality, the block matrix is less fearsome than it looks. Proposition 8.2, on the
perturbation of inverses, shows that the top-left block veriﬁes
I −(I + F ∗F )−1 ≼F ∗F .
The bottom-right block satisﬁes
I −F (I + F ∗F )−1F ∗≼I
because the conjugation rule guarantees that F (I + F ∗F )−1F ∗≽0. We abbreviate
the oﬀ-diagonal blocks with the symbol B = −(I + F ∗F )−1F ∗. In summary,
I −PZ ≼

F ∗F
B
B∗
I

.
This relation exposes the key structural properties of the projector. Compare this
relation with the expression (9.7) for the “ideal” projector I −PW .
Moving toward the estimate required by (9.9), we conjugate the last relation by
Σ to obtain
Σ∗(I −PZ)Σ ≼

Σ∗
1F ∗F Σ1
Σ∗
1BΣ2
Σ∗
2B∗Σ1
Σ∗
2Σ2

.
The conjugation rule demonstrates that the matrix on the left-hand side is psd, so
the matrix on the right-hand side is too. Proposition 8.3 results in the norm bound
∥Σ∗(I −PZ)Σ∥≤∥Σ∗
1F ∗F Σ1∥+ ∥Σ∗
2Σ2∥= ∥F Σ1∥2 + ∥Σ2∥2 .
Recall that F = Σ2Ω2Ω†
1Σ−1
1 , so the factor Σ1 cancels neatly. Therefore,
∥Σ∗(I −PZ)Σ∥≤
Σ2Ω2Ω†
1
2 + ∥Σ2∥2 .
Finally, introduce the latter inequality into (9.9) to complete the proof.
9.3. Analysis of the power scheme. Theorem 9.1 suggests that the perfor-
mance of the proto-algorithm depends strongly on the relationship between the large
singular values of A listed in Σ1 and the small singular values listed in Σ2. When a
substantial proportion of the mass of A appears in the small singular values, the con-
structed basis Q may have low accuracy. Conversely, when the large singular values
dominate, it is much easier to identify a good low-rank basis.
To improve the performance of the proto-algorithm, we can run it with a closely
related input matrix whose singular values decay more rapidly [67, 112]. Fix a positive
integer q, and set
B = (AA∗)qA = UΣ2q+1V ∗.
We apply the proto-algorithm to B, which generates a sample matrix Z = BΩand
constructs a basis Q for the range of Z. Section 4.5 elaborates on the implementation
details, and describes a reformulation that sometimes improves the accuracy when
the scheme is executed in ﬁnite-precision arithmetic. The following result describes
how well we can approximate the original matrix A within the range of Z.
