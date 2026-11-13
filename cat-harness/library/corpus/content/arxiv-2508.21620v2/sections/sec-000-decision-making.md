---
doc_id: arxiv-2508.21620v2
doc_title: "Introduction to the Analysis of Probabilistic"
section_id: sec-000-decision-making
section_title: "Decision-Making"
section_number: null
pages: 1-2
source_pdf: 2508.21620v2.pdf
source_sha256: df2697ddad318501
toc_source: outline
---
Agustinus Kristiadi
Western University and Vector Institute, Canada
https://agustinus.kristia.de
Abstract
Decision theories offer principled methods for making choices under various
types of uncertainty. Algorithms that implement these theories have been success-
fully applied to a wide range of real-world problems, including materials and drug
discovery. Indeed, they are desirable since they can adaptively gather information to
make better decisions in the future, resulting in data-efficient workflows. In scien-
tific discovery, where experiments are costly, these algorithms can thus significantly
reduce the cost of experimentation. Theoretical analyses of these algorithms are cru-
cial for understanding their behavior and providing valuable insights for developing
next-generation algorithms. However, theoretical analyses in the literature are often
inaccessible to non-experts. This monograph aims to provide an accessible, self-
contained introduction to the theoretical analysis of commonly used probabilistic
decision-making algorithms, including bandit algorithms, Bayesian optimization,
and tree search algorithms. Only basic knowledge of probability theory and statis-
tics, along with some elementary knowledge about Gaussian processes, is assumed.
arXiv:2508.21620v2  [cs.LG]  23 May 2026
Chapter 1
Decision-Making
“Philosophically minded students of probability nimbly skip among these
different ideas [frequentist and Bayesian], and take pains to say which
probability concept they are employing at the moment. The vast majority of
the practitioners of probability do no such thing. They go on talking of
probability, doing their statistics and their decision theory oblivious to all this
accumulated subtlety. [...] Extremists of one school or another argue
vigorously that the distinction is a sham, for there is only one kind of
probability.”
Hacking (2006, pp. 14)
Humans make decisions constantly: “What to eat for dinner?”, “Which university to attend?”,
“What is a good rule-of-thumb when arriving in a foreign place?”, etc. Artificial intelligence
(AI) systems can also benefit from human-like decision-making.
To formulate decision-making processes, decision theory has been developed (Wald, 1949).
Let D be data and 𝑓a latent variable/parameter, generated under an unknown joint distribution
𝑝(D, 𝑓). Furthermore, let 𝑎∈A be the set of all possible actions that can be taken, and let
𝑢( 𝑓, 𝑎) be a utility function that measures the “compatibility” of 𝑎and 𝑓.1
Example 1.1. D could be a list of symptoms and 𝑓a disease. The set of A contains possible
drugs that can be taken. The utility function 𝑢indicates the effectiveness of a drug against a
disease.
There are two, non-mutually-exclusive ways to view statistical decision-making: Bayesian and
frequentist. As indicated in the epigraph of this chapter, in this text, we accept that they are both
valid and useful for different purposes.
