---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-049
section_title: "Page 49"
pages: 49-49
pdf_page: 49
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
49
Since the range determines the orthogonal projector, we conclude P = PU ∗M.
Proposition 8.5. Suppose range(N) ⊂range(M). Then, for each matrix A, it
holds that ∥PNA∥≤∥PMA∥and that ∥(I −PM)A∥≤∥(I −PN)A∥.
Proof. The projector PN ≼I, so the conjugation rule yields PMPNPM ≼PM.
The hypothesis range(N) ⊂range(M) implies that PMPN = PN, which results in
PMPNPM = PNPM = (PMPN)∗= PN.
In summary, PN ≼PM. The conjugation rule shows that A∗PNA ≼A∗PMA. We
conclude from (8.2) that
∥PNA∥2 = ∥A∗PNA∥≤∥A∗PMA∥= ∥PMA∥2 .
The second statement follows from the ﬁrst by taking orthogonal complements.
Finally, we need a generalization of the scalar inequality |px|q ≤|p| |x|q, which
holds when |p| ≤1 and q ≥1.
Proposition 8.6. Let P be an orthogonal projector, and let M be a matrix. For
each positive number q,
∥P M∥≤∥P (MM ∗)qM∥1/(2q+1) .
(8.4)
Proof. Suppose that R is an orthogonal projector, D is a nonnegative diagonal
matrix, and t ≥1. We claim that
∥RDR∥t ≤
RDtR
 .
(8.5)
Granted this inequality, we quickly complete the proof. Using an SVD M = UΣV ∗,
we compute
∥P M∥2(2q+1) = ∥P MM ∗P ∥2q+1 =
(U∗P U) · Σ2 · (U∗P U)
2q+1
≤
(U∗P U) · Σ2(2q+1) · (U∗P U)
 =
P (MM ∗)2(2q+1)P

=
P (MM ∗)qM · M ∗(MM ∗)qP
 = ∥P (MM ∗)qM∥2 .
We have used the unitary invariance of the spectral norm in the second and fourth
relations. The inequality (8.5) applies because U∗P U is an orthogonal projector.
Take a square root to ﬁnish the argument.
Now, we turn to the claim (8.5).
This relation follows immediately from [11,
Thm. IX.2.10], but we oﬀer a direct argument based on more elementary considera-
tions. Let x be a unit vector at which
x∗(RDR)x = ∥RDR∥.
We must have Rx = x. Otherwise, ∥Rx∥< 1 because R is an orthogonal projector,
which implies that the unit vector y = Rx/ ∥Rx∥veriﬁes
y∗(RDR)y = (Rx)∗(RDR)(Rx)
∥Rx∥2
= x∗(RDR)x
∥Rx∥2
> x∗(RDR)x.
