---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-011-optimality-and-competitive-ratio
section_title: "Optimality and Competitive Ratio"
section_number: null
pages: 27-28
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Having established exactly what we are considering an “optimal comparator,” let us now
characterize it. Notice that the best strategy in hindsight is to just identify and pull the
12
arm i⋆= arg maxi
PT
t=1 fi(t) the entire time. (Proposition 1 in [HKR16]2). We will often
refer to how things compare to the “optimal” arm; when we say that, we are referring to
that arm. For simplicity of notation, we elide the i and refer to this arm as f⋆(·) . The
reward of playing the optimal arm for the whole time horizon T is OPTT , which we may
refer to as OPT , and we say playing the best arm for T ′ steps accrues reward OPTT ′ .
Our goal is to maximize the expected reward ALGT achieved by our algorithm, i.e.,
find a sequence of pulls which gives us the maximum cumulative reward over the T time
steps (in expectation over internal randomness in the algorithm)3.
Next, we can show that it is impossible to achieve sublinear additive regret.
Example 2. Suppose one arm linearly increases from 0 to 1/2 until time T/2 , and then
flattens out, and the other arm increases with the same slope throughout until time T .
The algorithm has no way of distinguishing which arm it is playing until time T/2 +1 . At
this point, if it finds it is playing the first arm, switching to the other arm is worse than
continuing to play the first arm. Since there is an Ω(T) gap between the rewards of the
two arms, no algorithm can achieve o(T) regret.
Accordingly, we aim to minimize the approximation factor, which we define as follows.
Definition 2.2.2. Suppose the expected reward achieved by the algorithm is ALG and
the optimal reward achievable is OPT . Then, we say that our algorithm achieves a g-
approximation to the optimal reward if ALG ≥OPT/g .
Not only is approximation factor a natural objective to study (it is fundamental, as
defined in the textbook of [BEY05]), but also it is the metric on which we could hope
to understand the problem better.
As discussed earlier, achieving sublinear regret in
general is impossible, and indeed achieving any non-trivial guarantee with high probability
is impossible.
To see this, consider a distribution over instances in which there are k
arms: k −1 of them increase until time 2T/k and then flatten, and one arm (chosen
randomly) increases linearly throughout.
For any algorithm, with probability at least
1/2 , the algorithm will never receive reward better than 2T/k , because the algorithm can
choose at most k/2 arms to play more than 2T/k times. Thus, achieving a non-trivial
guarantee with high probability is not possible.
2.2.3
