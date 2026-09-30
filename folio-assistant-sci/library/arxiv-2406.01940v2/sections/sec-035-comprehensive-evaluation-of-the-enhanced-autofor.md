---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-035-comprehensive-evaluation-of-the-enhanced-autofor
section_title: "Comprehensive Evaluation of the Enhanced Autoformalizer"
section_number: null
pages: 27-28
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
We leverage our enhanced autoformalizer to generate high-quality training data, supervised by the
Lean 4 compiler, to further refine the verifier model. This process involves the following steps:
1. Data Generation: We employ the RFT+Verifier enhanced autoformalizer to produce
samples from the FORML 4, MATH, and GSM 8K training sets.
2. Compilation Testing: Each generated sample undergoes testing via the Lean 4 compiler to
ascertain compilation success and extract detailed compilation information.
3. Verifier Fine-tuning: We further refine the Process-Supervised Verifier (PSV) model
using this high-quality data, incorporating step-level process supervision derived from the
compiler’s feedback.
27
Work in progress
To assess the efficacy of our refined verifier, we first evaluate the comprehensive performance of the
RFT+Verifier enhanced Autoformalizer (RFT + VEA) model. This evaluation employs both greedy
decoding and pass@k sampling methods, as detailed in Appendix P.2. Table 12 presents these results.
Table 12: Comprehensive performance of the enhanced autoformalizer.
Model
Dataset
Greedy
Pass@1
Pass@5
Basic
35.67
33.14
43.11
RFT + VEA
Random
27.43
26.47
36.19
Real
23.72
22.29
40.33
K
