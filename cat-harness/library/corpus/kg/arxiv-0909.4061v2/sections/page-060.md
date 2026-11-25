---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-060
section_title: "Page 60"
pages: 60-60
pdf_page: 60
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
60
HALKO, MARTINSSON, AND TROPP
Consider the function h(X) =
Σ2XΩ†
1
.
We quickly compute its Lipschitz
constant L with the lower triangle inequality and some standard norm estimates:
|h(X) −h(Y )| ≤
Σ2(X −Y )Ω†
1

≤∥Σ2∥∥X −Y ∥
Ω†
1
 ≤∥Σ2∥
Ω†
1
 ∥X −Y ∥F .
Therefore, L ≤∥Σ2∥
Ω†
1
. Relation (10.2) of Proposition 10.1 implies that
E[h(Ω2) | Ω1] ≤∥Σ2∥
Ω†
1

F + ∥Σ2∥F
Ω†
1
.
Applying the concentration of measure inequality, Proposition 10.3, conditionally to
the random variable h(Ω2) =
Σ2Ω2Ω†
1
 results in
P
nΣ2Ω2Ω†
1
 > ∥Σ2∥
Ω†
1

F + ∥Σ2∥F
Ω†
1
 + ∥Σ2∥
Ω†
1
 · u
 Et
o
≤e−u2/2.
Under the event Et, we have explicit bounds on the norms of Ω†
1, so
P
(
Σ2Ω2Ω†
1
 > ∥Σ2∥
s
12k
p
· t + ∥Σ2∥F
e√k + p
p + 1
· t + ∥Σ2∥e√k + p
p + 1
· ut
 Et
)
≤e−u2/2.
Use the fact P (Ec
t ) ≤5t−p to remove the conditioning. Therefore,
P
(
Σ2Ω2Ω†
1
 > ∥Σ2∥
s
12k
p
· t + ∥Σ2∥F
e√k + p
p + 1
· t + ∥Σ2∥e√k + p
p + 1
· ut
)
≤5t−p + e−u2/2.
Insert the expressions for the norms of Σ2 into this result to complete the probability
bound. Finally, introduce this estimate into the error bound from Theorem 9.1.
10.4. Analysis of the power scheme. Theorem 10.6 makes it clear that the
performance of the randomized approximation scheme, Algorithm 4.1, depends heav-
ily on the singular spectrum of the input matrix.
The power scheme outlined in
Algorithm 4.3 addresses this problem by enhancing the decay of spectrum. We can
combine our analysis of Algorithm 4.1 with Theorem 9.2 to obtain a detailed report
on the behavior of the performance of the power scheme using a Gaussian matrix.
Corollary 10.10 (Average spectral error for the power scheme). Frame the
hypotheses of Theorem 10.5. Deﬁne B = (AA∗)qA for a nonnegative integer q, and
construct the sample matrix Z = BΩ. Then
E ∥(I −PZ)A∥≤
" 
1 +
s
k
p −1
!
σ2q+1
k+1 + e√k + p
p
X
j>k σ2(2q+1)
j
1/2
#1/(2q+1)
.
Proof. By H¨older’s inequality and Theorem 9.2,
E ∥(I −PZ)A∥≤

E ∥(I −PZ)A∥2q+11/(2q+1)
≤(E ∥(I −PZ)B∥)1/(2q+1) .
