---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-031-model-specification
section_title: "Model Specification"
section_number: null
pages: 41-42
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
Both applications use the same low-dimensional logistic latent-class model for the measurement
nuisance functions. To describe the common implementation, let L∗
i ∈{0, 1} denote a generic latent
binary label, let eLi = (L(1)
i , . . . , L(J)
i
) collect its binary proxy labels, and let Zi denote the nuisance-
41
model design vector, including an intercept. The correspondence is
Fowler:
L∗
i = Y ∗
i ,
Zi = (1, Ti, W ⊤
i )⊤,
Pan–Chen:
L∗
i = X∗
i ,
Zi = (1, W ⊤
i )⊤
where Ti is the main independent variable, an indicator for Facebook advertisements. We posit
pi := Pr(L∗
i = 1 | Zi) = expit(Z⊤
i α),
ηij,a := ηj,a(Zi) := Pr(L(j)
i
= 1 | L∗
i = a, Zi) = expit(Z⊤
i γj,a),
a ∈{0, 1},
where expit(u) = {1 + exp(−u)}−1. Conditional independence implies the observed-data likelihood
L(θ) =
n
Y
i=1
"
(1 −pi)
J
Y
j=1
η
L(j)
i
ij,0 (1 −ηij,0)1−L(j)
i
+ pi
J
Y
j=1
η
L(j)
i
ij,1 (1 −ηij,1)1−L(j)
i
#
,
(C.1)
where θ = (α, {γj,a}j,a). The downstream dependent variable is not included in this likelihood. In
particular, in the Pan–Chen analysis, upward reporting is not used to infer the latent wrongdoing
label. Thus, we impose two substantively reasonable conditional independence assumptions and use
the corresponding nuisance models: X(1) ⊥⊥· · ·⊥⊥X(J) | X∗, W and e
X ⊥⊥Y | X∗, W, which jointly
imply Assumption 3.1.
C.2.1
