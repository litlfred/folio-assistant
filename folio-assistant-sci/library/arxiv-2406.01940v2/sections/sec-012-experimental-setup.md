---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-012-experimental-setup
section_title: "Experimental Setup"
section_number: null
pages: 7-8
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
autoformalizer, and conclude with the results of our further enhanced verifier model.
7
Work in progress
Table 4: Performance of various LLMs on FORML4 in terms of greedy scores. We include both open-
source and closed-source LLMs, as well as models finetuned on FORML4 training data. Reported
results indicate the percentage of successfully compiled outputs over all the generated ones (%).
Model
Test Sets
Random Test
Basic Test
Real Test
Closed-Source LLMs
GPT-3.5-Turbo (Achiam et al., 2023)
0.43
0.31
5.23
GPT-4-Turbo (OpenAI, 2023)
0.52
1.51
5.35
GPT-4o (OpenAI, 2023)
1.38
1.53
5.85
Open-Source LLMs
DeepSeek-Math-Base-7B (Shao et al., 2024)
0.21
0.38
0.03
DeepSeek-Math-Instruct-7B (Shao et al., 2024)
0.59
1.21
0.35
LLEMMA-7B (Azerbayev et al., 2023b)
0.03
0.20
0.02
LLEMMA-34B (Azerbayev et al., 2023b)
0.02
0.03
0.02
InternLM-Math-7B (Ying et al., 2024b)
0.03
0.22
1.13
InternLM-Math-20B (Ying et al., 2024b)
0.02
0.03
0.24
Mistral-Instruct-v0.3-7B (Jiang et al., 2023b)
0.30
0.48
0.33
Finetuned with FORML4
Baseline
21.89
28.76
23.72
RFT
26.21
34.12
26.14
VEA (Ours)
25.87
33.95
25.91
RFT + VEA (Ours)
27.43
35.67
26.87
5.1.1
EXPERIMENTAL SETUP
Performance Analyses of Existing LLMs on FORML4
We assess the autoformalization capa-
bilities of both open-sourced and proprietary LLMs on FORML4 test sets. The results in Table 4,
underscore the challenges that current LLMs, including GPT-4, face in Lean 4 autoformalization
tasks. The low-performance results obtained from greedy decoding underscore the need for method
improvements in this domain. Additional details on pass@k, the querying prompt, and performance
analysis are provided in Appendix P.
We further establish three key components for our own experiments:
1) Baseline Autoformalizer (BA): We train Mistral-v0.3-7B (Jiang et al., 2023b) on FORML4 as a
baseline. To improve its performance in real-world scenarios, we further fine-tune it on successfully
compiled outputs from GSM8K (Cobbe et al., 2021) and MATH (Hendrycks et al., 2021).
2) Verifier Models: We develop two types of verifiers: Process-Supervised Verifier (PSV) i.e.,
fine-tuned using step-level feedback from the Lean 4 compiler, and Outcome-Supervised Verifier
(OSV) i.e., fine-tuned based on single final compilation signal.
3) Evaluation Metrics: i) Multiple Choice (MP1): Ability to select a successfully compiling
candidate from multiple candidates. ii) Precision (Prec.): Fraction of selected samples that compile
successfully. iii) Recall: Fraction of successfully compiled samples selected by the verifier.
5.1.2
