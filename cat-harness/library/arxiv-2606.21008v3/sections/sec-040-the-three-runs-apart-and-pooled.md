---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-040-the-three-runs-apart-and-pooled
section_title: "The three runs apart, and pooled"
section_number: null
pages: 31-33
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
Table 14: Total rating T across three full re-runs (run 1 = the bootstrap generation, re-analysed on
the council basis; runs 2–3 the same day, two hours apart), all on the council basis. ⋆marks a council
seat, fixed from run 1. SD is the per-model run-to-run standard deviation (mean 0.43, max 0.72).
Pairwise agreement between runs: Pearson 0.92–0.96, Spearman 0.84–0.90. Re-selected from a
single run’s totals, the council would seat gpt-4.1-mini for claude-opus-4.0 in run 2 and claude-
sonnet-4 for gemini-2.5-flash in run 3; neither rotation clears the guard (contest σ1/σ2 1.87 and
1.63, scripts/per_run_contests.py). Run 3’s EF quarter is read off a factual axis the
guard reports as unidentified (σ1/σ2 = 1.29).
Model
T1
T2
T3
SD
⋆claude-opus-4.5
7.00
7.00
7.00
0.00
⋆gemini-3.1-pro
6.65
7.35
8.10
0.72
⋆claude-opus-4.0
6.04
5.50
6.26
0.39
⋆gemini-2.5-flash
6.03
5.84
4.78
0.68
⋆claude-opus-4.1
5.92
6.77
6.19
0.43
claude-sonnet-4
5.22
5.82
6.16
0.47
gpt-4.1-mini
4.88
5.93
4.93
0.59
gpt-4.1-2025-04-14
4.44
4.62
5.72
0.69
gpt-4.1-nano
3.42
3.55
2.72
0.45
gpt-4o-2024-08-06
3.34
3.08
3.63
0.27
gpt-4o
2.85
2.76
2.93
0.09
gpt-4o-mini
2.10
2.25
1.60
0.34
The factual quarter is where the runs differ. On the twelve-evaluator basis, with the consistency
ratings from run 1’s sweep throughout:
Table 15: Factual competence EF per run and pooled (twelve-evaluator basis). Spectral gap σ1/σ2:
2.57, 1.67, 1.29; pooled 2.24 (runs 1 and 2 alone, 2.45). Run-to-run agreement (Pearson) of EF
alone: 0.90, 0.79, 0.80 for runs 1–2, 1–3, 2–3; of the three regenerated quarters 1
3(GF +GC +EF ):
0.95, 0.91, 0.93; of T: 0.97, 0.94, 0.95.
Model
EF run 1
run 2
run 3
pooled
gemini-3.1-pro
7.36
8.29
10.24
8.24
⋆claude-opus-4.5
7.00
7.00
7.00
7.00
claude-opus-4.0
4.47
3.48
5.41
4.69
claude-opus-4.1
3.55
6.78
5.17
4.65
gemini-2.5-flash
4.68
3.81
0.01
3.47
claude-sonnet-4
1.62
2.44
4.00
2.37
gpt-4.1-mini
1.21
3.88
0.06
1.34
gpt-4.1-2025-04-14
0.20
0.53
2.92
0.79
gpt-4o
0.34
0.41
1.02
0.47
gpt-4o-2024-08-06
0.62
0.00
0.00
0.35
gpt-4.1-nano
0.49
0.39
0.00
0.28
gpt-4o-mini
0.00
0.00
0.00
0.00
31
Preprint. arXiv:2606.21008 v3, September 2026.
Figure 5: The three runs apart and pooled, against GPQA Diamond. Top row: council-basis T per
run, with each run’s twelve-evaluator spectral gap. Bottom row: runs 1 and 2 pooled (left), all three
pooled (right). Run 3, with the smallest gap, is the odd one out; pooling restores an identified factual
axis and the agreement rises.
σ1/σ2 is the standard spectral-gap diagnostic for whether a leading singular direction is identified
(Davis–Kahan: the rotation of u1 under perturbation is bounded by the gap to σ2 and by nothing
below it); the threshold of 2 is a rule of thumb, not a derived value. Run 2 sits below it and reads
well; run 3 sits further below and does not. On this evidence a threshold near 1.5 may separate
the two, but two runs cannot fix it, and GPQA, the external reference that names run 3 as the odd
one out, is not ground truth for intelligence and sets no protocol parameter here. The benchmark’s
policy is therefore to pool: three portfolios per player, the seats’ and the ballast’s three stored, one
factorisation over all of them, and the guard reported on the pooled matrix.
32
Preprint. arXiv:2606.21008 v3, September 2026.
G
