---
doc_id: arxiv-0909.4061v2
doc_title: "arxiv-0909.4061v2"
section_id: page-040
section_title: "Page 40"
pages: 40-40
pdf_page: 40
source_pdf: arxiv-0909.4061v2.pdf
source_sha256: d5d99d95b3d9657d
text_source: embedded
granularity: page
---
40
HALKO, MARTINSSON, AND TROPP
0
50
100
150
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
2
 
 
ℓ
log10(fℓ)
log10(eℓ)
log10(σℓ+1)
Approximation errors
Order of magnitude
Fig. 7.2. Approximating a Laplace integral operator. One execution of Algorithm 4.2 for the
200 × 200 input matrix A described in §7.1.
The number ℓof random samples varies along the
horizontal axis; the vertical axis measures the base-10 logarithm of error magnitudes. The dashed
vertical lines mark the points during execution at which Figure 7.3 provides additional statistics.
−5.5
−5
−4.5
−5
−4.5
−4
−3.5
−3
−9.5
−9
−8.5
−9
−8.5
−8
−7.5
−7
−13.5
−13
−12.5
−13
−12.5
−12
−11.5
−11
−16
−15.5
−15
−15.5
−15
−14.5
−14
−13.5
log10(eℓ)
log10(fℓ)
“y = x”
Minimal
error
ℓ= 25
ℓ= 50
ℓ= 75
ℓ= 100
Fig. 7.3. Error statistics for approximating a Laplace integral operator.
2,000 trials of Al-
gorithm 4.2 applied to a 200 × 200 matrix approximating the integral operator (7.1). The panels
isolate the moments at which ℓ= 25, 50, 75, 100 random samples have been drawn. Each solid point
compares the estimated error fℓversus the actual error eℓin one trial; the open circle indicates the
trial detailed in Figure 7.2. The dashed line identiﬁes the minimal error σℓ+1, and the solid line
marks the contour where the error estimator would equal the actual error.
