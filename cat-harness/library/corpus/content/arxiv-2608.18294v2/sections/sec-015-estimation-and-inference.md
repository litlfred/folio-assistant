---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-015-estimation-and-inference
section_title: "Estimation and Inference"
section_number: null
pages: 19-19
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
Estimation follows Section 3. Within each training fold, estimate the conditional latent-class model
of eY given eD, apply the same anchoring rule, and construct the out-of-fold bridge bHR
Y,i. Define
bϕDMM
Y,i
(β) = (1 −bHR
Y,i)ϕF (0, Wi; β) + bHR
Y,iϕF (1, Wi; β),
and let bβDMM
Y
solve
1
n
n
X
i=1
bϕDMM
Y,i
(β) = 0.
Theorem 4.1 (Large-sample theory for a latent dependent variable). Suppose the direct analogs of
the conditions in Theorem 3.2 hold. In particular, for the same compact neighborhood B0, suppose
that there exists a finite constant C such that supβ∈B0

ϕF (1, W; β) −ϕF (0, W; β)

 ≤C a.s. Let
δY,n = max
k,j,a

bηY,(−k)
j,a
−η∗
j,a

2,P .
If δY,n = op(1), then bβDMM
Y
p→β∗. If, in addition, δY,n = op(n−1/4), then
√n(bβDMM
Y
−β∗) ⇝N

0, A−1
Y,0ΩY,0A−⊤
Y,0

,
where
AY,0 = −E
"
(1 −HR
Y (eY , eD; η∗)) ∂ϕF (Y ∗= 0, W; β)
∂β⊤

β=β∗+ HR
Y (eY , eD; η∗) ∂ϕF (Y ∗= 1, W; β)
∂β⊤

β=β∗
#
,
ΩY,0 = E
h
ϕDMM
Y
(eY , eD; β∗, η∗)ϕDMM
Y
(eY , eD; β∗, η∗)⊤i
.
The result follows from Proposition 3.1 and Theorem 3.2 after replacing (X∗, e
X, ψa) with (Y ∗, eY , ϕa).
The covariance matrix can be estimated by the plug-in estimator for AY,0 and ΩY,0.
4.2
