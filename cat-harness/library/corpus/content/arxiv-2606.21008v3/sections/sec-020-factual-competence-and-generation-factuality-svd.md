---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-020-factual-competence-and-generation-factuality-svd
section_title: "Factual competence and generation factuality (SVD)"
section_number: null
pages: 14-15
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
Stack the factual scores into F (evaluators × instantiations), each entry the 1–10 rating used directly,
no thresholding. Self-entries and the rare missing entries are set to the anchor value:
Fsj = rs,j ∈{1, . . . , 10}
(self-entries = θ∗= 7).
(A5)
Centre each row (subtract the evaluator’s mean, removing its leniency) and keep the leading triple:
˜F = F −¯r 1⊤= UΣV ⊤,
σ1,
u ≡U·1,
v ≡V·1.
(A6)
The left singular vector is factual competence,
f ≡u,
signed so P
s fs > 0,
f +
s = max(fs, 0),
(A7)
clamped at zero so an evaluator anti-correlated with the consensus carries no weight. Filling the
self-entries with each evaluator’s own row mean, so that they vanish under centering, leaves the
EF ranking unchanged, moves no loading by more than 0.04, and moves the total’s agreement with
GPQA by less than 0.01 (scripts/self_entry_fill_check.py). Centering is essential:
raw scores cluster at the anchor, so on the un-centred matrix the leading axis is the shared level
and ranks the most lenient evaluators highest. Equivalently u is the leading eigenvector of the row-
centred inter-evaluator Gram ˜F ˜F ⊤. Because every row of ˜F sums to zero, v sums to zero and is
oriented so that positive means factually stronger (corr(v, column means of ˜F) > 0).
14
Preprint. arXiv:2606.21008 v3, September 2026.
The competence-weighted consensus rating of instantiation j reads v back on the 1–10 scale,
ˆrj = C + κ vj,
C =
P
s f +
s ¯rs
P
s f +
s
,
κ = σ1
P
s f +
s us
P
s f +
s
> 0,
(A8)
the rank-one approximation of the competence-weighted mean rating (the two agree within 0.14 on
the canonical run, r = 1.00). Averaging over a generator’s own instantiations Jg gives the key-free
generation-factuality rating
GF
g
=
1
|Jg|
X
j∈Jg
ˆrj,
(A9)
already on the 1–10 scale: clean instantiations sit at vj ≈0, hence at C ≈7. Its interval resamples
the generator’s own ˆrj with the consensus (C, κ, v) held fixed. The one assumption: the only thing
the evaluators share is the truth — a same-vendor bloc with a common bias would add a spurious
shared component, which is why competence is read off a vendor-diverse panel with the shared-bias
check of §4.2.
Table 4: Evaluator factual competence EF (left singular vector; “anchored” = 7f/fa) and generator
factuality GF (right vector, per generator), twelve-evaluator basis, three runs pooled (805 items). †
loading interval includes zero; no interval printed.
Model
EF loading
EF anchored
95% CI
GF
95% CI
gemini-3.1-pro
0.61
8.24
[7.33, 9.30]
6.78
[6.62, 6.89]
claude-opus-4.5
0.52
7.00
[7.00, 7.00]
7.00
(anchor)
claude-opus-4.0
0.35
4.69
[3.45, 6.04]
6.93
[6.89, 6.97]
claude-opus-4.1
0.35
4.65
[3.56, 5.96]
6.99
[6.91, 7.07]
gemini-2.5-flash
0.26
3.47
[1.62, 5.05]
6.49
[6.27, 6.68]
claude-sonnet-4
0.18
2.37
[1.53, 3.36]
6.96
[6.92, 7.00]
gpt-4.1-mini
0.10
1.34†
—
6.26
[6.07, 6.43]
gpt-4.1-2025-04-14
0.06
0.79
[0.39, 1.53]
6.56
[6.39, 6.69]
gpt-4o
0.04
0.47
[0.28, 0.70]
5.33
[5.12, 5.53]
gpt-4o-2024-08-06
0.03
0.35
[0.18, 0.61]
5.39
[5.16, 5.62]
gpt-4.1-nano
0.02
0.28†
—
4.82
[4.01, 5.38]
gpt-4o-mini
-0.00
-0.00†
—
4.14
[3.60, 4.69]
A.3
