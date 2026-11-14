---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-005-debiased-inference-with-gold-standard-labels
section_title: "Debiased Inference with Gold-Standard Labels"
section_number: null
pages: 7-8
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
More recently, a broad class of methods combines predictions available at scale with a smaller sample
of gold-standard measurements to bias-correct downstream analysis. This class of bias-correction
methods includes design-based supervised learning (DSL; Egami et al., 2023, 2026), prediction-
powered inference (PPI; Angelopoulos et al., 2023), methods reviewed in Ludwig, Mullainathan
and Rambachan (2026), MAR-S (Carlson and Dell, 2025), model-assisted impact analysis (Mozer
and Miratrix, 2023), and the control-variate approach of Katsumata and Yamauchi (2023), among
others. All of these methods build on the longstanding literature on semiparametric inference and
causal inference (e.g., Robins, Rotnitzky and Zhao, 1994; Chen and Chen, 2000; Chen, Hong and
Tarozzi, 2008; Chernozhukov et al., 2018). Although these methods share a common prediction-
and-correction strategy, they differ in their sampling designs, prediction-training procedures, and
efficiency adjustments. Here, we use DSL as a representative benchmark.
7
DSL uses the gold-standard observations to train a supervised predictor of the latent independent
variable and then bias-correct prediction errors in the downstream moment function via a doubly
robust procedure. Using cross-fitting, let b
Xi = bg−k(i)(Yi, Wi, e
Xi) ∈[0, 1] denote an out-of-fold pre-
diction of X∗
i where g−k(i) is estimated using gold-standard data excluding the fold k(i) that unit i
belongs to. The prediction model can naturally use all J proxies jointly, together with the observed
outcome and covariates, to predict the true label X∗. The DSL moment function is
ψDSL
i
(β) := ψF (Yi, b
Xi, Wi; β) + Ri
ρi
n
ψF (Yi, X∗
i , Wi; β) −ψF (Yi, b
Xi, Wi; β)
o
.
(2.4)
More generally, the DSL estimator can use any generic out-of-fold prediction bmi(β) for ψF (Yi, X∗
i , Wi; β),
and the expression above with bmi(β) = ψF (Yi, b
Xi, Wi; β) is a special case of the general DSL estima-
tor. The DSL estimator bβDSL solves 1
n
Pn
i=1 ψDSL
i
(β) = 0. This estimator makes a key assumption
that the sampling probability ρi is controlled by and known to researchers. This scenario is common
in many application areas where, for example, researchers choose which documents to be coded by
experts. Under the known sampling design,
E
h
ψDSL
i
(β)

 X∗
i , Yi, Wi, e
Xi, b
Xi
i
= ψF (Yi, X∗
i , Wi; β).
Consequently, DSL targets the oracle parameter even when the supervised prediction model and
LLM annotations are arbitrarily misspecified. These classes of methods are popular and powerful as
they do not require any assumption about errors made by LLMs or any methods used to generate
b
Xi. When b
Xi is more accurate, DSL becomes more accurate too, while it is always valid without any
assumption on b
Xi.
These existing strategies span a continuum between relying on proxy labels and relying on gold-
standard labels. Naive approaches use proxy labels as if they are error-free and they are in general
biased unless proxy labels are perfect. GSO is unbiased and provides valid inference but ignores
proxy labels and can be inefficient. More recent bias-correction methods, such as DSL (Egami et al.,
2023, 2026) and PPI (Angelopoulos et al., 2023), provide valid inference under the known sampling
