---
doc_id: arxiv-2508.21620v2
doc_title: "Introduction to the Analysis of Probabilistic"
section_id: sec-002-frequentist-decision-theory
section_title: "Frequentist decision theory"
section_number: null
pages: 3-5
source_pdf: 2508.21620v2.pdf
source_sha256: df2697ddad318501
toc_source: outline
---
Frequentist statistics assumes that probabilities represent long-running relative frequency: “What
is the occurrence of a disease in a given population?”, “The error rate of this program is 1%”,
etc. That is, if we sample the data again and again, what is the proportion of a case of interest?
Notice that, here, the data is therefore assumed to be random.
Thus, in contrast to the previous section, frequentist decision theory assumes that 𝑓, while
still unknown, is fixed and D is generated through D ∼𝑝(D | 𝑓). Notice that, here, the roles of
D and 𝑓are reversed compared to their roles in the Bayesian decision theory. Since D is now
random, we aim to find an optimal function 𝛿∗that maps a realization of data to an action:
𝛿∗= argmax
𝛿
ED∼𝑝(D| 𝑓) [𝑢( 𝑓, 𝛿(D))].
(1.2)
or, equivalently,
𝛿∗= argmin
𝛿
ED∼𝑝(D| 𝑓) [ℓ( 𝑓, 𝛿(D))],
(1.3)
where ℓ= −𝑢is the so-called loss function. That is, we want to find the best “policy” 𝛿∗that
works in various situations D ∼𝑝(D | 𝑓). The function 𝑢is interpreted as measuring how good
it is to do an action 𝛿(D) under the data D given that 𝑓is the underlying parameter that generates
D.
2
1 Decision-Making
Example 1.4. Under the setting of Example 1.1, suppose a public health organization wants to
recommend a policy/rule—a “what-to-do” guideline—for the general population. The goal is
then to find a policy 𝛿∗such that when presented with a set of symptoms D, it recommends a drug
𝑎for treating the underlying, unknown disease 𝑓.
However, notice that 𝑢depends on 𝑓, which we have assumed to be unknown. It follows that
we cannot even compute 𝑢( 𝑓, 𝛿(D)) and thus we cannot perform the maximization. We do not
have such a problem in the Bayesian case since we have a belief about 𝑓.
To circumvent this issue, we need to take 𝑓out of the equation. One way to do so is as follows.
Let 𝑅( 𝑓, 𝛿) = ED∼𝑝(D| 𝑓) [ℓ( 𝑓, 𝛿(D))] be the risk function. Then, we find the optimal decision
function 𝛿∗that minimizes the worst-case risk:
𝛿∗= argmin
𝛿
max
𝑓
𝑅( 𝑓, 𝛿).
(1.4)
Continuing the previous example, the minimax decision function has the interpretation that it is
the one that is optimal under the worst-case risk when we consider various plausible alternatives
of the underlying diseases 𝑓.
Example 1.5. If we think 𝑓could be “cold”, “malaria”, and “COVID-19”, then we want to
provide a treatment guideline that would be relatively effective for every possible 𝑓. Note that 𝛿∗
might not be the best possible guideline for each individual 𝑓.
Remark 1.6. Should you be Bayesian or frequentist? Both! Hopefully, the epigraph and
the discussion in this chapter convinced you that being both is the correct move. They are
different tools for different situations and goals.
3
Chapter 2
