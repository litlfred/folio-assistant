---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-004-gold-standard-only-estimation
section_title: "Gold-Standard-Only Estimation"
section_number: null
pages: 7-7
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
To address non-random, nonclassical measurement errors, the most dominant existing approach is to
rely on gold-standard labels. Such methods assume that X∗
i is observed for a small subset of units
sampled according to a known sampling design. Let Ri ∈{0, 1} indicate whether X∗
i is observed, and
define the sampling probability ρi := Pr(Ri = 1 | Yi, Wi, e
Xi) ∈(0, 1]. We assume that the sampling
probability is controlled by the researcher, so that ρi is known and Ri ⊥⊥X∗
i | Yi, Wi, e
Xi. The most
common, simple random sampling is the special case where the sampling probability is constant
and ρi = ρ for all i. The gold-standard-only estimation (GSO) bβGSO uses only the gold-standard
observations and solves
1
n
n
X
i=1
Ri
ρi
ψF (Yi, X∗
i , Wi; β) = 0.
This is equivalent to running downstream regression only using a subset of data that have gold-
standard labels. It is straightforward to show that this estimator is consistent for β∗and asymptoti-
cally normal, allowing for valid statistical inference when the sampling probability is known (Van der
Vaart, 2000). However, GSO tends to be inefficient as it discards information in imperfect labels and
all units without gold-standard labels.
2.2.3
