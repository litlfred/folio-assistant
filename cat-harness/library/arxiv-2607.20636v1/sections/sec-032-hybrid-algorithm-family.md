---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-032-hybrid-algorithm-family
section_title: "Hybrid Algorithm Family"
section_number: null
pages: 55-55
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
We now define the hybrid algorithm family. As before, we work in the standard improving-bandits
setting with k arms, a known horizon T, and non-decreasing concave reward functions fi.
Each algorithm Hybridα,B has two stages. Stage 1 uses a UCB-style envelope: At each
step, the algorithm computes a lower bound Li(n) and terminal upper bound Ui(n) on the
final reward fi(T) of every arm and pulls the arm with the largest optimistic estimate Ui.
If the lower bound of one arm dominates the terminal upper bound of every other arm,
Hybridα,B commits to this arm. If no commit occurs by time B, Stage 2 runs PTRRα
and finds an arm whose expected terminal reward is at least a substantial fraction of the
best arm’s.
For the terminal envelope, we define Li(t) := fi(t), △i(t) := (T −t)γi(t −1), and
Ui(t) := Li(t) + △i(t), where γi(t −1) := fi(t) −fi(t −1).
We set Ui(0) := ∞to
ensure first pulls. Using concavity and monotonicity, it is straightforward to prove that
Li(t) ≤fi(T) ≤Ui(t) for all i, t (see Lemma B.5.3 in Appendix B.5.3).
Definition 4.4.1. Define the family of algorithms Hybrid := {Hybridα,B(Algorithm5) :
α ∈(0, 1] and B ∈[T]}.
4.4.2
