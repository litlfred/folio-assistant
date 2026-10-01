---
doc_id: arxiv-2508.21620v2
doc_title: "Introduction to the Analysis of Probabilistic"
section_id: sec-001-bayesian-decision-theory
section_title: "Bayesian decision theory"
section_number: null
pages: 2-3
source_pdf: 2508.21620v2.pdf
source_sha256: df2697ddad318501
toc_source: outline
---
Bayesian statistics assumes that probabilities represent beliefs: “I am 50% sure”, “I am quite
confident that this will work”, etc. Decision-making under this framework is then used to take
an action based on one’s (e.g., a model’s) belief about the unknown. Indeed, Bayesian decision
1An alternative view, common in the frequentist formalism, is to replace the utility function with a loss function,
which, w.l.o.g., can be taken as −𝑢.
1
1 Decision-Making
theory assumes that 𝑓is unknown and D is observed, and concerns in finding the best action 𝑎∗
under the posterior belief 𝑝( 𝑓| D) and the utility function 𝑢:
𝑎∗= argmax
𝑎∈A
E 𝑓∼𝑝( 𝑓|D) [𝑢( 𝑓, 𝑎)].
(1.1)
Example 1.2. Under the setting of Example 1.1, a doctor can assess their belief 𝑝( 𝑓| D) of a
patient having a disease 𝑓after observing the patient’s symptoms D. The doctor’s utility function
𝑢encodes their preferences, e.g. whether they are rather risk-averse or risk-taking. The doctor
then prescribes a drug 𝑎∗that maximizes their expected utility under posterior belief.
Example 1.3 (Pascal’s Wager). Let A = {“Believe in God, “Don’t believe in God”} and let
𝑓∈{“God exists”, “God doesn’t exist”}.
Suppose our utility weighs the potential eternal
“reward” or “punishment” in heaven and hell, respectively.
It makes sense, therefore, for
someone to have the utility function 𝑢( 𝑓, 𝑎) s.t.:
• 𝑢(“God exists”, “Believe in God”) = ∞,
• 𝑢(“God doesn’t exist”, “Believe in God”) = 𝑎where −∞< 𝑎< 0; notice that while this
is undesirable (negative utility), 𝑎is finite,
• 𝑢(“God exists”, “Don’t believe in God”) = −∞,
• 𝑢(“God doesn’t exist”, “Don’t believe in God”) = 𝑏where 0 < 𝑏< ∞; where the argu-
ment here is that we gain something that is finite in our lifetime, but nothing more.
In this case, the optimal action 𝑎∗is to “believe in God”, even if a posteriori, 𝑝(“God exists” | D)
is very small. Do note that different utility functions will yield different 𝑎∗.
