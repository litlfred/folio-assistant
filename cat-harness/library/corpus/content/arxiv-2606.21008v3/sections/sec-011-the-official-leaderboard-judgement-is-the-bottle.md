---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-011-the-official-leaderboard-judgement-is-the-bottle
section_title: "The official leaderboard: judgement is the bottleneck"
section_number: null
pages: 7-7
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
Every official number is council-issued on the contest basis of §3.4: each model is rated by the five
seats — joined by the model itself when it holds no seat — over the incumbents’ portfolios, the two
ballast submissions and its own, leave-self-out throughout. The two bases agree closely (Spearman
0.98; on the twelve-evaluator basis the fifth seat is a tie within 0.03).
Table 2: Final leaderboard — total T with its joint-bootstrap 95% CI, the evaluator half E, the
generator half G, and the four anchored components; all council-issued against the fixed anchor,
which reads 7.00 by construction. Adjacent ranks are resolved (non-overlapping intervals) only at
2–3 and 8–9; the rest are statistical ties. EF = 0.00: no error signal in the model’s factual ratings.
Rank
Model
Council
T [95% CI]
E
G
GF
GC
EF
EC
1
⋆claude-opus-4.5 (anchor)
council
7.00 [7.00, 7.00]
7.00
7.00
7.00
7.00
7.00
7.00
2
gemini-3.1-pro
council
6.92 [6.69, 7.24]
7.39
6.45
6.77
6.13
7.78
7.01
3
claude-opus-4.1
council
6.02 [5.71, 6.32]
5.06
6.98
6.94
7.02
3.65
6.47
4
claude-opus-4.0
council
5.81 [5.47, 6.12]
4.95
6.68
6.91
6.45
3.49
6.41
5
gemini-2.5-flash
council
5.75 [4.98, 6.21]
5.41
6.08
6.46
5.70
4.30
6.52
6
claude-sonnet-4
—
5.34 [5.09, 5.65]
4.10
6.58
6.95
6.21
2.07
6.13
7
gpt-4.1-mini
—
5.03 [4.37, 5.62]
4.31
5.74
6.23
5.25
1.66
6.97
8
gpt-4.1-2025-04-14
—
4.66 [4.49, 5.03]
3.50
5.82
6.59
5.04
0.77
6.23
9
gpt-4.1-nano
—
3.68 [3.31, 4.05]
3.35
4.02
4.55
3.48
0.26
6.43
10
gpt-4o-2024-08-06
—
3.34 [3.00, 3.56]
2.33
4.34
5.19
3.49
0.15
4.51
11
gpt-4o
—
2.95 [2.51, 3.29]
1.53
4.37
5.22
3.53
0.44
2.61
12
gpt-4o-mini
—
2.39 [1.96, 2.79]
1.17
3.62
3.71
3.53
-0.00
2.34
Two readings. The top five are the council: the five better factual judges of §4.2 are the five
highest totals. Generation and evaluation do not coincide: the three Opus models, the strongest
generators, are middling factual judges (EF 3.5–3.7, the pinned anchor aside), while the strongest
judge, Gemini 3.1 Pro (EF = 7.78), generates mid-pack. Making a true claim and spotting a false
one are different skills (West et al., 2024; Oh et al., 2024; Li et al., 2024), and rating them separately
breaks the assumption behind key-free peer rankers (Ning et al., 2025; Zhang et al., 2025), which
treat a strong generator as a strong judge.
4.5
