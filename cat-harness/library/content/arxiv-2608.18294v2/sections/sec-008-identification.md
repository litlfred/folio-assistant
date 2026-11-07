---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-008-identification
section_title: "Identification"
section_number: null
pages: 10-10
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
We now discuss how to identify the downstream moment function under the conditional independence
assumption. Here we provide an overview of the two steps, which we elaborate in the subsequent
sections.
The first step is to identify the conditional classification rate defined as
η∗
j,a(d) = Pr(X(j) = 1 | X∗= a, eD = d),
(3.2)
where η∗
j,1(d) denotes the true positive rate and η∗
j,0(d) represents the false positive rate for a specific
proxy j ∈{1, . . . , J}. Here, we build on general nonparametric identification results using array
decomposition (Kruskal, 1977; Allman, Matias and Rhodes, 2009).
Second, given the identified conditional classification rate η∗
j,a(d), we construct a bridge function
that connects the observed proxy X(j) and the unobserved true label X∗(Zhou and Tchetgen Tch-
etgen, 2024; Guo et al., 2026):
Mj( eD) =
X(j) −η∗
j,0( eD)
η∗
j,1( eD) −η∗
j,0( eD)
.
This is a tailored function in that, by construction, it is unbiased for the true label, satisfying
E[Mj( eD) | X∗, eD] = X∗.
More generally, as shown below, we can combine multiple proxy labels to construct a general bridge
function H( e
X, eD) that is unbiased for the true latent variable.
E[H( e
X, eD) | X∗, eD] = X∗.
We can then use this bridge function in place of the true label to build the unbiased, observed
downstream moment.
ψDMM( e
X, eD; β) = {1 −H( e
X, eD)}ψF (Y, 0, W; β) + H( e
X, eD)ψF (Y, 1, W; β).
Under Assumption 3.1, E[ψDMM( e
X, eD; β)] = E[ψF (Y, X∗, W; β)], which will allow for consistent
estimation and valid inference as developed in Section 3.3.
3.2.1
