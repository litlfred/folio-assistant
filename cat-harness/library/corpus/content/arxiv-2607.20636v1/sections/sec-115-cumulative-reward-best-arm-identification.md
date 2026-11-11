---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-115-cumulative-reward-best-arm-identification
section_title: "Cumulative Reward Best Arm Identification"
section_number: null
pages: 158-159
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
In the below sections, we provide comparable BAI guarantees to Section 4.4.2 for cu-
mulative reward instead of maximum reward. As before, we work in the standard improving-bandits
setting with k arms, a known horizon T, and non-decreasing concave reward functions fi.
Each algorithm Hybridα,B has two stages. Stage 1 uses a UCB-style envelope: At each
step, the algorithm computes a lower bound Li(n) and terminal upper bound Ui(n) on
the final accumulated reward of every arm and pulls the arm with the largest optimistic
estimate Ui. If the lower bound of one arm dominates the terminal upper bound of every
other arm, Hybridα,B commits to this arm. If no commit occurs by time B, Stage 2 runs
143
PTRRα and finds an arm whose expected terminal reward is at least a substantial fraction
of the best arm’s.
For the terminal envelope, we define Li(t) := Fi(t)+(T−t)fi(t), △i(t) := (T−t)(T−t+1)
2
γi(t−
1), and Ui(t) := Li(t) + △i(t), where Fi(T) := PT
t=1 fi(t) and γi(t −1) := fi(t) −fi(t −1).
We set Ui(0) := ∞to ensure first pulls. Using concavity and monotonicity, it is again
straightforward to prove that Li(t) ≤Fi(T) ≤Ui(t) for all i, t.
Algorithm 9 Cumulative Hybridα,B
1: Require: m
2: Stage 1: t ←0
3: for each arm i do
4:
ti ←0, Fi ←0, Li ←0, Ui ←+∞
5: end for
6: while t < B do
7:
for each i with ti ≥1 do
8:
Li ←Fi + (T −ti) fi(ti)
9:
γi ←fi(ti) −fi(ti −1)
10:
Ui ←Li + (T−ti)(T−ti+1)
2
· γi
11:
end for
12:
ˆi ←arg maxi Li,
Unext ←maxj̸=ˆi Uj
13:
if Lˆi > Unext then
14:
return ˆi.
15:
end if
16:
i′ ←arg maxi(Ui −Li)
17:
pull i′; ti′ ←ti′ + 1, t ←t + 1, Fi′ ←Fi′ + fi′(ti′)
18: end while
19: Stage 2: τ ′ ←(T −B) −k, m′ ←

τ ′
T

· m
20: for each i do
21:
gi(s) ←fi(ti + s)
22: end for
23: return ˆi ←arm returned by PTRRα with parameters (m′, τ ′) on {gi} for T −B steps.
B.5.6
