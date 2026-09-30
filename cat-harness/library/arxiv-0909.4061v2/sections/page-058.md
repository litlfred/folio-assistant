---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-058
section_title: "Page 58"
pages: 58-58
pdf_page: 58
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
58
HALKO, MARTINSSON, AND TROPP
We compute this expectation by conditioning on the value of Ω1 and applying Propo-
sition 10.1 to the scaled Gaussian matrix Ω2. Thus,
E
Σ2Ω2Ω†
1
2
F = E

E
hΣ2Ω2Ω†
1
2
F
 Ω1
i
= E

∥Σ2∥2
F
Ω†
1
2
F

= ∥Σ2∥2
F · E
Ω†
1
2
F =
k
p −1 · ∥Σ2∥2
F ,
where the last expectation follows from relation (10.3) of Proposition 10.2. In sum-
mary,
E ∥(I −PY )A∥F ≤

1 +
k
p −1
1/2
∥Σ2∥F .
Observe that ∥Σ2∥2
F = P
j>k σ2
j to complete the proof.
Proof. [Theorem 10.6] The argument is similar to the proof of Theorem 10.5.
First, Theorem 9.1 implies that
E ∥(I −PY )A∥≤E

∥Σ2∥2 +
Σ2Ω2Ω†
1
21/2
≤∥Σ2∥+ E
Σ2Ω2Ω†
1
.
We condition on Ω1 and apply Proposition 10.1 to bound the expectation with respect
to Ω2. Thus,
E
Σ2Ω2Ω†
1
 ≤E

∥Σ2∥
Ω†
1

F + ∥Σ2∥F
Ω†
1


≤∥Σ2∥

E
Ω†
1
2
F
1/2
+ ∥Σ2∥F · E
Ω†
1
.
where the second relation requires H¨older’s inequality. Applying both parts of Propo-
sition 10.2, we obtain
E
Σ2Ω2Ω†
1
 ≤
s
k
p −1 ∥Σ2∥+ e√k + p
p
∥Σ2∥F .
Note that ∥Σ2∥= σk+1 to wrap up.
10.3. Probabilistic error bounds for Algorithm 4.1. We can develop tail
bounds for the approximation error, which demonstrate that the average performance
of the algorithm is representative of the actual performance.
We begin with the
Frobenius norm because the result is somewhat simpler.
Theorem 10.7 (Deviation bounds for the Frobenius error). Frame the hypotheses
of Theorem 10.5. Assume further that p ≥4. For all u, t ≥1,
∥(I −PY )A∥F ≤

1 + t ·
p
12k/p
 X
j>k σ2
j
1/2
+ ut · e√k + p
p + 1
· σk+1,
with failure probability at most 5t−p + 2e−u2/2.
To parse this theorem, observe that the ﬁrst term in the error bound corresponds
with the expected approximation error in Theorem 10.5. The second term represents
a deviation above the mean.
