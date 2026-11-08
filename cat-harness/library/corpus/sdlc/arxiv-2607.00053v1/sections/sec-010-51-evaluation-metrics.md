---
doc_id: arxiv-2607.00053v1
doc_title: "SWE-Router: Routing in Multi-turn Agentic Software Engineering Tasks"
section_id: sec-010-51-evaluation-metrics
section_title: "Evaluation Metrics"
section_number: 5.1
pages: 3-3
source_pdf: arxiv-2607.00053v1.pdf
source_sha256: f55db25135d0d28c
toc_source: inferred
---
Threshold-free metrics. AUROC is the standard ROC-
AUC of ˆr1(T≤K,1) as a binary classifier of r and measures
only the value head’s discriminative quality. Route-AUC is
the normalised area under the cost–vs–resolved-rate curve
obtained by sweeping the routing threshold; both axes are
normalised so the all-weak point is (0, 0) and the all-strong
point is (1, 1). Hence 0 corresponds to cost-proportional
Algorithm 1 SWE-Router: one-sided routing (deployment).
Require: problem q; weak model m1, strong model m2;
value head ˆr1; exploration budget K; threshold λ′′
(tuned on validation).
1: Initialise T ←[q].
2: for t = 1 to K do
3:
Run m1 for one step: append (zt, at, ot) to T .
4:
if at = submit then
5:
Return m1’s patch (early termination).
6:
end if
7: end for
8: Compute ˆr1(T ) from the value head’s last-token logits.
9: if ˆr1(T ) ≥λ′′ then
10:
Continue with m1 from turn K+1 until aT
=
submit; Return its patch.
11: else
12:
Restart with m2 from q; Return m2’s patch.
13: end if
interpolation between the two LLMs and 1 matches the
strong model’s resolved rate at the weak model’s cost.
