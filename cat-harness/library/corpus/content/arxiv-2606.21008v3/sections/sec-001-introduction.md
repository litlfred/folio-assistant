---
doc_id: arxiv-2606.21008v3
doc_title: "The Metanym Game: An LLM Benchmark Without Ground Truth That Rises With the Models It Measures"
section_id: sec-001-introduction
section_title: "Introduction"
section_number: null
pages: 1-2
source_pdf: arxiv-2606.21008v4.pdf
source_sha256: 2a2900edc6101f3f
toc_source: outline
---
Nearly every benchmark for machine intelligence needs a predetermined ground truth — golden
keys and labels, oracle models, human panels. The benchmark reported here needs none of that.
It is a game where frontier language models compete in making up analogies and then grade one
another, and that grading is the single source of every score: no human raters, no answer key, nothing
to look up.
The test is the metanym game. A player authors, from nothing, a context template — a paragraph of
fixed wording with open slots — together with the sets of keywords that fill it, each set instantiating
the template as a factually true description of a different domain; the keywords in corresponding
slots are metanyms, metaphorically synonymous, and a set of them a metanym set. Figure 1 shows
one, written by a player. Its instantiations are each other’s metaphors and, as a set, parallel contexts:
children of a common archetypal context, the abstract structure they share, of which the template is
the literal representation. A long tradition treats seeing one structure across wildly different domains
as central to thought and tests whether you recognise it; the game tests whether you can build it.
Because a contestant’s items are written in the run, they cannot have been trained on; because cor-
rectness is settled sentence by sentence, the players’ own verdicts suffice — one matrix of their
factual ratings reveals which judges are competent, with no labels at all (§3.3), and that subset is
1
arXiv:2606.21008v4  [cs.CL]  19 Sep 2026
Preprint. arXiv:2606.21008 v3, September 2026.
seated as the council that grades everyone. The canonical twelve-model run (§4) finds that judge-
ment is the bottleneck — on this roster the strongest generators are middling judges — and that the
key-free total tracks GPQA Diamond at Pearson r = 0.98, audited for a leak and found clean.
Contributions. (i) A production task for analogy that is falsifiable sentence by sentence, hence
scorable without a key. (ii) A two-sided spectral estimator: one SVD of the self-produced factual
rating matrix reads evaluator competence off the left singular vector and generator factuality off
the right. (iii) A key-free reliability gate for subjective criteria: invariance under a sweep of the
calibration anchor. (iv) A self-administering council with contestable seats. (v) The generation–
judgement dissociation, and the r = 0.98 replication of a keyed benchmark by a key-free one,
audited.
2
THE METANYM GAME
An archetypal context is the cross-domain isomorphism General Systems Theory studies (von Berta-
lanffy, 1968). Figure 1 is one archetype as a player wrote it — the first of the submission that
became the run’s anchor (§4.1). One template, mechanically swappable metanyms, true sentence
by sentence across maximal domain distance: that is what makes a metanym game decidable, and
therefore measurable.
In its metanym table, MEMORY is realised as a bacterium’s methylation state, a climber’s route
memory, a professional’s experience, an optimiser’s momentum term and an ant’s path integration
— five mechanisms that are metaphorically synonymous in the archetypal context — metanyms.
Each parallel context is played in two forms: the instantiation, the mechanical substitution — only
the slots filled, every other word carried over — the form the factual criterion is written for, since
it must come out true sentence by sentence (the judge sees both); and the idiomatic rewrite in the
target domain’s own register, showing the claim is not an artefact of the template’s phrasing.
The game has N players and a non-competing administrator. Generation: a player creates archety-
pal contexts from scratch — a portfolio of K templates, M metanym sets each (five and five here),
with instantiation and rewrite for every set. Evaluation: a player scores other players’ submissions
on the rubric axes (§3.2) against one fixed reference submission pinned at an anchor value. A pass
yields submission ratings for each portfolio and evaluator ratings for the judges: how well one
detects the factual errors the other players collectively flag (factual competence), and how stable a
standard it holds when the reference is re-pinned (rating consistency, §3.3). Each act is itself rated,
so the framework is fully self-contained: no human raters, no external key.
3
