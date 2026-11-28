---
doc_id: arxiv-2607.00053v1
doc_title: "SWE-Router: Routing in Multi-turn Agentic Software Engineering Tasks"
section_id: sec-021-c-proof-of-theorem-41
section_title: "Proof of Theorem 4.1"
section_number: C
pages: 10-10
source_pdf: arxiv-2607.00053v1.pdf
source_sha256: f55db25135d0d28c
toc_source: inferred
---
Proof. Let ∆:= U1 −U2. Using the identity
max{a, b} = 1
2(a + b + |a −b|),
we obtain, for any signal Z,
V (Z) =
1
2E[U1 + U2] +
1
2 E
 

E[∆| Z]

 
.
The first term does not depend on Z, so
V (St) −V (Q) =
1
2 (E[|E[∆| St]|] −E[|E[∆| Q]|]) .
Since Q is a function of St, the tower property of conditional expectation gives
E[∆| Q] = E

E[∆| St]

 Q

.
Applying Jensen’s inequality with the convex function φ(x) = |x| conditionally on Q,

E[∆| St] | Q

 ≤E

|E[∆| St]|

 Q

,
and taking outer expectations on both sides yields
E[|E[∆| Q]|] ≤E[|E[∆| St]|] .
Hence V (St) ≥V (Q), and equality holds iff E[∆| St] is σ(Q)-measurable, i.e., the partial trajectory carries no information
about ∆beyond the prompt.
