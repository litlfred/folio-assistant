---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-046
section_title: "Page 46"
pages: 46-46
pdf_page: 46
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
46
HALKO, MARTINSSON, AND TROPP
10
1
10
2
10
3
0
1
2
3
4
5
6
7
10
1
10
2
10
3
0
1
2
3
4
5
6
7
10
1
10
2
10
3
0
1
2
3
4
5
6
7
ℓ
ℓ
ℓ
n = 1024
n = 2048
n = 4096
t(direct) /t(gauss)
t(direct) /t(srft)
t(direct) /t(svd)
Acceleration factor
Fig. 7.7. Acceleration factor. The relative cost of computing an ℓ-term partial SVD of an n×n
Gaussian matrix using direct, a benchmark classical algorithm, versus each of the three competitors
described in §7.4. The solid red curve shows the speedup using an SRFT test matrix, and the dotted
blue curve shows the speedup with a Gaussian test matrix. The dashed green curve indicates that a
full SVD computation using classical methods is substantially slower. Table 7.1 reports the absolute
runtimes that yield the circled data points.
common in the literature on randomized linear algebra, but our argument is most
similar in spirit to [17].
Section 8 surveys the basic linear algebraic tools we need. Section 9 uses these
methods to derive a generic error bound. Afterward, we specialize these results to the
case where the test matrix is Gaussian (§10) and the case where the test matrix is a
subsampled random Fourier transform (§11).
8. Theoretical preliminaries. We proceed with some additional background
from linear algebra. Section 8.1 sets out properties of positive-semideﬁnite matrices,
and §8.2 oﬀers some results for orthogonal projectors. Standard references for this
material include [11, 72].
8.1. Positive semideﬁnite matrices. An Hermitian matrix M is positive
semideﬁnite (brieﬂy, psd) when u∗Mu ≥0 for all u̸ = 0. If the inequalities are
strict, M is positive deﬁnite (brieﬂy, pd).
The psd matrices form a convex cone,
which induces a partial ordering on the linear space of Hermitian matrices: M ≼N
if and only if N −M is psd. This ordering allows us to write M ≽0 to indicate that
the matrix M is psd.
