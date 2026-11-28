---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-038-analysis-for-training-and-test-data-in-forml4
section_title: "Analysis for Training and Test Data in FormL4"
section_number: null
pages: 29-29
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
To showcase the connection between the training data provided by FORML4 and the test sets,
we conduct standard supervised fine-tuning on the Mistral-7B (Jiang et al., 2023b) model using
the training data provided by FORML4, with training hyperparameters detailed in Appendix I.1.
We compare it with a model trained on 5k sampled training data provided by FORML4. Their
autoformalization performance on our three test sets is listed in Table 13.
Table 13: Comparison of models trained on different data sizes.
Model
Basic
Random
Real
Mistral
0.12
0.00
0.21
Mistral (5K)
20.12
16.19
2.82
Mistral (Full)
28.87
21.47
5.34
We demonstrate the following insights:
Training Data Always Matters: Our study reveals a strong correlation between the test and training
data provided in our FORML4. By enlarging the training dataset from 5k to full 14.51k samples,
we observe a notable improvement in the compilation rate on three test sets. This indicates that
increasing the training data size positively impacts the model’s performance on the test sets, as shown
in Table 13.
Real Test is Still Challenging: Despite the improvements observed in all test sets, there remains
substantial room for enhancement in the real test set, i.e., the natural language-based benchmark as
shown in Table 13. This discrepancy can be attributed to two primary factors: i. Out-of-Distribution
Test Domains: The real test set represents OOD test domains compared to the two Mathlib Lean
4 test sets, i.e., Random and Basic. Consequently, models fine-tuned solely on the Mathlib Lean 4
training set may struggle to generalize effectively to these benchmarks. ii. Lack of Dependency on
Pre-Defined Lemmas or Basic Terms: Unlike Mathlib Lean 4 test sets, the real test set often lacks
dependencies on pre-defined lemmas or basic terms.
Additionally, we evaluate the autoformalization efficiency on two Math Reasoning benchmarks, i.e.,
GSM8K (Cobbe et al., 2021) and MATH (Hendrycks et al., 2021) in Table 14 in Appendix N. We
note that the SFT model exhibits different performance on the real test sets compared to the baseline
model listed in Table 4. This is because this section aims to explore the connection between the
training and test sets provided by FORML4. Therefore, the two SFT models in this section do not
undergo further rejective sampling fine-tuned on the MATH and GSM8K datasets, as described in
the Section 5.1.1.
N
