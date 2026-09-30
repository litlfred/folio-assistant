---
doc_id: qi-hessen-vanderheijden-2023-ca-vs-lsa
doc_title: "RESEARCH Improving information retrieval through correspondence analysis instead of latent semantic analysis Qianqian Qi1 · David J. Hessen1 · Peter G.M. van der Heijden1,2 © The A"
section_id: sec-008-32-changing-the-contributions-of-the-initial-dim
section_title: "Changing the contributions of the initial dimensions in SVD"
section_number: 3.2
pages: 6-8
source_pdf: qi-hessen-vanderheijden-2023-ca-vs-lsa.pdf
source_sha256: c1816a290472bb83
toc_source: outline
---
Caron (2001) proposed adjusting the relative strengths of vector components in LSA using
Ukα
k or Vkα
k as coordinates instead of Ukk or Vkk, where α is the singular value
123
Journal of Intelligent Information Systems
weighting exponent that adjusts the importance of the dimensions. The weighting exponent
α determines how components are weighted relative to the standard α = 1 case described in
Section 2.1. In comparison to α = 1, α < 1 gives less emphasis to initial dimensions, and
α > 1, more emphasis.
BullinariaandLevy(2012)usedbothweightingexponentα < 1andtheexclusionofinitial
dimensions, which led to performance improvements of a similar degree. They argued that the
general pattern appears to be that the dimensions with the highest singular values tend not to
contribute the most useful information about semantics and have a large “noise” component
that is best removed or reduced. However, it is unclear what the initial dimensions actually
correspond to. Given this context, we change the contributions of the initial dimensions
extracted by both LSA and CA and compare their performances. We explore whether the
performance of CA can be improved by adjusting the singular value weighting exponent
using kα
k or kα
k as coordinates instead of kk or kk. That is, we try to improve
the performance of CA by using the method (adjusting the singular weighting exponent) used
in LSA.
We use Table 1 to illustrate the impact of α on singular values and coordinates. We use
α = 0.5, α = 1, and α = 1.5. In the literature, we regularly encounter α = 0.5 because it
relates to
F = UV T =

U1/2 
1/2V T 
(10)
which can then be used for making biplots (Gabriel, 1971) using coordinate pairs U21/2
2
and
V21/2
2 . In practice, one often sees the use of the coordinate pair U22 and V22; however,
this is not a biplot representation as 2 is used twice. In a biplot, if the row points are U2a
2,
then the column points are V21−a
2
, i.e., any entry of the matrix is approximated by the
inner product of the corresponding row and column vectors. Hereafter, we do not make a
biplot; instead, we make a symmetric plot where documents and terms have the same value
of α because symmetric coordinates are usually used in experiments (Dumais et al., 1988;
Deerwester et al., 1990; Berry et al., 1995; Levy et al., 2015).
Table 2 lists the singular values to the power α: σ α, the squared singular values to the power
α: σ 2α, and proportions σ 2α/ 
σ σ 2α, where we refer to the total sum of squared singular
values to the power of α, 
σ σ 2α, as α–inertia. These proportions show how the sum of
the Euclidean distances of all components to the origin is distributed over the components.
The greater α is, the more emphasis is given to the initial components and less emphasis
to the latter ones. The ﬁrst dimension accounts for 0.623, 0.855, and 0.943 of α-inertia,
Table 2 The σ α, σ 2α, and the
proportion of explained α-inertia
σ 2α/ 
σ σ 2α for each
dimension of LSA-RAW
dim1
dim2
dim3
dim4
dim5
σ 0.5
2.903
1.806
0.994
0.758
0.522
σ 1
8.425
3.261
0.988
0.574
0.272
σ 1/ 
σ σ 1
0.623
0.241
0.073
0.042
0.020
σ 1
8.425
3.261
0.988
0.574
0.272
σ 2
70.985
10.635
0.976
0.330
0.074
σ 2/ 
σ σ 2
0.855
0.128
0.012
0.004
0.001
σ 1.5
24.455
5.889
0.982
0.435
0.142
σ 3
598.063
34.684
0.964
0.189
0.020
σ 3/ 
σ σ 3
0.943
0.055
0.002
0.000
0.000
123
Journal of Intelligent Information Systems
while the ﬁfth dimension accounts for 0.020, 0.001, and 0.000, with α being 0.5, 1, and 1.5,
respectively. The standard LSA solution has α = 1.
Figure 2 shows the two-dimensional plots of documents and terms for LSA-RAW with
α = 0.5, 1.5. The standard coordinates with α = 1 was shown in Fig. 1a. As α increases,
the Euclidean distances between row points (column points) on the ﬁrst dimension increase
relative to the second dimension.
