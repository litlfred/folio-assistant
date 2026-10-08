---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-025-proofs
section_title: "Proofs"
section_number: null
pages: 33-33
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
Throughout this section, partition {1, . . . , n} into K folds I1, . . . , IK. For each fold k, let I−k =
{1, . . . , n} \ Ik denote the corresponding training indices and let nk = |Ik|, where Oi = (Yi, e
Xi, eDi).
Nuisance estimates indexed by (−k) are fitted using observations indexed by I−k.
We take the
number of folds and the fold proportions to be fixed. For any measurable function f, write
Pf = E{f(O)},
Pn,kf = 1
nk
X
i∈Ik
f(Oi),
Pnf = 1
n
n
X
i=1
f(Oi).
For a generic nuisance collection η := {ηj,0(·), ηj,1(·)}J
j=1, let
ψDMM(O; β, η) = {1 −HR( e
X, eD; η)}ψ0(Y, W; β) + HR( e
X, eD; η)ψ1(Y, W; β)
where HR( e
X, eD; η∗) = 3H2( e
X, eD; η∗)−2H3( e
X, eD; η∗) and ψa(Y, W; β) := ψF (Y, X∗= a, W; β). The
fold-specific fitted objects are denoted by c
Mj,−k = Mj( eD; bη−k) and bHR
−k = HR( e
X, eD; bη−k), whereas
Mj,0 = Mj( eD; η∗) and HR
0 = HR( e
X, eD; η∗) denote their population counterparts.
A.1
