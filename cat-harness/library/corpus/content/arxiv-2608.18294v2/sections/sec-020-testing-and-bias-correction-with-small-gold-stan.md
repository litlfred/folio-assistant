---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-020-testing-and-bias-correction-with-small-gold-stan
section_title: "Testing and Bias-Correction with Small Gold-Standard Data"
section_number: null
pages: 23-24
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
When the conditional independence assumption is in serious doubt, it is generally recommended to
collect the gold-standard labels, even for a small amount of data, for two reasons: (a) direct testing of
the conditional independence assumption and (b) bias correction without assuming the conditional
independence assumption.
First, a gold-standard sample permits a direct assessment of the conditional independence as-
sumption. Let R indicate that X∗is observed and let ρ be its known sampling probability, as in
Section 2.
For a subset of labels S with |S| ≥2, conditional independence implies the residual
moment restriction
E

R
ρ 1{X∗= a}h( eD)
Y
j∈S
n
X(j) −η∗
j,a( eD)
o

= 0,
a ∈{0, 1},
for suitable instrument functions h. Pair and higher-order residual products can be tested jointly
using cross-fitted estimates of the class-specific label means. With low-dimensional discrete covariates,
the same idea can be implemented using stratified log-linear or permutation tests. Again, because a
small validation sample may have limited power, failure to reject these tests should not be interpreted
as establishing the conditional independence assumption.
Second, a small validation sample can also be used to combine DMM and methods that use
validation data, such as DSL and PPI, to directly bias-correct downstream inference.
The DSL
correction can be applied to any cross-fitted imputation of the full-data moment function, not only
one obtained from a supervised prediction of the latent label. We therefore use the DMM moment
function as an imputation in the DSL framework. Let bψDMM
i
(β) denote the cross-fitted DMM moment
function, which is available for every unit, and recall that ψF (Yi, X∗
i , Wi; β) denotes the full-data
moment function, which is observed only when Ri = 1. The resulting DMM-assisted DSL moment
function is
bψDMM-DSL
i
(β) = bψDMM
i
(β) + Ri
ρi
n
ψF (Yi, X∗
i , Wi; β) −bψDMM
i
(β)
o
.
(5.1)
Thus, DMM imputes the full-data moment function for all observations, and the validation observa-
tions estimate and correct any remaining imputation error.
23
Under the known sampling design for obtaining gold-standard labels without assuming conditional
independence of multiple imperfect measurements,
E
h
bψDMM-DSL
i
(β) | X∗
i , eDi, e
Xi, I−k(i)
i
= ψF (Yi, X∗
i , Wi; β),
where I−k(i) denotes the sample used to construct the cross-fitted DMM nuisance estimates. This
identity does not require the DMM conditional-independence model to be correct. The validation
design therefore provides validity, while DMM serves as an imputation or control variate that can
improve precision when its bridge-based moment function is informative.
More generally, the DMM-assisted DSL moment can be written as the following control-variate
adjustment (or power-tuning version in Angelopoulos, Duchi and Zrnic, 2023):
bψDMM-DSL
i
(β; C) = Ri
ρi
ψF (Yi, X∗
i , Wi; β)
|
{z
}
gold-standard-only moment
−C
Ri
ρi
−1

bψDMM
i
(β)
|
{z
}
mean-zero control variate
,
(5.2)
where C is a scalar for a scalar moment or a conformable matrix for a vector-valued moment. The
coefficient C may be estimated on separate folds to reduce the asymptotic variance. Setting C = 0
yields gold-standard-only estimation, whereas setting C = I yields equation (5.1).
6
