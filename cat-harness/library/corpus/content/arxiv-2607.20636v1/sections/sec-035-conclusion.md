---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-035-conclusion
section_title: "Conclusion"
section_number: null
pages: 58-61
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
We provide beyond worst-case guarantees for the improving multi-armed bandits problem.
Employing the lens of data-driven algorithm design, we show that using sampled instances
from a distribution, we can find algorithms that are near-optimal for instances arising from
that distribution. We introduce two novel and interesting families of algorithms. Our first
family achieves stronger competitive ratios that depend on the strength of concavity of
the reward curves, and the second achieves a best-of-both-worlds guarantee on benign as
well as worst-case instances which prior techniques in the literature fail to achieve.
Our work opens up several directions for future research.
It would be interesting
to extend our notion of strength of concavity to more refined arm-dependent and piece-
wise structures with unknown switching times, where techniques for “tracking regret”
[HW01, SBD20] might be helpful. Our best-of-both-worlds results mirror known “benign”
43
regimes where sublinear regret is possible, but it would interesting to determine the precise
necessary and sufficient conditions for achieving sub-linear regret in improving bandits.
Computationally efficient implementation and sample complexity lower bounds are con-
crete questions raised by our offline-to-online hyperparameter transfer results. Finally, it
would be interesting to develop similar guarantees for variants of the improving bandits
model studied in the literature, including stochastic (arm reward means are concave non-
decreasing, with sub-Gaussian variance) and restless (arms evolve with time, not pulls)
versions.
44
Part II
Social Epistemology
45
Chapter 5
