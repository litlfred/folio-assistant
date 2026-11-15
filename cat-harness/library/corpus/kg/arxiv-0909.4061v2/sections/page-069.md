---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-069
section_title: "Page 69"
pages: 69-69
pdf_page: 69
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
69
Markov’s inequality results in
P

Wj ≥
12
n −j · u

≤u−q.
Select u = t · (n −j)/(n −m) to reach
P

Wj ≥
12
n −m · t

≤
n −m
n −j
q
t−q.
To complete the argument, we combine these estimates by means of the union
bound and clean up the resulting mess. Since Z ≤Pm−1
j=0 Wj,
P

Z ≥
12m
n −m · t

≤t−q
m−1
X
j=0
n −m
n −j
q
.
To control the sum on the right-hand side, observe that
m−1
X
j=0
n −m
n −j
q
< (n −m)q
Z m
0
(n −x)−q dx
< (n −m)q
q −1
(n −m)−q+1 = 2(n −m)
n −m −2 ≤4,
where the last inequality follows from the hypothesis n −m ≥4.
Together, the
estimates in this paragraph produce the advertised bound.
Remark A.1. It would be very interesting to ﬁnd more conceptual and extensible
argument that yields accurate concentration results for inverse spectral functions of
a Gaussian matrix.
REFERENCES
[1] D. Achlioptas, Database-friendly random projections: Johnson–Lindenstrauss with binary
coins, J. Comput. System Sci., 66 (2003), pp. 671–687.
[2] D. Achlioptas and F. McSherry, Fast computation of low-rank matrix approximations, J.
Assoc. Comput. Mach., 54 (2007), pp. Art. 9, 19 pp. (electronic).
[3] N. Ailon and B. Chazelle,
Approximate nearest neighbors and the fast Johnson–
Lindenstrauss transform, in STOC ’06: Proc. 38th Ann. ACM Symp. Theory of Com-
puting, 2006, pp. 557–563.
[4] N. Ailon and E. Liberty, Fast dimension reduction using Rademacher series on dual BCH
codes, in STOC ’08: Proc. 40th Ann. ACM Symp. Theory of Computing, 2008.
[5] N. Alon, P. Gibbons, Y. Matias, and M. Szegedy, Tracking join and self-join sizes in
limited storage, in Proc. 18th ACM Symp. Principles of Database Systems (PODS), 1999,
pp. 10–20.
[6] N. Alon, Y. Matias, and M. Szegedy, The space complexity of approximating frequency
moments, in STOC ’96: Proc. 28th Ann. ACM Symp. Theory of Algorithms, 1996, pp. 20–
29.
[7] S. Arora, E. Hazan, and S. Kale, A fast random sampling algorithm for sparsifying matri-
ces, in Approximation, randomization and combinatorial optimization: Algorithms and
Techniques, Springer, Berlin, 2006, pp. 272–279.
[8] A. R. Barron, Universal approximation bounds for superpositions of a sigmoidal function,
IEEE Trans. Inform. Theory, 39 (1993), pp. 930–945.
[9] I. Beichl, The Metropolis algorithm, Comput. Sci. Eng., (2000), pp. 65–69.
[10] M.-A. Bellabas and P. J. Wolfe, On sparse representations of linear operators and the
approximation of matrix products, in Proc. 42nd Ann. Conf. Information Sciences and
Systems (CISS), 2008, pp. 258–263.
