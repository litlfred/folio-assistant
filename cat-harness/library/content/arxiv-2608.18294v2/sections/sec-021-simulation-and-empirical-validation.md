---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-021-simulation-and-empirical-validation
section_title: "Simulation and Empirical Validation"
section_number: null
pages: 24-24
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
We use simulation studies (Section 6.1) and real-world empirical validation (Section 6.2) to evaluate
DMM. First, a simulation study calibrated based on an empirical study of political advertisements
(Fowler et al., 2021) examines a latent dependent variable under a synthetic data-generating process
that satisfies the conditional independence assumption. This simulation study evaluates the finite-
sample performance of the DMM estimator under the required assumption. Second, an empirical
validation based on Pan and Chen (2018) examines a latent independent variable using LLM anno-
tations. This is an empirical validation study in that we do not impose the conditional independence
assumption, and we empirically evaluate whether DMM without access to the gold-standard labels
can recover the oracle benchmark estimate that relies on gold-standard labels. More details about
each application are provided in Appendix C.
6.1
