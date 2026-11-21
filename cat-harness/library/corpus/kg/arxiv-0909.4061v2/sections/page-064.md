---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-064
section_title: "Page 64"
pages: 64-64
pdf_page: 64
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
64
HALKO, MARTINSSON, AND TROPP
particular, we would like to thank Mark Tygert for his insightful remarks on early
drafts of this paper. The example in Section 7.2 was provided by Fran¸cois Meyer of
the University of Colorado at Boulder. The example in Section 7.3 comes from the
FERET database of facial images collected under the FERET program, sponsored by
the DoD Counterdrug Technology Development Program Oﬃce. The work reported
was initiated during the program Mathematics of Knowledge and Search Engines held
at IPAM in the fall of 2007. Finally, we would like to thank the anonymous referees,
whose thoughtful remarks have helped us to improve the manuscript dramatically.
Appendix A. On Gaussian matrices. This appendix collects some of the
properties of Gaussian matrices that we use in our analysis. Most of the results follow
quickly from material that is already available in the literature. One fact, however,
requires a surprisingly diﬃcult new argument. We focus on the real case here; the
complex case is similar but actually yields better results.
A.1. Expectation of norms. We begin with the expected Frobenius norm of
a scaled Gaussian matrix, which follows from an easy calculation.
Proposition A.1. Fix real matrices S, T , and draw a standard Gaussian matrix
G. Then

E ∥SGT ∥2
F
1/2
= ∥S∥F ∥T ∥F .
Proof. The distribution of a Gaussian matrix is invariant under orthogonal trans-
formations, and the Frobenius norm is also unitarily invariant. As a result, it repre-
sents no loss of generality to assume that S and T are diagonal. Therefore,
E ∥SGT ∥2
F = E
hX
jk |sjjgjktkk|2i
=
X
jk |sjj|2|tkk|2 = ∥S∥2
F ∥T ∥2
F .
Since the right-hand side is unitarily invariant, we have also identiﬁed the value of
the expectation for general matrices S and T .
The literature contains an excellent bound for the expected spectral norm of a
scaled Gaussian matrix. The result is due to Gordon [62, 63], who established the
bound using a sharp version of Slepian’s lemma.
See [83, §3.3] and [34, §2.3] for
additional discussion.
Proposition A.2. Fix real matrices S, T , and draw a standard Gaussian matrix
G. Then
E ∥SGT∥≤∥S∥∥T ∥F + ∥S∥F ∥T ∥.
A.2. Spectral norm of pseudoinverse. Now, we turn to the pseudoinverse
of a Gaussian matrix.
Recently, Chen and Dongarra developed a good bound on
the probability that its spectral norm is large. The statement here follows from [25,
Lem. 4.1] after an application of Stirling’s approximation. See also [91, Lem. 2.14]
Proposition A.3. Let G be an m×n standard Gaussian matrix with n ≥m ≥2.
For each t > 0,
P
G† > t
	
≤
1
p
2π(n −m + 1)

e√n
n −m + 1
n−m+1
t−(n−m+1).
