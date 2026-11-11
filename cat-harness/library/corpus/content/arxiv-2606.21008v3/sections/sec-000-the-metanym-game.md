---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-000-the-metanym-game
section_title: "The metanym game"
section_number: null
pages: 1-1
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
OUT GROUND TRUTH THAT RISES WITH THE MODELS
IT MEASURES
David Nordfors
david.nordfors@archetypes.ai
ABSTRACT
We introduce a benchmark that is fully self-contained, needs no ground truth, and
rises with the models it measures. Language models compete at making analo-
gies and subjectively grade one another; nothing enters from outside. The bench-
mark reproduces GPQA Diamond, a keyed benchmark of expert-written ques-
tions, at r = 0.98, audited for a leak and found clean. We hypothesize that both
benchmarks measure the same thing in different ways: a language model holds its
knowledge as archetypal contexts, relationship patterns valid across many topic
domains. GPQA instantiates the required knowledge in one domain; the Metanym
Game instantiates one archetype into several domains, generating analogies, no
reasoning required. The reasoning feature of an LLM hardly changes the game’s
ratings, while it lifts GPQA, which requires derivations. In the game, a player
writes a context template whose slots, filled with a set of keywords from a topic
domain, instantiate a factually true description of that domain; the instantiations
are each other’s metaphors, and keywords filling the same slot are metanyms,
metaphorically synonymous. Correctness is settled sentence by sentence. Ground
truth is replaced by the SVD of the factual rating matrix: its left and right singular
vectors rate the players as judges and as generators, two ratings from one factori-
sation, to our knowledge a first for an LLM council of peers. On the subjective
criteria, judges are weighted by their rating consistency under a swept calibration
anchor. Generating and judging are different skills: on this roster the strongest
generators were middling judges. A council of the five best issues the official
ratings; its contestable seats keep it current, a candidate steering signal for self-
improving AI. The paper is accompanied by a validating package that recomputes
every number.
1
