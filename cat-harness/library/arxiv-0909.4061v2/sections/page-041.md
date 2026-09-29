---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-041
section_title: "Page 41"
pages: 41-41
pdf_page: 41
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
PROBABILISTIC ALGORITHMS FOR MATRIX APPROXIMATION
41
We applied Algorithm 4.2 to the 1596 × 532 matrix B associated with a lattice
in which there were 532 nodes (red) on the “inner ring” and 1596 nodes on the (blue)
“outer ring.” Each application of B to a vector requires the solution of a sparse linear
system of size roughly 140 000×140 000. We implemented the scheme in Matlab using
the “backslash” operator for the linear solve. The results of a typical trial appear in
Figure 7.4. Qualitatively, the performance matches the results in Figure 7.3.
0
50
100
150
−20
−18
−16
−14
−12
−10
−8
−6
−4
−2
0
 
 
ℓ
log10(fℓ)
log10(eℓ)
log10(σℓ+1)
Approximation errors
Order of magnitude
Fig. 7.4. Approximating the inverse of a discrete Laplacian. One execution of Algorithm 4.2
for the 1596 × 532 input matrix B described in §7.1. See Figure 7.2 for notations.
7.2. A large, sparse, noisy matrix arising in image processing. Our next
example involves a matrix that arises in image processing. A recent line of work uses
information about the local geometry of an image to develop promising new algorithms
for standard tasks, such as denoising, inpainting, and so forth. These methods are
based on approximating a graph Laplacian associated with the image. The dominant
eigenvectors of this matrix provide “coordinates” that help us smooth out noisy image
patches [120,131].
We begin with a 95 × 95 pixel grayscale image. The intensity of each pixel is
represented as an integer in the range 0 to 4095. We form for each pixel i a vector
x(i) ∈R25 by gathering the 25 intensities of the pixels in a 5 × 5 neighborhood
centered at pixel i (with appropriate modiﬁcations near the edges). Next, we form
the 9025 × 9025 weight matrix f
W that reﬂects the similarities between patches:
ewij = exp

−
x(i) −x(j)2/σ2	
,
where the parameter σ = 50 controls the level of sensitivity. We obtain a sparse
weight matrix W by zeroing out all entries in f
W except the seven largest ones in
each row. The object is then to construct the low frequency eigenvectors of the graph
