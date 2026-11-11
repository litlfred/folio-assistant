---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-042
section_title: "Page 42"
pages: 42-42
pdf_page: 42
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
42
HALKO, MARTINSSON, AND TROPP
Laplacian matrix
L = I −D−1/2W D−1/2,
where D is the diagonal matrix with entries dii = P
j wij. These are the eigenvectors
associated with the dominant eigenvalues of the auxiliary matrix A = D−1/2W D−1/2.
The matrix A is large, and its eigenvalues decay slowly, so we use the power
scheme summarized in Algorithm 4.3 to approximate it. Figure 7.5[left] illustrates
how the approximation error eℓdeclines as the number ℓof samples increases. When
we set the exponent q = 0, which corresponds with the basic Algorithm 4.1, the
approximation is rather poor. The graph illustrates that increasing the exponent q
slightly results in a tremendous improvement in the accuracy of the power scheme.
Next, we illustrate the results of using the two-stage approach to approximate the
eigenvalues of A. In Stage A, we construct a basis for A using Algorithm 4.3 with
ℓ= 100 samples for diﬀerent values of q. In Stage B, we apply the Hermitian variant of
Algorithm 5.1 described in §5.3 to compute an approximate eigenvalue decomposition.
Figure 7.5[right] shows the approximate eigenvalues and the actual eigenvalues of A.
Once again, we see that the minimal exponent q = 0 produces miserable results, but
the largest eigenvalues are quite accurate even for q = 1.
0
20
40
60
80
100
0
0.1
0.2
0.3
0.4
0.5
0.6
0.7
0.8
0.9
1
0
20
40
60
80
100
0
0.1
0.2
0.3
0.4
0.5
0.6
0.7
0.8
0.9
1
 
 
ℓ
j
Approximation error eℓ
Estimated Eigenvalues λj
Magnitude
“Exact” eigenvalues
λj for q = 3
λj for q = 2
λj for q = 1
λj for q = 0
Fig. 7.5. Approximating a graph Laplacian. For varying exponent q, one trial of the power
scheme, Algorithm 4.3, applied to the 9025× 9025 matrix A described in §7.2. [Left] Approximation
errors as a function of the number ℓof random samples.
[Right] Estimates for the 100 largest
eigenvalues given ℓ= 100 random samples compared with the 100 largest eigenvalues of A.
7.3. Eigenfaces. Our next example involves a large, dense matrix derived from
the FERET databank of face images [107,108]. A simple method for performing face
recognition is to identify the principal directions of the image data, which are called
eigenfaces. Each of the original photographs can be summarized by its components
