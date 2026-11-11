---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-000-introduction
section_title: "Introduction"
section_number: null
pages: 17-18
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Scholars from a wide range of disciplines engage with questions surrounding decision-
making. How do humans weigh various factors and options when making decisions? What
are ways for institutions to proceduralize decision-making so they can vet whether the de-
cisions they make align with their goals or not? Why do different people make different
decisions in light of similar information? Which decisions can we automate and how do
we do so optimally? Decision problems differ in their settings, information environments,
objectives, and constraints. Computer science has always been interested in how to auto-
mate decisions, and in particular, how to make them efficiently and accurately. In order to
apply algorithmic tools to study decision-making, we must start by theoretically modeling
the decision problem in an abstract way. Subsequently, we can frame the heuristics used
by humans as algorithms and study outcomes of these. This thesis takes this approach to
studying decision-making problems where investment is required to succeed.
We often find ourselves as individuals in situations where we must decide whether to
invest our time and energy or not. Perhaps we are studying a difficult mathematical topic.
Or maybe we are deciding whether to pick a challenging college major. Should we do a
PhD or go to work immediately? Should we start our own business? Institutions face
similar questions, often in the context of resource allocation. Given many technologies we
could work on developing, which ones will have the highest payoff and therefore warrant
investment? In each of these settings, we can consider myriad factors, including social
influences, the impact of personal beliefs and traits, and the effect of the costs of various
options and of switching between them. In this thesis, we consider several of these factors
in stylized theoretical models. In doing so, a theme that emerges is:
What do we gain, and what do we lose, by abstracting a problem instead of
keeping it concrete?
Our scholarship takes two angles: (1) we provide novel technical results in a number
of theoretical settings, and (2) we utilize theoretical models to develop insight about
social problems. In synthesizing these two styles of work, we develop understanding of
the above question. Along the abstract to concrete continuum, we have, on the one end,
purely theoretical settings and, on the other end, the complex and nuanced real world.
Our work addresses problems at three points along this contiunuum, which when taken
together, span a substantial portion of the range.
We start with a very general and
abstract decision-making problem, proceed to a version of that problem that assumes that
2
the decision-making problem comes from a distribution, and finally develop theoretical
models for social phenomena. The lattermost works represent particular instantiations
of more general theoretical frameworks intending to capture some of the concreteness of
reality. Before diving into our results and analysis, we specify the framework that unifies
the work in this thesis.
1.1
