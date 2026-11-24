---
doc_id: arxiv-2607.00053v1
doc_title: "SWE-Router: Routing in Multi-turn Agentic Software Engineering Tasks"
section_id: sec-003-3-value-based-temporal-routing
section_title: "Value-Based Temporal Routing"
section_number: 3
pages: 1-2
source_pdf: arxiv-2607.00053v1.pdf
source_sha256: f55db25135d0d28c
toc_source: inferred
---
work, operationalises this insight (Figure 1): a cheap weak
model m1 runs for a few exploratory turns, then a learned
value head reads the resulting partial trajectory and predicts
whether m1 will eventually solve the task; if this prediction
exceeds a cost-adjusted threshold, m1 continues, otherwise
we escalate to a stronger m2. The value head is super-
vised by binary trajectory rewards and is closely related to
execution-free reward models (SHUM et al., 2026), but oper-
ates on incomplete trajectories and feeds a routing rule. We
also provide a Bayes-optimality result (Theorem 4.1) show-
ing that partial-trajectory conditioning never harms routing
and is strictly better when exploration is informative.
Contributions.
(i) We identify a Bayes-error floor that
any prompt-conditioned router inherits in multi-turn agentic
SWE, and introduce temporal routing on the partial
trajectory; (ii) we instantiate this in SWE-Router, the
first routing framework conditioning on the agent’s own
intermediate observations; (iii) on SWEBench-Verified,
SWE-Router achieves substantial cost reductions at
matched resolution relative to strong prompt-only baselines.
1
arXiv:2607.00053v1  [cs.SE]  30 Jun 2026
SWE-Router
