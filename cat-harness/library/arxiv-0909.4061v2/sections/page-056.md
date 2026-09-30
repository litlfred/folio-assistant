---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-056
section_title: "Page 56"
pages: 56-56
pdf_page: 56
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
56
HALKO, MARTINSSON, AND TROPP
The ﬁrst identity is a standard result from multivariate statistics [99, p. 96]. The
second follows from work of Chen and Dongarra [25]. See Proposition A.4 and A.5.
To study the probability that Algorithm 4.1 produces a large error, we rely on
tail bounds for functions of Gaussian matrices.
The next proposition rephrases a
well-known result on concentration of measure [14, Thm. 4.5.7]. See also [83, §1.1]
and [82, §5.1].
Proposition 10.3 (Concentration for functions of a Gaussian matrix). Suppose
that h is a Lipschitz function on matrices:
|h(X) −h(Y )| ≤L ∥X −Y ∥F
for all X, Y .
Draw a standard Gaussian matrix G. Then
P {h(G) ≥E h(G) + Lt} ≤e−t2/2.
Finally, we state some large deviation bounds for the norm of a pseudo-inverted
Gaussian matrix.
Proposition 10.4 (Norm bounds for a pseudo-inverted Gaussian matrix). Let
G be a k × (k + p) Gaussian matrix where p ≥4. For all t ≥1,
P
(
G†
F ≥
s
12k
p
· t
)
≤4t−p
and
(10.5)
P
G† ≥e√k + p
p + 1
· t

≤t−(p+1).
(10.6)
Compare these estimates with Proposition 10.2. It seems that (10.5) is new; we
were unable to ﬁnd a comparable analysis in the random matrix literature. Although
the form of (10.5) is not optimal, it allows us to produce more transparent results than
a fully detailed estimate. The bound (10.6) essentially appears in the work of Chen
and Dongarra [25]. See Propositions A.3 and Theorem A.6 for more information.
10.2. Average-case analysis of Algorithm 4.1. We separate our analysis
into two pieces. First, we present information about expected values. In the next
subsection, we describe bounds on the probability of a large deviation.
We begin with the simplest result, which provides an estimate for the expected
approximation error in the Frobenius norm. All proofs are postponed to the end of
the section.
Theorem 10.5 (Average Frobenius error).
Suppose that A is a real m × n
matrix with singular values σ1 ≥σ2 ≥σ3 ≥. . . . Choose a target rank k ≥2 and
an oversampling parameter p ≥2, where k + p ≤min{m, n}. Draw an n × (k + p)
standard Gaussian matrix Ω, and construct the sample matrix Y = AΩ. Then the
expected approximation error
E ∥(I −PY )A∥F ≤

1 +
k
p −1
1/2 X
j>k σ2
j
1/2
.
