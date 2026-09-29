---
doc_id: deerwester-1990-indexing-by-lsa
doc_title: "deerwester-1990-indexing-by-lsa"
section_id: page-013
section_title: "Page 13"
pages: 13-13
pdf_page: 13
source_pdf: deerwester-1990-indexing-by-lsa.pdf
source_sha256: 481bc284ba24c9a6
text_source: embedded
granularity: page
---
Deerwester
- 12 -
row, column and sign permutations5 and by convention the diagonal elements of S 0 are constructed
to be all positive and ordered in decreasing magnitude.
Figure 2 presents a schematic of the singular value decomposition for a t xd matrix of terms by
documents.
d o c ume n t s
_ _ _ _ _ _ _ _ _ _ _
_ _ _ _ _ _ _ _ _ _ _
_ _ _ _ _ _ _ _ _ _ _
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
c
c
c
c
*
c
c
c
c
c
c
c
c
*
c
c
c
c
c
c
c
c
*
c
c
c
t e rms
c
X
c
=
c
T
c
c
S
*
c
c
D
’
c
c
c
c
0
c
c
0
* c
c
0
c
c
c
c
c
c _ _ _ _ _ _ _ _ _ _ _ c
c _ _ _ _ _ _ _ _ _ _ _ c
c
c
c
c
m x m
m x
d
c _ _ _ _ _ _ _ _ _ _ _ c
c _ _ _ _ _ _ _ _ _ _ _ c
t
x
d
t
x m
X
=
T
S
D
’
0
0
0
Singular value decomposition of the term x document matrix, X . Where :
T 0 has orthogonal, unit-length columns (T 0′T 0=I )
D 0 has orthogonal, unit-length columns (D 0′D 0=I )
S 0 is the diagonal matrix of singular values
t is the number of rows of X
d is the number of columns of X
m is the rank of X (≤min(t , d ))
Figure 2
In general, for X =T 0S 0D 0′ the matrices T 0, D 0, and S 0 must all be of full rank. The beauty of
an SVD, however, is that it allows a simple strategy for optimal approximate ﬁt using smaller
matrices. If the singular values in S 0 are ordered by size, the ﬁrst k largest may be kept and the
remaining smaller ones set to zero. The product of the resulting matrices is a matrix Xhihat which
is only approximately equal to X , and is of rank k . It can be shown that the new matrix Xhihat is
the matrix of rank k which is closest in the least squares sense to X . Since zeros were introduced
hhhhhhhhhhhhhhh
4. SVD is closely related to the standard eigenvalue-eigenvector or spectral decomposition of a square symmetric
matrix, Y , into VLV ′, where V is orthonormal and L is diagonal. The relation between SVD and eigen
analysis is more than one of analogy. In fact, T 0 is the matrix of eigen vectors of the square symmetric matrix
Y =XX ′, D 0 is the matrix of eigen vectors of Y =X ′X , and in both cases, S 02 would be the matrix, L , of
eigenvalues.
5. Allowable permutations are those that leave S 0 diagonal and maintain the correspondences with T 0 and D 0.
That is, column i and j of S 0 may be interchanged iff row i and j of S 0 are interchanged, and columns i and
j of T 0 and D 0 are interchanged.
