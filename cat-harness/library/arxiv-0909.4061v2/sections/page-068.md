---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-068
section_title: "Page 68"
pages: 68-68
pdf_page: 68
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
68
HALKO, MARTINSSON, AND TROPP
A.3.2. Proof of Theorem A.6. Let G be an m × n Gaussian matrix, where
we assume that n −m ≥4. Deﬁne the random variable
Z =
G†2
F .
Our goal is to develop a tail bound for Z.
The argument is inspired by work of
Szarek [130, §6] for square Gaussian matrices.
The ﬁrst step is to ﬁnd an explicit, tractable representation for the random vari-
able. According to Proposition A.7, a Gaussian matrix G is orthogonally equivalent
with a bidiagonal matrix L of the form (A.1). Making an analogy with the inversion
formula for a triangular matrix, we realize that the pseudoinverse of L is given by
L† =


X−1
n
−Ym−1
XnXn−1
X−1
n−1
−Ym−2
Xn−1Xn−2
X−1
n−2
...
...
−Y1
Xn−(m−2)Xn−(m−1)
X−1
n−(m−1)


n×m
.
Because L† is orthogonally equivalent with G† and the Frobenius norm is unitarily
invariant, we have the relations
Z =
G†2
F =
L†2
F ≤
m−1
X
j=0
1
X2
n−j
 
1 +
Y 2
m−j
X2
n−j+1
!
,
where we have added an extra subdiagonal term (corresponding with j = 0) so that
we can avoid exceptional cases later. We abbreviate the summands as
Wj =
1
X2
n−j
 
1 +
Y 2
m−j
X2
n−j+1
!
,
j = 0, 1, 2, . . ., m −1.
Next, we develop a large deviation bound for each summand by computing a mo-
ment and invoking Markov’s inequality. For the exponent q = (n−m)/2, Lemmas A.9
and A.10 yield
Eq(Wj) = Eq(X−2
n−j) · Eq
"
1 +
Y 2
m−j
X2
n−j+1
#
≤Eq(X−2
n−j)

1 + Eq(Y 2
m−j) · Eq(X−2
n−j+1)

≤
3
n −j

1 + 3(m −j + q)
n −j + 1

=
3
n −j

1 + 3 −3(n −m + 1 −q)
n −j + 1

Note that the ﬁrst two relations require the independence of the variates and the
triangle inequality for the Lq norm. The maximum value of the bracket evidently
occurs when j = 0, so
Eq(Wj) <
12
n −j ,
j = 0, 1, 2, . . ., m −1.
