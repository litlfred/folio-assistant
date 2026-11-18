---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-092-lower-bound
section_title: "Lower Bound"
section_number: null
pages: 126-127
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
bit of care. In this section, we formally argue the small changes we make in order for the
results in the main paper to translate to this different objective.
A.2.1
Lower Bound
We use the same construction and game as before but now directly argue about the pull
with maximum reward rather than the sum. For this we have that the algorithm’s expected
reward can be upper bounded as follows:
ALG = P [E] · Reward under event E + P [Ec] · Reward under event Ec
(A.1)
≤
√
k
k 1 + 1 · 1
√
k
=
2
√
k
(A.2)
= 2 OPT
√
k
.
(A.3)
So we have that the competitive ratio is at least Ω(
√
k) as before.
A.2.2
Upper Bound
The following facts allow us to directly translate the theorem statements to equivalent
ones under this new objective function.
Fact A.2.1. For a given function f satisfying the diminishing returns property, we can
relate the area under the function to its maximum value m as follows:
mT ≥
T
X
t=1
f(t) ≥mT
2
.
Fact A.2.2. Out of a given set of functions F , each satisfying the diminishing returns
property, define f⋆
1 := arg maxf∈F f(T) and f⋆
2 := arg maxf∈F
PT
t=1 f(t) . Then, we have
that f⋆
1 (T) ≤2f⋆
2 (T) .
Proof. We have that:
111
f⋆
2 (T) · T ≥
T
X
t=1
f⋆
2 (t)
(A.4)
≥
T
X
t=1
f⋆
1 (t)
(A.5)
≥f⋆
1 (T) · T
2
.
(A.6)
Thus, we use that OPTT ≥f⋆
1 (T)·T
2
.
Fact A.2.3. The maximum reward achieved in a single pull over the course of running
the algorithm is at least the average reward per pull over the pulls of the algorithm, which
is exactly the sum of rewards achieved by the algorithm, referred to as ALG in the main
body of the paper, divided by T .
Putting these three facts together, we have:
1. Translating Theorem 3.3.4.
The maximum pull by the algorithm is at least
ALG/T , which by the theorem is at least OPT/(8c2T
√
k) ≥f⋆
1 (T)/(16c2
√
k) . Thus,
the O(
√
k) competitive ratio still holds.
2. Translating Theorem 3.4.3. By the same argument above, we divide both sides
of the result by T and get that the maximum pull by the algorithm is at least
1/O(
√
k log k) fraction of the maximum pull achievable.
3. Translating Lemma 3.4.4. By the same argument as before, we divide both sides
by T to get that the maximum pull of the algorithm is at least 1/(16384
√
k log(128k))
fraction of the maximum pull achievable.
A.3
