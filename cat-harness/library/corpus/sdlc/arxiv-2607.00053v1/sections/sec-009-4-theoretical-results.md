---
doc_id: arxiv-2607.00053v1
doc_title: "SWE-Router: Routing in Multi-turn Agentic Software Engineering Tasks"
section_id: sec-009-4-theoretical-results
section_title: "Theoretical Results"
section_number: 4
pages: 3-3
source_pdf: arxiv-2607.00053v1.pdf
source_sha256: f55db25135d0d28c
toc_source: inferred
---
Viewing routing as a one-step Bayesian decision problem,
the Bayes-optimal expected utility is monotone in the
conditioning σ-algebra. This is the classical “information
never hurts” principle for Bayes decision rules (DeGroot,
1962; Blackwell, 1953), instantiated in our trajectory-
conditioning setting. Let Q be the random task description
and St := [Q, (Z1, A1, O1), . . . , (Zt, At, Ot)] the partial
trajectory after t weak-model turns; by construction Q is a
function of St, so St carries strictly more information than
Q. The improvement is strict whenever the conditional gap
E[U1 −U2 | St] is not σ(Q)-measurable.
Theorem 4.1 (More informative signals improve Bayes-op-
timal routing). Let U1, U2 be integrable latent cost-adjusted
utilities of routing to m1, m2, and define V (Z)
:=
E[max{E[U1 | Z], E[U2 | Z]}] for any signal Z (the Bayes-
optimal expected utility under Z). If Q is determined by St,
then V (St) ≥V (Q).
Proof sketch.
The identity max{a, b} = 1
2(a+b+|a−b|)
gives V (Z) = 1
2E[U1 + U2] + 1
2E[|E[U1−U2 | Z]|]. Since
Q is a function of St, the tower rule yields E[U1−U2 |
Q] = E[E[U1−U2 | St] | Q], and the conditional Jensen in-
equality applied to |·| gives |E[E[U1−U2 | St] | Q]| ≤
E[|E[U1−U2 | St]| | Q].
Taking expectations yields
V (St) ≥V (Q). The full proof is in Section C.
Practical reading.
The decomposition above clarifies
why temporal routing helps. Prompt-only routers operate
at the resolution of E[U1−U2 | Q], which averages out
fine-grained difficulty cues only observable after a few
exploratory turns. The partial trajectory St refines this gap:
instances on which the two models would make similar
predictions get routed cheaply, while hard instances are es-
calated. The improvement is strict whenever exploration is
informative for the cost–benefit comparison; it vanishes only
when the prompt already determines the optimal choice.
5. Experiments
In this section, we explain how the experiments are im-
plemented and evaluated. We provide further details of
experiment in Section A and Section B.
