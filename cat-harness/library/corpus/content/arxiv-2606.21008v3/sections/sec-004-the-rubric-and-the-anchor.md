---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-004-the-rubric-and-the-anchor
section_title: "The rubric and the anchor"
section_number: null
pages: 2-5
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
Three design choices. A fixed anchor: cardinal scores drift between evaluators — one model’s
“8” is another’s “6” — and a reference pinned at a known score turns each idiosyncratic scale into
a common one and recovers discriminability at the top, where the 1–10 ceiling compresses the
strongest portfolios (§4.1). Holistic axes, minimally prescribed: a detailed rubric would leak back
2
Preprint. arXiv:2606.21008 v3, September 2026.
Figure 1: The Metanym Game, generation: the archetypal context ‘Gradient-Guided Navigation’
from the anchor submission; its context template, metanym table (one metanym set excluded to
make space in the figure) and one instantiation with its idiomatic rewrite.
3
Preprint. arXiv:2606.21008 v3, September 2026.
Figure 2: The Metanym Game, evaluation: the council on one parallel context of the Gemini 2.5
Flash submission; the instantiation, its idiomatic rewrite, the administrator’s summary, and the five
judges’ ratings with their justifications.
4
Preprint. arXiv:2606.21008 v3, September 2026.
Table 1: The six-axis rubric, in the words the evaluator sees (Appendix B). No definition of beauty
or intelligence is supplied; each judge rates on its own understanding.
Axis
Unit
The criterion as put to the evaluator
factual_per_pc
parallel
context
each sentence is factually correct
beauty
archetype
beauty
intelligence
archetype
intelligence
instantiation_
distinctness
archetype
the parallel contexts span very different domains;
metanyms are far from synonymous
impressive_length
archetype
the archetypal template has impressive length
structural_diversity
portfolio
the archetypal contexts have very different system
structures
into generation as a template-construction tutorial, and we want to score what models recognise
as beautiful or intelligent. impressive_length counterweights per-sentence factual scoring:
without it the minimal template wins, and padding costs, since every added sentence is another
claim to score. One evaluation, every judge shown whole, is Figure 2.
3.3
