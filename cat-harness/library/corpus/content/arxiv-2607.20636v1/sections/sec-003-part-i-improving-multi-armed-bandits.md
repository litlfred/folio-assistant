---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-003-part-i-improving-multi-armed-bandits
section_title: "Part I: Improving Multi-Armed Bandits"
section_number: null
pages: 19-20
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Chapter 2
In this chapter, we present preliminaries for the improving multi-armed ban-
dits (IMAB) problems, first introduced by [HKR16]. The study of IMAB comprises the
first half of this thesis. In this setting, there are a set of options to choose between. Each
option has some final reward but we are not lucky enough to know the final outcome.
Instead, we get rewards along the way that increase toward the final reward in an unpre-
dictable way. We motivate this abstraction through various real-world circumstances it
could reflect before formalizing it. Toward that, we first clarify the adversary model and
performance comparator. Then, we discuss the measures of quality and optimality under
those measures. We also review related work to highlight known results and specify where
our work fits into the broader landscape.
Chapter 3
We characterize decision-making when investment is required via the (IMAB)
problem. In this chapter, we take the traditional worst-case perspective. In particular,
we assume that an oblivious adversary can pick a worst-case instance on which to deploy
4
our (randomized) algorithm. We provide a lower bound under minimal assumptions and
match it up to logarithmic factors with an upper bound. In fact, we show that no algo-
rithm can achieve better than an Ω
√
k approximation factor against the optimal reward,
where k is the number of bandit arms. We do so by constructing a family of bad instances
and then applying Yao’s principle. Further, we provide a simple randomized algorithm
that achieves O(
√
k log k) approximation factor.
Chapter 4
While the “worst-case” setting is familiar and foundational, it often proves
pessimistic, in particular when lower-bound instances are pathological or brittle. Thus,
it is useful to not only characterize the nature of optimal decision-making in the worst
case but also explore the possibility of leveraging structure in practical instances to do
better. In this chapter, we apply tools from the data-driven algorithm design literature
to the improving multi-armed bandits problem. We study both cumulative reward and
best arm identification objectives.
We identify “niceness” conditions under which we
could hope to do better than the worst-case bounds in the previous chapter, and then we
show that by collecting algorithms that are (near-)optimal under these conditions, we can
develop learnable families of algorithms. Accordingly, we characterize how many historical
instances suffice for learning good algorithms from data. We draw from a wide range of
technical tools; we extend the techniques in the previous chapter and utilize complexity
characterizations of algorithm families from the data-driven algorithm design literature
that allow us to prove uniform convergence bounds in our setting.
1.2.2
