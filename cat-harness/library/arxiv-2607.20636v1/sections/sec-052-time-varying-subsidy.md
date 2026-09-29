---
doc_id: arxiv-2607.20636v1
doc_title: "Algorithmic Approaches to"
section_id: sec-052-time-varying-subsidy
section_title: "Time-Varying Subsidy"
section_number: null
pages: 84-86
source_pdf: 2607.20636v1.pdf
source_sha256: 0ae6a9f230342c50
toc_source: outline
---
Without external intervention, once a cascade begins, it persists by definition. However,
is it possible to derive an intervention from an external entity, such as the government,
that can lift a population out of an incorrect cascade and redirect it toward a correct one?
Importantly, can this subsidy be designed so that the correct cascade remains stable once
the subsidy is removed? Note that the na¨ıve strategy of subsidising the “correct” action
fails the sustainability criterion, because upon removal, agents have no reason to believe
that that action was correct. They would simply believe that agents who took it during
the subsidized period did so due to said subsidy. In this section, we focus on the question
of how to design a good intervention for a single group / sequence that has sustainable
effects.
Since a cascade occurs when an agent makes the same decision regardless of their
signal, breaking a cascade requires influencing at least some agents to act according to
their respective private signals. Indeed, this is our approach to designing a subsidy. We
consider subsidies for the “correct” action, which, in this section, we assume to be action
A. The net reward for choosing the correct action is R.
Let the subsidy the government provides at time t be rt.
Recall the two possible
states of the world: world A, where A is the correct action, and world B, where B is the
correct action. Let |A| indicate the number of choices for A outside of a cascade state,
and similarly for |B|. Finally, we assume that the entity providing this subsidy is not
trusted by the agents, and so the agents cannot infer from the direction of the subsidy
which action is correct.
Algorithm 6 implements this subsidy scheme. We assume that this algorithm is applied
after an incorrect cascade has already begun, and the purpose is to strategically provide
a subsidy rt to the agent acting at time t to break the community out of the pessimism
trap. When agents are acting according to their own signals, or when the correct cascade
has been reached, the subsidy need no longer be applied. The guarantees and derivations
for Algorithm 6 are provided in Theorems 6.3.1 and 6.3.2, with complete proofs in the
appendix. The main idea is that once agents act in accordance with their signals, after we
see enough agents reveal their signal, a simple majority vote will, in expectation, reveal
the correct action. At this point, even if the subsidy is removed, rational agents will act
optimistically.
Theorem 6.3.1. The subsidy scheme used in Algorithm 1 causes all agents to act accord-
ing to their signals until the population falls into the correct cascade. The subsidy value is
rt = R

γt−1
1+ 1−p
p γt

, where γt =

1−p
p
2|A|−t 1−p
p .
Proof Sketch We want the subsidy to incentivize taking action A only if it is already
aligned with the agent’s signal. We seek to determine rt such that it ensures action A is
69
Algorithm 6 Redirecting Pessimism Traps
Require: Start of incorrect cascade t′, history Ht′′ for t′′ ≥t′, (T −t′′) >>
4
2p−1, correct
action A, incorrect action B, private signals {s}T
t=1, signal strength p, reward R for
correct action
1: |A| ←choices for A in ¯Ht′−1
2: |B| ←choices for B in ¯Ht′−1
3: t ←t′′
4: while t < T do
5:
if |A| −|B| ≤−2 (In incorrect cascade) then
6:
γt ←

1−p
p
2|A|−t 1−p
p
; rt ←R

γt−1
1+ 1−p
p γt

7:
else
8:
rt ←0
9:
end if
10:
if rt + R · P [EA | Ht−1, st] > R · P [EB | Ht−1, st] then
11:
Agent chooses action A
12:
if |A| −|B| ≤1 (Not in cascade) then
13:
|A| = |A| + 1
14:
end if
15:
else
16:
Agent chooses action B
17:
if |A| −|B| ≤1 (Not in cascade) then
18:
|B| = |B| + 1
19:
end if
20:
end if
21:
Update history and increment t
22: end while
70
at least as preferable when St = A and less preferable when St = B. That is, we want rt
to satisfy the following conditions, so we simply solve:
(1) rt+R · P [EA | Ht−1, st = A] ≥R · P [EB | Ht−1, st = A]
(2) rt+R · P [EA | Ht−1, st = B] ≤R · P [EB | Ht−1, st = B]
Due to the fact that the subsidy induces signal-revealing, in order to compute the
posterior, we can view the history as a series of revealed signals and consider the likelihood
of seeing that stream in each of the worlds.
□
Theorem 6.3.2. In expectation, the subsidy is provided over fewer than
4
2p−1 rounds and
totals no more than R
4
2p−1.
Proof Sketch To show this, we appeal to the random walk formulation discussed
above. If the subsidy value is too small, the agent will decide based on the history, if the
subsidy value is too large, the agent will choose the subsidized action, and if the subsidy
is “just right,” the agent will act according to their signal. The first two cases correspond
to not taking any steps on the random walk, and the last case corresponds to taking a
step in the direction of the signal on the random walk. Thus, we can analyze the number
of total steps that need to be taken in order to net sufficiently many steps to the correct
directions. We apply Wald’s equation to do this. A detailed computation can be found in
Appendix C.5.2.
□
6.4
