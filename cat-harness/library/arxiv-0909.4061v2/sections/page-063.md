---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-063
section_title: "Page 63"
pages: 63-63
pdf_page: 63
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
63
Construct the sample matrix Y = AΩ. Then
∥(I −PY )A∥≤
p
1 + 7n/ℓ· σk+1
and
∥(I −PY )A∥F ≤
p
1 + 7n/ℓ·
X
j>k σ2
j
1/2
with failure probability at most O(k−1).
As we saw in §10.2, the quantity σk+1 is the minimal spectral-norm error possible
when approximating A with a rank-k matrix. Similarly, the series in the second bound
is the minimal Frobenius-norm error when approximating A with a rank-k matrix.
We see that both error bounds lie within a polynomial factor of the baseline, and this
factor decreases with the number ℓof samples we retain.
The likelihood of error with an SRFT test matrix is substantially worse than in
the Gaussian case. The failure probability here is roughly k−1, while in the Gaussian
case, the failure probability is roughly e−(ℓ−k).
This qualitative diﬀerence is not
an artifact of the analysis; discrete sampling techniques inherently fail with higher
probability.
Matrix approximation schemes based on SRFTs often perform much better in
practice than the error analysis here would indicate. While it is not generally possible
to guarantee accuracy with a sampling parameter less than ℓ∼k log(k), we have found
empirically that the choice ℓ= k + 20 is adequate in almost all applications. Indeed,
SRFTs sometimes perform even better than Gaussian matrices (see, e.g., Figure 7.8).
We complete the section with the proof of Theorem 11.2.
Proof. [Theorem 11.2] Let V be the right unitary factor of matrix A, and partition
V = [V1 | V2] into blocks containing, respectively, k and n −k columns. Recall that
Ω1 = V ∗
1 Ω
and
Ω2 = V ∗
2 Ω.
where Ωis the conjugate transpose of an SRFT. Theorem 11.1 ensures that the
submatrix Ω1 has full row rank, with failure probability at most O(k−1). Therefore,
Theorem 9.1 implies that
|||(I −PY )A||| ≤|||Σ2|||
h
1 +
Ω†
1
2 · ∥Ω2∥2i1/2
,
where |||·||| denotes either the spectral norm or the Frobenius norm. Our application
of Theorem 11.1 also ensures that the spectral norm of Ω†
1 is under control.
Ω†
1
2 ≤
1
0.402 < 7.
We may bound the spectral norm of Ω2 deterministically.
∥Ω2∥= ∥V ∗
2 Ω∥≤∥V ∗
2 ∥∥Ω∥=
p
n/ℓ
since V2 and
p
ℓ/n · Ωare both orthonormal matrices. Combine these estimates to
complete the proof.
Acknowledgments. The authors have beneﬁted from valuable discussions with
many researchers, among them Inderjit Dhillon, Petros Drineas, Ming Gu, Edo Lib-
erty, Michael Mahoney, Vladimir Rokhlin, Yoel Shkolnisky, and Arthur Szlam. In
