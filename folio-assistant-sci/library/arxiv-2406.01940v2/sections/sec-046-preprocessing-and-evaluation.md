---
doc_id: arxiv-2406.01940v2
doc_title: "Work in progress PROCESS-DRIVEN AUTOFORMALIZATION IN LEAN 4"
section_id: sec-046-preprocessing-and-evaluation
section_title: "Preprocessing and Evaluation"
section_number: null
pages: 31-32
source_pdf: 2406.01940v2.pdf
source_sha256: 1cfc906589df5afc
toc_source: outline
---
The model’s response may contain raw text mixed with Lean 4 language, We applied different
handling functions to extract the exact Lean 4 language for subsequent compilation. For model
responses without any Lean 4 output, we marked them as negative outputs. We employ the metric
pass@k to evaluate model performance, defined as the condition where at least one autoformalized
instance, comprising both the statement and proof, successfully passes the Lean 4 compiler within
the model’s first k attempts. Additionally, we use the term greedy to assess model performance based
on whether the output with the highest confidence from the model can pass the Lean 4 compiler.
31
Work in progress
Table 15: Performance of LLMs on FORML4 in terms of greedy and pass@k scores. We include open-
source LLMs that claim integration of formal languages into their pretraining/finetuning. Reported
results indicate the percentage of successfully compiled outputs over all the generated ones (%).
Model
Random Test
Basic Test
Real Test
Greedy
Pass@1
Pass@5
Greedy
Pass@1
Pass@5
Greedy
Pass@1
Pass@5
Closed-Source LLMs
GPT-3.5-Turbo (Achiam et al., 2023)
0.43
0.34
0.75
0.31
0.02
0.68
5.23
3.92
10.21
GPT-4-Turbo (OpenAI, 2023)
0.52
0.44
3.48
1.51
1.18
4.45
5.35
4.83
12.32
GPT-4o (OpenAI, 2023)
1.38
1.14
3.51
1.53
1.20
5.47
5.85
5.38
13.31
Open-Source LLMs
DeepSeek-Math-Base-7B (Shao et al., 2024)
0.21
0.25
0.96
0.38
0.22
0.86
0.03
0.02
0.04
DeepSeek-Math-Instruct-7B (Shao et al., 2024)
0.59
0.26
1.73
1.21
0.48
3.08
0.35
1.63
5.39
LLEMMA-7B (Azerbayev et al., 2023b)
0.03
0.02
0.79
0.20
0.13
0.45
0.02
0.03
0.04
LLEMMA-34B (Azerbayev et al., 2023b)
0.02
0.03
0.19
0.03
0.02
0.03
0.02
0.03
0.04
InternLM-Math-7B (Ying et al., 2024b)
0.03
0.02
0.21
0.22
0.15
0.29
1.13
1.06
3.76
InternLM-Math-20B (Ying et al., 2024b)
0.02
0.03
0.03
0.03
0.02
0.03
0.24
0.72
2.39
Mistral-Instruct-v0.3-7B (Jiang et al., 2023b)
0.30
0.23
1.90
0.48
0.80
1.86
0.33
0.53
1.96
For the generation of results using the "greedy" strategy, we set the temperature parameter to 0.0 and
0.7 for the "pass@k" strategy. To present unbiased results for "pass@k", we follow the calculation
method outlined in (Chen et al., 2021). Specifically, we generate n = 20 samples for each instance,
evaluate the number of correct samples passing unit tests, and then calculate the unbiased estimator
for pass@k. We repeat the experiments 5 times and report the 95% confidence intervals with a
precision of ±0.1 to account for variability in the results.
P.3
