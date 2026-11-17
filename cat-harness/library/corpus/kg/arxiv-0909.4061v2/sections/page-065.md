---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-065
section_title: "Page 65"
pages: 65-65
pdf_page: 65
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
65
We can use Proposition A.3 to bound the expected spectral norm of a pseudo-
inverted Gaussian matrix.
Proposition A.4. Let G be a m × n standard Gaussian matrix with n −m ≥1
and m ≥2. Then
E
G† <
e√n
n −m
Proof. Let us make the abbreviations p = n −m and
C =
1
p
2π(p + 1)
 e√n
p + 1
p+1
.
We compute the expectation by way of a standard argument. The integral formula
for the mean of a nonnegative random variable implies that, for all E > 0,
E
G† =
Z ∞
0
P
G† > t
	
dt ≤E +
Z ∞
E
P
G† > t
	
dt
≤E + C
Z ∞
E
t−(p+1) dt = E + 1
pCE−p,
where the second inequality follows from Proposition A.3.
The right-hand side is
minimized when E = C1/(p+1). Substitute and simplify.
A.3. Frobenius norm of pseudoinverse. The squared Frobenius norm of a
pseudo-inverted Gaussian matrix is closely connected with the trace of an inverted
Wishart matrix. This observation leads to an exact expression for the expectation.
Proposition A.5. Let G be an m×n standard Gaussian matrix with n−m ≥2.
Then
E
G†2
F =
m
n −m −1.
Proof. Observe that
G†2
F = trace

(G†)∗G†
= trace

(GG∗)−1
.
The second identity holds almost surely because the Wishart matrix GG∗is invertible
with probability one.
The random matrix (GG∗)−1 follows the inverted Wishart
distribution, so we can compute its expected trace explicitly using a formula from [99,
p. 97].
On the other hand, very little seems to be known about the tail behavior of the
Frobenius norm of a pseudo-inverted Gaussian matrix. The following theorem, which
is new, provides an adequate bound on the probability of a large deviation.
Theorem A.6. Let G be an m × n standard Gaussian matrix with n −m ≥4.
For each t ≥1,
P
G†2
F >
12m
n −m · t

≤4t−(n−m)/2.
