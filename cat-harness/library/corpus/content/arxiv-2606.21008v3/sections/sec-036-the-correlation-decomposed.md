---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-036-the-correlation-decomposed
section_title: "The correlation, decomposed"
section_number: null
pages: 26-28
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
The aggregation ladder is monotone. Council-basis official values against GPQA, three runs
pooled, n = 12 throughout:
26
Preprint. arXiv:2606.21008 v3, September 2026.
Table 9: The aggregation ladder. Two interval constructions are reported because each covers the
other’s weakness at n = 12: Fisher-z assumes bivariate normality but unbends the skew of a
bounded statistic; the BCa bootstrap is assumption-lighter and corrects the bias that makes the naive
percentile bootstrap anti-conservative here. Where they disagree, the wider bound is the honest one.
Quantity
Pearson r
Spearman ρ
Fisher-z 95%
BCa bootstrap 95%
EC alone
0.81
0.82
[0.45, 0.95]
[0.42, 0.94]
GF alone
0.89
0.84
[0.64, 0.97]
[0.72, 0.95]
EF alone
0.87
0.97
[0.60, 0.96]
[0.76, 0.93]
GC alone
0.95
0.84
[0.82, 0.99]
[0.82, 0.98]
G = 1
2(GF + GC) — generation half
0.94
0.87
[0.81, 0.98]
[0.84, 0.98]
E = 1
2(EF + EC) — evaluation half
0.94
0.95
[0.80, 0.98]
[0.83, 0.98]
1
2(EF + GF ) — the factual pair
0.94
0.96
[0.80, 0.98]
[0.89, 0.97]
T = 1
4(GF + GC + EF + EC)
0.98
0.96
[0.93, 1.00]
[0.95, 0.99]
What each step adds.
The plain average of the ratings, every portfolio’s leave-self-out mean
over all axes and judges, tracks GPQA at r = 0.77 un-anchored (the §4.1 pass) and 0.93 an-
chored (run 1, the anchor at 7 by calibration); the total T reaches 0.98 (scripts/baseline_
aggregators.py).
Every component’s interval sits well clear of zero — GPQA corroborates T and, with varying
strength, each component — with T’s interval the tightest under both constructions. The four quar-
ters are four differently distorted reads of capability: GF ceilings at the top (the leading eight com-
press into 6.23–7.00 while GPQA still spreads them across 19 points) and offers a refuge at the
bottom (the GPT-4o family holds GF ≈5.2 on safe, simple, true portfolios while GPQA reads 46–
48% and GC reads 3.5 — truth rewards playing safe, beauty punishes it); EF is judging in form but
answering in content; EC is a disposition that saturates once a model is competent enough to have a
standard (gpt-4.1-mini’s EC of 6.97 sits above every Opus but the anchor). Equal-weight averaging
cancels substantially independent distortions (Spearman–Brown); dropping even the weakest quar-
ter lowers the aggregate ( 1
3(GF + GC + EF ) reads 0.97), and no sub-combination we examined
beats the full average — the best two-quarter pairing, 1
2(GC + EF ), reads 0.95. T is also the only
compound with a pre-registered justification: it is the benchmark’s official total, defined before any
GPQA comparison, whereas any other weighting chosen for its GPQA agreement at n = 12 would
be curve-fitting.
Measurement error, propagated. Both coordinates carry known measurement distributions —
each model’s T its replicate distribution, GPQA accuracy binomial — so the fit can be re-derived
with them propagated (slope point estimate 8.4 GPQA points per unit of T):
Table 10: The T–GPQA fit with measurement uncertainty propagated. The last row is conservative
(the observed scatter already contains one realisation of each point’s noise); the correlation does not
fall below 0.86. Measurement error in x attenuates a correlation rather than inflating it, so the point
estimates are themselves conservative.
Uncertainty propagated
slope 95%
r 95%
sampling of models only (pairs bootstrap)
[7.7, 9.7]
[0.96, 1.00]
measurement only (coordinate draws, models fixed)
[6.9, 9.7]
[0.90, 0.98]
both simultaneously
[6.6, 10.3]
[0.86, 0.98]
The regimes invert — T is the only regime-invariant indicator. Restricting to the leading eight
reverses the single-quarter ordering:
27
Preprint. arXiv:2606.21008 v3, September 2026.
Table 11: Pearson r against GPQA on the full roster and on the leading eight (point estimates on
eight points).
Quantity
Full roster (n = 12)
Leading eight (n = 8)
GF
0.89
0.67
GC
0.95
0.81
EF
0.87
0.89
EC
0.81
0.37
1
2(EF + GF )
0.94
0.92
1
2(GC + EF )
0.95
0.94
T
0.98
0.94
Across the full roster the capability cliff gives the subjective making axis its discriminating range;
among the elite every model is a competent maker (gemini-3.1-pro tops GPQA yet is a middling
maker), and what still separates frontier models is knowledge, which is EF ’s content: detecting
errors in others’ work stays hard after producing clean work has become easy, so EF keeps its
spread (7.78 down to 0.77 across the eight) exactly where GF compresses. Within the Anthropic
family alone (n = 4) the rank agreement is ρ = 0.80 — where the evaluators leave the ordering
unresolved, the agreement with GPQA coarsens too. Recomputing every quantity on the twelve-
evaluator basis instead of the contest basis moves T’s correlation from 0.982 to 0.976; the one
real difference is EC (0.81 contest vs 0.89 twelve-evaluator), the contest’s easier consistency test
inflating inert-band judges in a way an external instrument can see. Taken apart, the three runs read
r = 0.97, 0.97, 0.92 (ρ = 0.93, 0.95, 0.88), the dip being run 3, whose factual axis is unidentified
(σ1/σ2 = 1.29); pooled, 0.98 (ρ = 0.96); excluding the anchor changes nothing (0.97, 0.97, 0.91;
pooled 0.98).
What it does and does not corroborate. T and GPQA are both broad capability measures, so their
agreement corroborates the benchmark as a whole. It does not by itself certify that the factual axis
recovered truth rather than capability-correlated quality: with GC alone at 0.95, GPQA concordance
is not an axis-specific claim.
D.2
