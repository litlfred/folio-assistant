---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-062-introduction
section_title: "Introduction"
section_number: null
pages: 93-94
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Scholars across various fields have long been interested in understanding how humans make
decisions between immediate and long-term rewards in the face of uncertainty. Costs asso-
ciated with a given action can also greatly influence how agents make these decisions, and
so we wish to understand how to support exploratory and ambitious behavior, particularly
in groups who have historically faced lack of access to such opportunities. One important
factor that has received much attention in recent years is grit, with researchers across
various fields studying the role resilience and optimism play not only in an individual’s
success but also in lifting disadvantaged communities out of bad circumstances.
While it is difficult to give a single, unifying definition of grit, philosophers Jennifer
Morton and Sarah Paul provide a thesis that serves as our guiding qualitative description.
They highlight that grit is rational (distinguishing it from delusional optimism) and that
it is an outcome of beliefs an agent holds about their circumstances. In more detail:
“Grit is not simply the ability to withstand the pain of effort and setbacks, or
to resist the siren song of easier rewards; it is a trait or capacity that consists
partly in a kind of epistemic resilience.
This is a descriptive rather than a normative claim, and it has not gone unno-
ticed by psychologists who study perseverance. Angela Duckworth emphasizes
the relevance of hope in underwriting the capacity for grit, where hope is de-
fined as the expectation that one’s efforts will pay off. And Martin Seligman
touts the importance of optimism, which involves a distinctive style of explain-
ing to oneself why good and bad events happen.” [MP19]
Individuals with grit are able to persevere despite the lack of immediate reward: for
instance, they are more willing to practice a math or sport skill until it is mastered, or they
are willing to tolerate a significant degree of financial austerity while starting a company
until revenue is accrued.
For a long time, prevailing guidance in educational settings focused heavily on personal
characteristics such as grit, discipline, and resilience as the way to succeed in ambitious
ends [Gib20], often even at the protest of the scholars whose work was used to justify this
perspective [Kam15].
Subsequent longitudinal work paints a more ambivalent picture,
78
studying outcomes for students from disadvantaged backgrounds who follow those lessons
in attempting to succeed at ambitious long-term ends such as college; these works find
that simply pushing grit can often have negative effects [MP19, Woo22]. These findings
highlight an empirical tension, that grit is useful in pursuing long-term ends that require
investment but can make those who cannot cushion early losses susceptible to the precarity
associated with such ends.
The puzzle posed by these findings posit that grit is not
uniformly positive but perhaps instead conditionally useful. What, then, are the situations
in which grit is productive? Harmful?
In this work, we attempt to bridge this analytic gap by isolating where additional grit
helps and where it hurts via a simple theoretical quantitative model. We also investi-
gate how outcomes are influenced by having financial supplements. Our goal is to study
decision-making dynamics in a controlled, quantitatively-defined setting. By character-
izing the landscape of grit and its interplay with external support, we unify the diverse
empirical observations in this area and provide a model in which further quantitative
analysis can take place. Our work (1) provides further understanding of the relationship
between grit and financial support in succeeding when pursuing ambitious outcomes and
while doing so, (2) introduces a simple two-armed bandit theoretical model that shows
promise as a formalization of a decision-making problem that juxtaposes stable reward
against ambition. Our analysis isolates three crucial parameters – level of grit, amount
of external support, willingness to tolerate discomfort – and develops an understanding
of outcomes as a function of these, reproducing with proof several patterns observed by
qualitative scholars.
7.1.1
