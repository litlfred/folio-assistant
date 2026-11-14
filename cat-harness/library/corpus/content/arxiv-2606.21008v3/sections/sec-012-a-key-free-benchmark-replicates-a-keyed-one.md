---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-012-a-key-free-benchmark-replicates-a-keyed-one
section_title: "A key-free benchmark replicates a keyed one"
section_number: null
pages: 7-8
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
We test the key-free rating against GPQA Diamond (Rein et al., 2023) — 198 graduate-level
multiple-choice questions written and validated by domain experts — put to the same twelve models
under the same protocol two weeks after the generation run (Appendix D.2), and correlated with T
(Figure 3).
T reproduces GPQA’s ordering at Pearson r = 0.98 [0.95, 0.99] (Spearman 0.96; three runs pooled,
§4.6). Instruments sharing no item authors, task or scoring, and agreeing at 0.98, are as close as
their measurement error allows (Appendix D.1); §6 offers a hypothesis for what they share. Within
the leading eight alone the agreement holds at r = 0.94.
The number survives an audit (Appendix D): no key enters a prompt, every accuracy re-derives
from the shipped records, the key is balanced, an independent extractor reproduces the verdicts, and
strict rescoring moves the correlation by 0.010. T is the mean of four quarters, GF , GC, EF , EC:
each alone correlates with GPQA at 0.81–0.95, the factual pair 1
2(GF + EF ) at 0.94, and adding
the two subjective quarters lifts the agreement to 0.98; dropping even the weakest quarter lowers
it (0.97), and no sub-combination beats it (Appendix D.1). These differences are not individually
7
Preprint. arXiv:2606.21008 v3, September 2026.
Figure 3: The official total T against self-administered GPQA Diamond accuracy, twelve models,
three runs pooled: r = 0.98 [0.95, 0.99], ρ = 0.96. Filled markers are council seats, open markers
non-council, bars 95% intervals; the star is the anchor, T = 7 by calibration, and excluding it leaves
r at 0.98.
Figure 4: A hypothesis for the 0.98 (§6): an archetype (α, β) is held once; each domain adds
only its metanym set (the slices). GPQA: archetype and domain are given, the model derives the
instantiation and selects the matching candidate. The game: nothing is given, the model selects the
archetype and domains and writes them out.
resolved at n = 12. T is the official total, defined before any GPQA comparison. What the audit
cannot rule out: the shared gateway, and differential training contamination of the public GPQA
set. Judging is its own trait: among the leading eight EF (0.89) is the best single predictor while
GC falls to 0.81 — once every model is a competent maker, what separates them is the knowledge
that detecting others’ errors requires (Appendix D.1). No keyed answering benchmark measures
judging.
4.6
