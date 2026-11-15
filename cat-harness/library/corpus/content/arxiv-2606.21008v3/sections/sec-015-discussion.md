---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-015-discussion
section_title: "Discussion"
section_number: null
pages: 9-10
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
Two yardsticks. The factual estimator’s one assumption — the only thing competent evaluators
share is the truth — is what licenses agreement-weighting for facts. The disclosed alternative applies
it to taste as well (an authority rating, one SVD per subjective axis; Appendix A.7); we decline it
because on taste the dominant axis of agreement is shared convention, so weighting by it would
reward the judge nearest the mean. Peer centrality’s weakness is the shared misunderstanding; rating
consistency asks only whether a judge holds a firm standard.
A sustainable yardstick. When the field outgrows the anchor — a standing total above the pinned
7 by a resolvable margin — the anchor is replaced by the stronger submission and models are re-
scored; the ballast stays fixed. Contestable seats keep the judges current, retesting the scale: the
benchmark rises with the models it measures, which a keyed test cannot: its key-makers are fixed.
A hypothesis for the agreement. The total tracks GPQA at 0.98 (§4.5). GPQA is an accepted
measure of capability with no theory of intelligence behind it: expert-written questions and a key
(Rein et al., 2023). Of the eight constructs the Metanym Game demands, four are analogy under
cognitive science’s own names (Appendix E). Two instruments whose methods share nothing on
the surface agree at 0.98, so the common thing is in the depth. Our hypothesis is that a language
model holds its knowledge as archetypal contexts, each instantiated in the topic domains where it
applies; the metanym game reproduces this organisation, and GPQA runs on it (Figure 4). The
argument: training a language model is compression (Shannon, 1951; Delétang et al., 2024), and
analogy is semantic compression, a shared relational structure with different particulars (Gentner,
9
Preprint. arXiv:2606.21008 v3, September 2026.
1983). The archetypal context is that structure in the latent space, the context template its literal
representation, and the metanym sets the particulars that instantiate it. In the Metanym Game an
instantiation is between two and a half and eleven times the size of its metanym set, so each domain
is added for a fraction of the text it yields. This metanymic compression, in literal space, is of the
order measured for language models, about ten (Delétang et al., 2024), and above gzip’s three. A
memorised string compresses only its exact repeats; a frame compresses every new instance that fits
it. The archetypal compression, in latent space, is greater still, since one archetype stands behind
many context templates: between runs the models rewrite their templates and keep their archetypes
(§4.6). A form this compressive qualifies as a learning mechanism. GPQA and the Metanym Game
then run the same mechanism from opposite ends. GPQA gives the archetype and the domain and
four candidates: in 99.5% of the replies the model derives the solution and then picks the candidate
that matches it, the mechanism in use. The game gives nothing but rating criteria, truth among
them: the model selects an archetype and domains and writes them out, the mechanism itself. This
suggests that models will play the Metanym Game well without reasoning because the answer is
retrieved, not built, and a reasoning channel should add little.
A test. We played four models each as two players, 1) with reasoning off at temperature 0, and 2)
with reasoning on: Claude Sonnet 4.6, Claude Haiku 4.5, GPT-5.6 Terra and GPT-5.6 Luna. The
thinking model does not build templates in its thinking; it writes them once, in the answer, as the
non-thinking model does. What the thinking contains is a list of archetypes, by name, and a choice
among them: selection over things the model already has, which is what retrieval looks like. The
ratings agree (Table 3): less than a point of change for every model, none clearing its interval. But
for GPQA it is different: here thinking is helpful. Anthropic reports Opus 4 and Sonnet 4 at 74.9
and 70.0 without extended thinking and 79.6 and 75.4 with it (Anthropic, 2025); ours, reasoning
off, read 71.2 and 72.2. That is the split the hypothesis predicts: for GPQA a derivation, which
reasoning helps (Sprague et al., 2025); for the Metanym Game a retrieval, where reasoning is of
much less help.
Table 3: Factual rating with the reasoning channel off and on, six judges each, anchor at 7; bootstrap
over judges and archetypes, percentile 95% intervals. One portfolio per cell; the vendors return
summaries of the thinking, not the trace.
Model
Reasoning off
Reasoning on
On minus off, 95% interval
Claude Haiku 4.5
5.99
5.31
−0.67 [−1.83, +0.42]
GPT-5.6 Luna
7.63
7.81
+0.18 [−0.08, +0.47]
Claude Sonnet 4.6
7.00
7.31
+0.31 [−0.09, +0.76]
GPT-5.6 Terra
7.01
7.55
+0.54 [−0.17, +1.31]
Predictions.
• Domain-matched agreement. If the hypothesis is correct, the agreement should hold
within each topic domain. A model’s factual score on its biology parallel contexts should
track its GPQA accuracy on the biology questions, and the same for physics and chemistry.
GPQA labels each question by domain and the released evaluations record the domain of
each parallel context, so the test needs no new run. If agreement within a domain is no
higher than agreement across domains, the hypothesis is refuted.
• Separability. If the hypothesis is correct, archetype and topic domain are separate in the
latent space. The same archetype should be recoverable from its parallel contexts in unre-
lated domains, and the same domain from the parallel contexts of unrelated archetypes. If
representations separate by domain only, the hypothesis is refuted.
What the data establish is narrower than the hypothesis: the correlation itself, 0.94 from the two
factual quarters alone and 0.98 for the total (Appendix D.1).
7
