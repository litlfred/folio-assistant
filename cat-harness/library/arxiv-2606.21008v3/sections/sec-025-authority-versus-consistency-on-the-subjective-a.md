---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-025-authority-versus-consistency-on-the-subjective-a
section_title: "Authority versus consistency on the subjective axes"
section_number: null
pages: 18-19
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
Computed on run 1 alone. Peer centrality can be run on the subjective axes too: one SVD per non-
factual axis yields an authority rating — each judge’s alignment with the participants’ collective
taste. On the five subjective axes authority and consistency correlate at Pearson 0.70–0.90; on factual
— the one axis with a truth to be right about — they diverge (0.50, CI [−0.08, 0.84]), because only
there can a judge be stable yet wrong. Consistency credits a judge’s whole stable standard, personal
taste included, penalising only flimsiness; authority credits the collective share alone, so stable-but-
partly-private judges drop under authority (Spearman between the twelve orderings 0.83). Council
membership is invariant to the choice: the top five by either estimator are the five seats. Substituting
authority for consistency in the total preserves the ordering (Spearman 0.986) with one headline
change: authority is not bounded by the anchor’s own loading, so gemini-3.1-pro’s total (7.86)
overtakes the pinned 7. The official rating uses consistency; adopting authority inside T would
convert alignment into authority on axes where no truth licenses the conversion (§6).
Limits of a consensus-defined competence (run 1). Because EF is read off agreement, a judge that
departs from the panel is scored down whether it is wrong or right. A synthetic evaluator built to re-
produce the panel’s competence-weighted consensus exactly reads EF = 5.15; inverting its verdict
on 5% of the items drops it to 4.84, on 20% to 3.79 (scripts/consensus_limits.py). Sub-
stituting authority for consistency in the total preserves the ordering (Spearman 0.986) save Gemini
3.1 Pro overtaking the anchor (7.86).
18
Preprint. arXiv:2606.21008 v3, September 2026.
A.8
