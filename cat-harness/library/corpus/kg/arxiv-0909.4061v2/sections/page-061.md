---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-061
section_title: "Page 61"
pages: 61-61
pdf_page: 61
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
61
Invoke Theorem 10.6 to bound the right-hand side, noting that σj(B) = σ2q+1
j
.
The true message of Corollary 10.10 emerges if we bound the series using its
largest term σ4q+2
k+1 and draw the factor σk+1 out of the bracket:
E ∥(I −PZ)A∥≤
"
1 +
s
k
p −1 + e√k + p
p
·
p
min{m, n} −k
#1/(2q+1)
σk+1.
In words, as we increase the exponent q, the power scheme drives the extra factor in
the error to one exponentially fast. By the time q ∼log (min{m, n}),
E ∥(I −PZ)A∥∼σk+1,
which is the baseline for the spectral norm.
In most situations, the error bound given by Corollary 10.10 is substantially better
than the estimates discussed in the last paragraph. For example, suppose that the
tail singular values exhibit the decay proﬁle
σj ≲j(1+ε)/(4q+2)
for j > k and ε > 0.
Then the series in Corollary 10.10 is comparable with its largest term, which allows
us to remove the dimensional factor min{m, n} from the error bound.
To obtain large deviation bounds for the performance of the power scheme, simply
combine Theorem 9.2 with Theorem 10.8. We omit a detailed statement.
Remark 10.1.
We lack an analogous theory for the Frobenius norm because
Theorem 9.2 depends on Proposition 8.6, which is not true for the Frobenius norm.
It is possible to obtain some results by estimating the Frobenius norm in terms of the
spectral norm.
11. SRFT test matrices. Another way to implement the proto-algorithm from
§1.3 is to use a structured random matrix so that the matrix product in Step 2 can
be performed quickly. One type of structured random matrix that has been proposed
in the literature is the subsampled random Fourier transform, or SRFT, which we
discussed in §4.6. In this section, we present bounds on the performance of the proto-
algorithm when it is implemented with an SRFT test matrix. In contrast with the
results for Gaussian test matrices, the results in this section hold for both real and
complex input matrices.
11.1. Construction and Properties. Recall from §4.6 that an SRFT is a tall
n × ℓmatrix of the form Ω=
p
n/ℓ· DF R∗where
• D is a random n × n diagonal matrix whose entries are independent and
uniformly distributed on the complex unit circle;
• F is the n × n unitary discrete Fourier transform; and
• R is a random ℓ× n matrix that restricts an n-dimensional vector to ℓcoor-
dinates, chosen uniformly at random.
Up to scaling, an SRFT is just a section of a unitary matrix, so it satisﬁes the norm
identity ∥Ω∥=
p
n/ℓ.
The critical fact is that an appropriately designed SRFT
approximately preserves the geometry of an entire subspace of vectors.
