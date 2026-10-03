---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-012-diminishing-returns
section_title: "Diminishing Returns"
section_number: null
pages: 28-29
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
If the rewards are arbitrarily increasing, then we cannot guarantee much: we could have
one arm that gives 0 reward for the first T/2 pulls and reward 1 after that, and k −1
arms that are 0 regardless of how many times they’ve been pulled; the good arm and the
bad arms in this case are indistinguishable until it is too late. Thus, prior papers on this
problem [HKR16, PNGK23] consider reward functions that have diminishing returns, i.e.,
2We emphasize that this is still different from the comparator in external competitive ratio / regret,
because the policy of playing a single arm for all time induces a different (and stronger) sequence of rewards
than the sequence of rewards the comparator is evaluated on in the external setting.
3As is standard in the bandits literature, we define the objective as maximizing cumulative reward.
The reader may notice that in some of the motivating applications, the natural goal instead might be to
maximize the largest single pull. In Appendix A.2, we show how all the results from the paper translate
to this slightly different objective function.
13
where the difference between two consecutive rewards is non-increasing. The continuous
equivalent of this property is concavity. Following [HKR16, PNGK23], we assume that
the reward function for each arm follows the diminishing returns property. Formally,
Definition 2.2.3. A function f is said to have diminishing returns if the following holds
for all t ≥1:
f(t + 1) −f(t) ≤f(t) −f(t −1) .
Finally, we assume that f(0) = 0 for all of the arms.
2.3
