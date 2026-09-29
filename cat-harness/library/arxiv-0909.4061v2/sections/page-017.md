---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-017
section_title: "Page 17"
pages: 17-17
pdf_page: 17
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
17
deviate far from their mean. This work opened a new era in geometric analysis where
the probabilistic method became a basic instrument.
Another prominent example of measure concentration is Kashin’s computation
of the Gel’fand widths of the ℓ1 ball [77], subsequently reﬁned in [59]. This work
showed that a random (N−n)-dimensional projection of the N-dimensional ℓ1 ball has
an astonishingly small Euclidean diameter: approximately
p
(1 + log(N/n))/n. In
contrast, a nonzero projection of the ℓ2 ball always has Euclidean diameter one. This
basic geometric fact undergirds recent developments in compressive sampling [21].
We have already described a third class of examples: the randomized embeddings
of Johnson–Lindenstrauss [74] and of Bourgain [15].
Finally, we mention Maurey’s technique of empirical approximation. The original
work was unpublished; one of the earliest applications appears in [24, §1]. Although
Maurey’s idea has not received as much press as the examples above, it can lead
to simple and eﬃcient algorithms for sparse approximation. For some examples in
machine learning, consider [8, 84, 110,119]
The importance of random constructions in the geometric analysis community
has led to the development of powerful techniques for studying random matrices.
Classical random matrix theory focuses on a detailed asymptotic analysis of the spec-
tral properties of special classes of random matrices. In contrast, geometric analysts
know methods for determining the approximate behavior of rather complicated ﬁnite-
dimensional random matrices. See [34] for a fairly current survey article. We also
mention the works of Rudelson [115] and Rudelson–Vershynin [116], which describe
powerful tools for studying random matrices drawn from certain discrete distribu-
tions. Their papers are rooted deeply in the ﬁeld of geometric functional analysis, but
they reach out toward computational applications.
3. Linear algebraic preliminaries. This section summarizes the background
we need for the detailed description of randomized algorithms in §§4–6 and the anal-
ysis in §§8–11. We introduce notation in §3.1, describe some standard matrix de-
compositions in §3.2, and brieﬂy review standard techniques for computing matrix
factorizations in §3.3.
3.1. Basic deﬁnitions. The standard Hermitian geometry for Cn is induced by
the inner product
⟨x, y⟩= x · y =
X
j xj yj.
The associated norm is
∥x∥2 = ⟨x, x⟩=
X
j |xj|2.
We usually measure the magnitude of a matrix A with the operator norm
∥A∥= max
x̸=0
∥Ax∥
∥x∥,
which is often referred to as the spectral norm. The Frobenius norm is given by
∥A∥F =
hX
jk |ajk|2i1/2
.
The conjugate transpose, or adjoint, of a matrix A is denoted A∗. The important
identities
∥A∥2 = ∥A∗A∥= ∥AA∗∥
