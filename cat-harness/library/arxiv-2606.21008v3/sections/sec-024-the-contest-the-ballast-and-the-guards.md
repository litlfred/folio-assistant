---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-024-the-contest-the-ballast-and-the-guards
section_title: "The contest, the ballast, and the guards"
section_number: null
pages: 17-18
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
The official leaderboard is issued on the contest basis: a contest for model c convenes the five
council seats and c itself as evaluators over the incumbents’ portfolios, the two ballast blocks and c’s
own — every estimator above unchanged, leave-self-out throughout, the anchor’s fa, ¯ra the contest’s
own. Two guards decide whether the contest’s factual axis is identified: σ1/σ2 ∈[2.0, 5.0] and a
spread of the seats’ anchored EF above 2.5 points; if either fails, no seat changes hands and the
contest’s totals carry the caveat. The upper bound marks the range within which the sizing below
was validated, not a failure in itself.
A contest convenes the top of the field, and with the weak submissions gone the factual axis breaks:
the seats’ anchored EF come out wrong in scale and in order, swinging by up to 8.8 points with the
contestant. The ballast — the weakest archived submissions, added to every contest’s graded set
and held fixed through anchor replacements and council rotations — repairs this; two suffice.
17
Preprint. arXiv:2606.21008 v3, September 2026.
Table 7: Each seat’s anchored EF by contest composition — 0–3 ballast blocks (mean over the seven
possible contestants) beside the twelve-participant reference, three runs pooled. Council alone, the
column is scrambled; from two ballast on, the contest reproduces the reference (mean |∆| 0.60 over
the seven contests at two blocks, 0.37 at three; the same seat lowest in six of the seven). Two blocks
is the protocol’s configuration.
Seat
council alone
+1 ballast
+2 ballast
+3 ballast
all 12
gemini-3.1-pro
7.19
6.94
7.84
8.13
8.24
⋆claude-opus-4.5
7.00
7.00
7.00
7.00
7.00
claude-opus-4.0
6.98
3.58
3.66
4.14
4.69
claude-opus-4.1
7.42
4.26
3.79
4.20
4.65
gemini-2.5-flash
1.41
2.75
4.18
3.95
3.47
Why two and not one: with a single block the axis narrows toward did this judge notice the one
bad portfolio, and the guards fail in 6% of bootstrap resamples; two blocks carry two independent
error patterns, the guards hold in every resample, σ1/σ2 = 2.87 [2.50, 3.03] on the pooled corpus
with both interval ends inside the band; a third tightens the seats’ fidelity further (0.37) at twenty-
five more columns of grading per run, and the protocol keeps two. Taken apart, the runs behave
differently: the sizing holds on run 1 (two-ballast separation 2.99 [2.71, 3.48], guards holding in
every resample), is marginal on run 2 (2.01 [1.87, 2.40], holding in 65% of resamples), and fails
on run 3 at every ballast size (1.53 [1.31, 1.73], holding in none): no column set can single out
an axis the judges did not share. Against a per-evaluator permutation null (each evaluator’s ratings
shuffled across the columns), σ1 stands 1.48× above the 95th-percentile noise edge on the pooled
corpus, where the second pattern lies within noise; on run 3 alone it stands 1.29× above the edge and
the second pattern also exceeds it, while the leading direction is stable under the column bootstrap
(scripts/spectral_gap_checks.py): run 3 has a shared factual axis, but not a single one,
and pooling it with two clean runs restores one.
A.7
