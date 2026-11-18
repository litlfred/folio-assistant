---
doc_id: arxiv-2607.00053v1
doc_title: "SWE-Router: Routing in Multi-turn Agentic Software Engineering Tasks"
section_id: sec-012-does-conditioning-on-the-partial-trajectory-impr
section_title: "Does conditioning on the partial trajectory improve over prompt-only baselines?"
section_number: null
pages: 4-4
source_pdf: arxiv-2607.00053v1.pdf
source_sha256: f55db25135d0d28c
toc_source: inferred
---
over prompt-only baselines?
The cost–resolved routing
curves in Figure 2 gives a clear summary of the advantage of
using partial trajectory for temporal routing. SWE-Router
(green) sits above the random-assignment band in both
pairs and traces a Pareto frontier that strictly dominates the
embedding-baseline curves over most of the cost range. The
picture also holds qualitatively for deepseek-v3.2 →
gemini-3-pro-preview, where the green curve again
passes above the random band at intermediate cost. We also
present the computed ROC-AUC and Route-AUC values
of each method in Table 2. In the test split of SWE-Bench
Verified, both pairs show significant improvement in
Route-AUC over the baselines. When deepseek-v3.2
is used as m1, SWE-Router shows Route-AUC of 0.780,
which is a +15.3 pp improvement over the non-temporal
routing baseline (K = 0). While the router trained with
gpt-5-mini’s trajectories for m1 also exhibits +12 pp
improvement over the strongest baseline. AUROC eval-
uations in the test split of SWE-Bench Verified show that
the accuracy of value functions are not strongly correlated
to actual routing performances, as can be shown from the
AUROC of non-temporal router in the deepseek-v3.2
→gemini-3-pro-preview pair.
We further note
that on both pairs the SWE-Router curve briefly passes
above the all-strong ⋆. This synergy is feasible because
weak and strong solve non-identical instance subsets, so
correctly routing the easy instances to m1 resolves cases on
which always-strong fails. The overall shape of the routing
curves, also measured through AUC metrics in Table 2,
is evidence that the value-head ranking captures a useful
complementarity signal for efficient temporal routing.
