---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-014
section_title: "Page 14"
pages: 14-14
pdf_page: 14
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 13 -
into S 0, the representation can be simpliﬁed by deleting the zero rows and columns of S 0 to obtain a
new diagonal matrix S , and then deleting the corresponding columns of T 0 and D 0 to obtain T and
S respectively. The result is a reduced model:
X ∼∼Xhihat =TSD ′
which is the rank-k model with the best possible least-squares-ﬁt to X . It is this reduced model,
presented in Figure 3, that we use to approximate our data.
d o c ume n t s
_ _ _ _ _ _ _ _ _ _ _
_ _ _ _ _
_ _ _ _ _
_ _ _ _ _ _ _ _ _ _ _
c
c
c
c
c *
c
c
c
c
ˆ
c
c
c
c
*
c
c
c
c
X
c
=
c
T
c
c
S
* c
c
D
c
c
c
c
c
c _ _ _ _ _ c
c _ _ _ _ _ _ _ _ _ _ _ c
t e rms
c
c
c
c
k
x
k
k
x
d
c
c
c
c
c
c
c
c
c
c
c
c
c _ _ _ _ _ _ _ _ _ _ _ c
c _ _ _ _ _ c
t
x
d
t
x
k
ˆ
X
=
T
S
D
’
Reduced singular value decomposition of the term x document matrix, X . Notation is as in the previous
ﬁgure except that k (≤m ) is the chosen number of dimensions (factors) in the reduced model.
Figure 3
The amount of dimension reduction, i.e., the choice of k , is critical to our work. Ideally, we want
a value of k that is large enough to ﬁt all the real structure in the data, but small enough so that we
do not also ﬁt the sampling error or unimportant details. The proper way to make such choices is an
open issue in the factor analytic literature. In practice, we currently use an operational criterion - a
value of k which yields good retrieval performance.
4.2.2 Geometric interpretation of the SVD model
For purposes of intuition and discussion it is useful to interpret the SVD geometrically. The
rows of the reduced matrices of singular vectors are taken as coordinates of points representing the
documents and terms in a k dimensional space. With appropriate rescaling of the axes, by quantities
related to the associated diagonal values of S , dot products between points in the space can be used
to compare the corresponding objects. The next section details these comparisons.
4.2.3 Computing fundamental comparison quantities from the SVD model
There are basically three sorts of comparisons of interest: those comparing two terms ("How
similar are terms i and j ?"), those comparing two documents ("How similar are documents i and
j ?"), and those comparing a term and a document ("How associated are term i and document j ?").
In standard information retrieval approaches, these amount respectively, to comparing two rows,
comparing two columns, or examining individual cells of the original matrix of term by document
data, X . Here we make similar comparisons, but use the matrix Xhihat , since it is presumed to
