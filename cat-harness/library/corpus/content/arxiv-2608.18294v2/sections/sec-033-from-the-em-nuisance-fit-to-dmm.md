---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-033-from-the-em-nuisance-fit-to-dmm
section_title: "From the EM Nuisance Fit to DMM"
section_number: null
pages: 43-44
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
Let b∆ij := bηij,1 −bηij,0. In the implementation, the denominator is stabilized as
b∆ij,ϵ =
(
max(b∆ij, ϵ),
b∆ij ≥0,
min(b∆ij, −ϵ),
b∆ij < 0,
ϵ = 0.05,
and the fitted single-proxy bridge is
c
Mij = L(j)
i
−bηij,0
b∆ij,ϵ
.
The robust bridge is then
bHR
i = 3
J
2
−1 X
j1<j2
c
Mij1 c
Mij2 −2
J
3
−1
X
j1<j2<j3
c
Mij1 c
Mij2 c
Mij3.
43
The floor is a finite-sample stabilization device rather than part of the population identification
argument.
For the Fowler latent-outcome analysis, let ri = (1, Ti, W ⊤
i )⊤.
The final estimate solves the
generated-outcome quasi-score
1
n
n
X
i=1
ri
n
bHR
i −expit(r⊤
i β)
o
= 0.
(C.4)
For the Pan–Chen latent-independent-variable analysis, the final estimate solves
1
n
n
X
i=1
h
{1 −bHR
i }ψ0(Yi, Wi; β) + bHR
i ψ1(Yi, Wi; β)
i
= 0.
(C.5)
Sandwich standard errors are computed from the empirical moment function variance and Jacobian,
as in equations (3.13)–(3.15).
C.3
