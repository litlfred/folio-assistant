---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-019-diagnostics-without-gold-standard-labels
section_title: "Diagnostics Without Gold-Standard Labels"
section_number: null
pages: 22-23
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
In most applications, researchers can also conduct a diagnostic test to evaluate the observable impli-
cations of the conditional independence assumption.
With exactly three binary proxies and two latent classes, the unrestricted latent-class model is
generically just identified at each fixed value eD = d: the observed label distribution has 23 −1 = 7
degrees of freedom, equal to the 2J +1 = 7 latent-class and measurement parameters. Consequently,
22
the three-proxy model supplies no generic overidentifying restrictions. With J ≥4 proxies, however,
the number of overidentifying restrictions at each fixed d is (2J −1) −(2J + 1) = 2J −2J −2. These
restrictions can be assessed by comparing the fitted product-mixture distribution in equation (3.3),
with the empirical joint label distribution (i.e., P
i 1{ e
Xi = ex, eDi = d}/ P
i 1{ eDi = d}), using a
parametric bootstrap deviance or an analogous conditional moment test. When eD is continuous or
high-dimensional, cross-fitted residual interaction moments or held-out predictive checks are more
practical than cell-by-cell tests.
A complementary, target-specific diagnostic exploits the fact that every informative subset of
at least three valid proxies identifies the same downstream parameter. Let bβDMM
S
denote the DMM
estimate obtained from label subset S. Under the identifying assumptions, bβDMM
S
should agree across
subsets up to sampling errors. A joint bootstrap or multiplier-bootstrap test can therefore assess
heterogeneity among the subset-specific estimates. As usual, this is simply a specification diagnostic
rather than a direct test of conditional independence: the failure to reject the null hypothesis of
no difference across the DMM estimators based on different subsets of proxies does not imply the
validity of the conditional independence assumption.
5.3
