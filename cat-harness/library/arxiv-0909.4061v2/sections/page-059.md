---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-059
section_title: "Page 59"
pages: 59-59
pdf_page: 59
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
59
An analogous result holds for the spectral norm.
Theorem 10.8 (Deviation bounds for the spectral error). Frame the hypotheses
of Theorem 10.5. Assume further that p ≥4. For all u, t ≥1,
∥(I −PY )A∥
≤

1 + t ·
p
12k/p

σk+1 + t · e√k + p
p + 1
X
j>k σ2
j
1/2
+ ut · e√k + p
p + 1 σk+1,
with failure probability at most 5t−p + e−u2/2.
The bracket corresponds with the expected spectral-norm error while the remain-
ing term represents a deviation above the mean. Neither the numerical constants nor
the precise form of the bound are optimal because of the slackness in Proposition 10.4.
Nevertheless, the theorem gives a fairly good picture of what is actually happening.
We acknowledge that the current form of Theorem 10.8 is complicated. To pro-
duce more transparent results, we make appropriate selections for the parameters u, t
and bound the numerical constants.
Corollary 10.9 (Simpliﬁed deviation bounds for the spectral error). Frame
the hypotheses of Theorem 10.5, and assume further that p ≥4. Then
∥(I −PY )A∥≤

1 + 17
p
1 + k/p

σk+1 + 8√k + p
p + 1
X
j>k σ2
j
1/2
,
with failure probability at most 6e−p. Moreover,
∥(I −PY )A∥≤

1 + 8
p
(k + p) · p log p

σk+1 + 3
p
k + p
X
j>k σ2
j
1/2
,
with failure probability at most 6p−p.
Proof. The ﬁrst part of the result follows from the choices t = e and u = √2p,
and the second emerges when t = p and u = √2p log p. Another interesting parameter
selection is t = pc/p and u = √2c log p, which yields a failure probability 6p−c.
Corollary 10.9 should be compared with [91, Obs. 4.4–4.5]. Although our result
contains sharper error estimates, the failure probabilities are usually worse. The error
bound (1.9) presented in §1.5 follows after further simpliﬁcation of the second bound
from Corollary 10.9.
We continue with a proof of Theorem 10.8. The same argument can be used to
obtain a bound for the Frobenius-norm error, but we omit a detailed account.
Proof. [Theorem 10.8] Since Ω1 and Ω2 are independent from each other, we can
study how the error depends on the matrix Ω2 by conditioning on the event that Ω1
is not too irregular. To that end, we deﬁne a (parameterized) event on which the
spectral and Frobenius norms of the matrix Ω†
1 are both controlled. For t ≥1, let
Et =
(
Ω1 :
Ω†
1
 ≤e√k + p
p + 1
· t
and
Ω†
1

F ≤
s
12k
p
· t
)
.
Invoking both parts of Proposition 10.4, we ﬁnd that
P (Ec
t ) ≤t−(p+1) + 4t−p ≤5t−p.
