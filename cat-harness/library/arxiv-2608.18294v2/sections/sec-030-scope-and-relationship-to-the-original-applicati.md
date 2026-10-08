---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-030-scope-and-relationship-to-the-original-applicati
section_title: "Scope and Relationship to the Original Applications"
section_number: null
pages: 41-41
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
The two analyses are numerical illustrations of DMM rather than exact replications of the origi-
nal substantive studies. In the first application, the original analysis and the DSL validation study
examine differences in political-advertising tone between Facebook and television using the original
expert-coded corpus and a candidate-adjusted downstream analysis (Fowler et al., 2021; Egami et al.,
2026). We instead use a transparent ad-level logistic regression for a binary Promote indicator. The
original annotation file contains 13,040 expert-coded ads. After merging it with the platform and
candidate covariates and retaining complete records, our analysis contains 12,973 unique ads. Im-
portantly, our Facebook coefficient is not the same estimand as the candidate-fixed-effects coefficient
in the original study.
In the second application, the original study codes both prefecture-level and county-level wrong-
doing and includes both variables in a richer downstream specification (Pan and Chen, 2018). We
focus on prefecture-level wrongdoing because it enters the simplified downstream model as a single
main effect. This isolates one latent independent variable and avoids introducing a second latent
variable and the county-wrongdoing interaction used in the original analysis. The resulting coeffi-
cient should therefore be interpreted as the coefficient from the working model defined below, not as
an exact replication of every specification in Pan and Chen (2018).
Expert labels serve three different roles across the exercises. First, they define the full-sample
benchmark in both applications.
Second, they are used to calibrate the synthetic Fowler data-
generating process. Third, they are used retrospectively to rank the available proxy labels by F1
score. They do not enter the feasible DMM moment equations within a Monte Carlo replication
or the DMM fit. The F1-based ranking should consequently be viewed as a device for constructing
interpretable nested proxy sets for evaluation.
C.2
