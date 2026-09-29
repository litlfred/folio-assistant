---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-014-worst-case-setting
section_title: "Worst-Case Setting"
section_number: null
pages: 31-32
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Having defined the problem we study in this part, let us turn our attention toward solving
this problem in the worst case. It is standard in theoretical computer science to study
worst-case guarantees.
Typically, we have an algorithm playing against an adversary.
The role of the adversary is to pick the instance on which the algorithm must perform,
and the algorithm’s goal is to solve some optimization problem on that instance.
As
indicated by the name, in what we will call the worst-case perspective, the adversary
could, if they wished, choose the worst possible instance for that algorithm. That is, the
algorithm is playing against an adversary who has access to its details (think pseudocode),
but not any specific randomness used. Thus, if the algorithm A ∈A (the class of all
randomized algorithms) is solving an optimization problem with (maximization) objective
V on instance I ∈I , the goal of the algorithm designer is to design the algorithm that
solves the following minimax objective:
max
A∈A min
I∈I V(A(I))
(3.1)
Once again, note that in this objective, the algorithm designer must commit to the al-
gorithm before the adversary chooses the instance I . Equivalently, the adversary has
knowledge of the algorithm before choosing the instance and so can pick the worst possi-
ble instance for that algorithm. Thus, the algorithm designer must design an algorithm
such that its performance on the worst instance for it is better than any other algorithm’s
performance on its respective worst instance.
In our improving multi-armed bandits setting, an instance is a collections of arms. An
algorithm identifies a sequence of arms to pull that attempts to maximize the total reward
(or the maximum reward seen). In this chapter, we study this problem in the worst case
perspective. In doing so, we identify an instance on which no randomized algorithm can
surpass a certain performance. Thus, if the adversary chooses that instance as the one on
which to evaluate our algorithm, we cannot hope to do better than that performance. We
then devise an algorithm that achieves nearly that performance on arbitrary instances.
16
Recall that the performance metric we study is competitive ratio (as opposed to regret as
is standard in the bandits literature).
In [PNGK23], the authors study deterministic algorithms and show tight upper and
