---
doc_id: arxiv-2607.00053v1
doc_title: "SWE-Router: Routing in Multi-turn Agentic Software Engineering Tasks"
section_id: sec-007-21-multi-turn-trajectories-in-agentic-tasks
section_title: "Multi-turn Trajectories in Agentic Tasks"
section_number: 2.1
pages: 2-2
source_pdf: arxiv-2607.00053v1.pdf
source_sha256: f55db25135d0d28c
toc_source: inferred
---
In agentic systems, the LLM autonomously interacts with
an environment before producing a final outcome, such as
the ReAct framework (Yao et al., 2023) producing a thought
zt, an action at, and an observation ot each turn (Yang
et al., 2024a;b). Given a problem description q, a complete
SWE-agent trajectory T takes the form
T (m) = [q,
(z1, a1, o1),
. . . ,
(zT , aT , oT )],
(1)
where m denotes the LLM that generated the trajectory.
The final action aT is submit, whose observation oT is a
git patch. The patch is checked against the repository’s unit
tests and assigned a verifiable binary reward r ∈{0, 1}.
2.2. LLM Routing
An LLM router improves the cost–performance Pareto fron-
tier by invoking a minimum-cost model with sufficient ca-
pability. In the binary setting it picks between a weak model
m1 and a strong model m2 given q (“weak/strong” refers to
cost–capability rather than parameter count); model-indexed
quantities are subscripted 1, 2. The router invokes m1 when
its cost-adjusted expected success rate exceeds m2’s:
Invoke
(
m1 if ˆr1(q) −λc1 > ˆr2(q) −λc2
m2 otherwise,
(2)
where ˆri(q) ∈[0, 1] is the estimated probability mi resolves
q, ci > 0 is its expected inference cost (USD; on long
agentic trajectories cost is model-dominated, so we treat
ci as q-independent). Costs are converted into success-
probability units by λ > 0; tuning λ traces the cost–quality
Pareto curve (Ong et al., 2025; Jitkrittum et al., 2025).
In agentic settings q often does not pin down task difficulty:
early turns reveal feedback (file structure, error patterns,
search depth) that the issue text lacks. The decision in
Equation (2) therefore frequently inherits large Bayes error,
motivating a router that can read the partial trajectory.
3. Value-Based Temporal Routing
We
run
m1
for
K
turns
to
collect
T≤K,1
=
[q, (z1, a1, o1), . . . , (zK, aK, oK)] and train a value func-
tion ˆr1(T≤K,1) as a pretrained LLM with a small classifi-
cation head, supervised by the binary reward r via cross-
entropy. On escalation, m2 restarts from q: continuation
rules need expensive online m2 inference, and conditioning
m2 on m1’s reasoning has been seen to bias m2 toward
m1’s mistakes. The K weak-model turns are paid up-front
and counted in any escalated run’s cost. With per-turn weak
cost c < c1, the rule is
(
Continue with m1
if
y1 ≥y2
Switch to m2 from the K-th step
otherwise,
(3)
where y1 = ˆr1(T≤K,1)−λ(c1 −Kc) and y2 = ˆr2(q)−λc2.
SWE agents typically spend their early turns locating
files and isolating failures — exploration cheaper than
patch synthesis, so delegating it to m1 is a useful division
of labor.
Two simplifications turn Equation (3) into a
one-hyperparameter rule: (i) Threshold reduction: absorb
λ(c1−c2−Kc) into a single scalar λ′ tuned on validation,
so “continue iff ˆr1 −ˆr2(q) ≥λ′”; (ii) One-sided routing:
treat ˆr2 as an unknown trajectory-independent constant,
giving “continue iff ˆr1 ≥λ′′”. We use one-sided routing
