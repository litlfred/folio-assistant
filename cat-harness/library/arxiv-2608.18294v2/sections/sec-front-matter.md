---
doc_id: arxiv-2608.18294v2
doc_title: "Debiased Inference for AI-Generated Data without Gold-Standard Labels: Identification via Multiple Imperfect Measurements"
section_id: sec-front-matter
section_title: "Front matter"
section_number: null
pages: 1-2
source_pdf: arxiv-2608.18294v2.pdf
source_sha256: fcaed0e452a7fdd9
toc_source: outline
---
Debiased Inference for AI-Generated Data
without Gold-Standard Labels:
Identification via Multiple Imperfect Measurements∗
Naoki Egami†
Sooahn Shin‡
Abstract
An increasing number of scholars use AI to measure variables they subsequently include in
downstream analyses. Although AI-measured variables are often analyzed as if observed without
error, ignoring prediction errors in automated measurement leads to substantial bias and invalid
confidence intervals in downstream analyses, even if AI measurement accuracy is high, e.g., above
90%. Existing solutions, such as design-based supervised learning and prediction-powered infer-
ence, combine error-prone AI-based measurements with gold-standard labels, which may be costly
and difficult to obtain in some application areas.
In this paper, we propose debiased inference with multiple imperfect measurements (DMM),
a framework that combines multiple error-prone AI measurements to enable valid downstream
inference without gold-standard labels. Building on the established results on CP decomposition,
DMM assumes that these measurements are independent conditional on the latent true label and
observed unit-level features, such as text features represented by embeddings. This framework
allows for unknown misclassification rates to vary across annotation methods (e.g., large language
models) and across units of annotation (e.g., texts). Under this assumption, we use semiparamet-
ric inference theory to prove that the DMM estimator is consistent and asymptotically normal,
enabling valid inference for a wide range of downstream statistical analyses common in the so-
cial sciences.
Our simulation results show that DMM yields valid inference and that adding
accurate, though imperfect, measurements can improve efficiency. Focusing on common applica-
tions of large language model annotations, we also develop diagnostics to assess the conditional
independence assumption.
∗We thank Betsy Ogburn, Helen Guo, AmirEmad Ghassami, and Ilya Shpitser for thoughtful comments.
†Associate Professor, Department of Political Science and Statistics and Data Science Center, Massachusetts Insti-
tute of Technology, Cambridge, MA 02139. Email: egami@mit.edu URL: https://naokiegami.com
‡Postdoctoral Associate, Department of Political Science, Massachusetts Institute of Technology, Cambridge, MA
02139. Email: sshin3@mit.edu URL: https://sooahnshin.com
1
arXiv:2608.18294v2  [stat.ME]  1 Sep 2026
1
