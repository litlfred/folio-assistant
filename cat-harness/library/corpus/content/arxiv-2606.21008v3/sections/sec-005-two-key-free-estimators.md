---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-005-two-key-free-estimators
section_title: "Two key-free estimators"
section_number: null
pages: 5-6
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
1. Factual competence — peer centrality. We assume that good evaluators agree with one another
about which instantiations are factually weaker, once each evaluator’s own leniency is removed —
the better two evaluators are, the more they agree. Stack the participants’ factual scores into one
matrix — twelve evaluators against the 275 parallel contexts of the eleven scored portfolios — each
entry the 1–10 rating used directly, row-centre it to remove each evaluator’s leniency, and take its
SVD; the row-centred ˜F (evaluators × instantiations) is well approximated by its leading rank-one
factor,
˜Fsj ≈σ1 us vj.
(1)
An evaluator’s rating tracks the consensus in proportion to its competence us times the instantiation’s
factual standing vj: competence and standing fall out of one factorisation, with no answer key. The
left singular vector u is each evaluator’s factual-competence loading f — high when its ratings
align with the participants’ shared signal, ≈0 when it rates everything alike or idiosyncratically —
and, rescaled so the anchor model reads 7, EF = 7f/fa; the right vector, aggregated per generator,
is GF (Appendix A.2). f is each judge’s eigenvector centrality (Bonacich, 1972) in the leniency-
removed agreement network, after clamping: an evaluator’s competence is its rating by the other
evaluators, each weighted by its own competence — the highly trusted among the highly trusted.
The construction is a graded relative of the classical label-free aggregators (Dawid & Skene, 1979;
Parisi et al., 2014), which need categorical verdicts. Discretising the ratings would flip the marginal
council seat.
2. Rating consistency — the anchor sweep. A reliable evaluator also needs a stable internal
standard for each non-factual criterion. We sweep the anchor across 5, 6, 7 and 8 — the only
difference between the four runs — and, per evaluator and axis, correlate (Pearson) the scores at
one anchor with those at another, averaged over the six pairs, leave-self-out. Re-pinning the anchor
recalibrates the scale, not the rubric, and Pearson ignores a common shift or stretch; any reordering
that follows a recalibration is not a change of judgement but flimsiness. Rescaled so the anchor
model reads 7, consistency becomes an evaluator competence EC on the generator’s scale.
Neither estimator can do the other’s job (Appendix A.8): peer centrality is licensed only where
the one thing competent judges share is the truth — on taste, agreement is shared convention, and
weighting by it would launder conformity into competence — and consistency cannot certify truth.
The council is therefore seated on the factual axis, with consistency as the accompanying bar.
5
Preprint. arXiv:2606.21008 v3, September 2026.
3.4
